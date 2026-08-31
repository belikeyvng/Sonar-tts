// src/main/ipc/settings.js
//
// IPC handlers for reading/writing persisted user settings. Same
// registration pattern as pdf.js/tts.js/license.js/export.js.

const { ipcMain } = require("electron");
const UserSettings = require("../../data/settings/UserSettings");

function registerSettingsHandlers() {
  ipcMain.handle("settings:get", () => {
    return UserSettings.getSettings();
  });

  ipcMain.handle("settings:save", (event, partial) => {
    return UserSettings.saveSettings(partial);
  });
}

module.exports = { registerSettingsHandlers };