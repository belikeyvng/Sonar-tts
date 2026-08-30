// src/main/ipc/export.js
//
// IPC handlers for audio export: folder selection, settings retrieval,
// and the actual save-with-usage-gating operation. Enforcement lives
// here (main process) rather than the renderer — same reasoning as
// tts:checkTextLength, so it can't be bypassed by editing renderer state.

const { ipcMain, dialog, BrowserWindow } = require("electron");
const fs = require("fs");
const path = require("path");
const ExportStore = require("../../data/settings/ExportStore");

function registerExportHandlers() {
  ipcMain.handle("export:getSettings", async () => {
    const exportPath = ExportStore.getExportPath();
    const usage = ExportStore.getUsage();
    return {
      exportPath,
      used: usage.count,
      limit: ExportStore.FREE_DAILY_EXPORT_LIMIT,
    };
  });

  ipcMain.handle("export:chooseFolder", async (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    const result = await dialog.showOpenDialog(win, {
      properties: ["openDirectory", "createDirectory"],
      title: "Choose export folder",
    });

    if (result.canceled || !result.filePaths[0]) {
      return { ok: false, error: "canceled" };
    }

    const chosen = result.filePaths[0];
    ExportStore.setExportPath(chosen);
    return { ok: true, exportPath: chosen };
  });

  ipcMain.handle(
    "export:saveAudio",
    async (_event, { sourceFilePath, fileName, isPro }) => {
      if (!isPro) {
        const usage = ExportStore.getUsage();
        if (usage.count >= ExportStore.FREE_DAILY_EXPORT_LIMIT) {
          return {
            ok: false,
            reason: "EXPORT_LIMIT_REACHED",
            limit: ExportStore.FREE_DAILY_EXPORT_LIMIT,
            used: usage.count,
          };
        }
      }

      try {
        const exportDir = ExportStore.getExportPath();
        const destPath = path.join(exportDir, fileName);
        fs.copyFileSync(sourceFilePath, destPath);

        if (!isPro) {
          ExportStore.incrementUsage();
        }

        const usage = ExportStore.getUsage();
        return {
          ok: true,
          savedTo: destPath,
          used: usage.count,
          limit: ExportStore.FREE_DAILY_EXPORT_LIMIT,
        };
      } catch (err) {
        return { ok: false, reason: "WRITE_FAILED", message: err.message };
      }
    },
  );
}

module.exports = { registerExportHandlers };