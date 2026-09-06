const { ipcMain } = require("electron");
const os = require("node:os");

const PLATFORM_LABELS = {
  win32: "Windows",
  darwin: "macOS",
  linux: "Linux",
};

function registerSystemIpc() {
  ipcMain.handle("system:getPlatformLabel", () => {
    const platform = os.platform();
    const label = PLATFORM_LABELS[platform] || platform;
    return `${label} ${os.release()}`;
  });
}

module.exports = registerSystemIpc;