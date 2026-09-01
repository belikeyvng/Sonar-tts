const { app, BrowserWindow, Menu } = require("electron");
const path = require("node:path");
const fs = require("node:fs");
const registerTtsIpc = require("./ipc/tts");

const registerLicenseIpc = require("./ipc/license");
const registerPdfIpc = require("./ipc/pdf");
const { registerExportHandlers } = require("./ipc/export");
const { registerSettingsHandlers } = require("./ipc/settings");
const registerPaymentIpc = require("./ipc/payment"); // NEW

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,

    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  win.loadFile(path.join(__dirname, "../renderer/index.html"));

  win.maximize();

  win.webContents.openDevTools();
}

app.whenReady().then(() => {
  // Remove Electron's default menu
  Menu.setApplicationMenu(null);

  // Licensing must be wired up before windows start
  // asking questions about plan/features.
  const publicKeyPem = fs.readFileSync(
    path.join(__dirname, "../data/licenses/public_key.pem"),
    "utf8",
  );

  const { licenseEngine, licenseStore } = registerLicenseIpc(publicKeyPem); // CHANGED — now destructures both
  registerTtsIpc(licenseEngine);
  registerPdfIpc();
  registerExportHandlers();
  registerSettingsHandlers();
  registerPaymentIpc({ licenseEngine, licenseStore }); // NEW

  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
