const { app, BrowserWindow, Menu } = require("electron");
const path = require("node:path");

function createWindow() {
    const win = new BrowserWindow({
        width: 1280,
        height: 800,

        webPreferences: {
            preload: path.join(__dirname, "preload.js"),
            contextIsolation: true,
            nodeIntegration: false
        }
    });

    win.loadFile(
        path.join(__dirname, "../renderer/index.html")
    );

    win.maximize();
}

app.whenReady().then(() => {
    // Remove Electron's default menu
    Menu.setApplicationMenu(null);

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
});const { app, BrowserWindow, Menu } = require("electron");
const path = require("node:path");
const fs = require("node:fs");                              // ① need this to read the public key

const registerLicenseIpc = require("./ipc/license");          // ② our new module

function createWindow() {
    const win = new BrowserWindow({
        width: 1280,
        height: 800,

        webPreferences: {
            preload: path.join(__dirname, "preload.js"),
            contextIsolation: true,
            nodeIntegration: false
        }
    });

    win.loadFile(
        path.join(__dirname, "../renderer/index.html")
    );

    win.maximize();
}

app.whenReady().then(() => {
    // Remove Electron's default menu
    Menu.setApplicationMenu(null);

    // ③ Licensing must be wired up before windows start
    //    asking questions about plan/features.
    const publicKeyPem = fs.readFileSync(
    path.join(__dirname, "../data/licenses/public_key.pem"),
    "utf8"
);

    registerLicenseIpc(publicKeyPem);

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