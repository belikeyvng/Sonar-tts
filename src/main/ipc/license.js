const { ipcMain } = require("electron");

const CryptoService = require("../../engines/license/CryptoService");
const LicenseValidator = require("../../engines/license/licenseValidator");
const LicenseEngine = require("../../engines/license/licenseEngine");
const LicenseStore = require("../../engines/license/LicenseStore");

/**
 * Wires up the licensing subsystem and registers
 * all license-related IPC handlers.
 *
 * Call this once from main.js, after `app.whenReady()`.
 */
function registerLicenseIpc(publicKeyPem) {
    const cryptoService = new CryptoService();
    const validator = new LicenseValidator(cryptoService, publicKeyPem);
    const licenseEngine = new LicenseEngine(validator);
    const licenseStore = new LicenseStore();

    // On startup, try to restore whatever was persisted last time.
    const storedLicense = licenseStore.load();
    if (storedLicense) {
        licenseEngine.activate(storedLicense);
    }

    ipcMain.handle("license:activate", async (event, filePath) => {
        const result = licenseEngine.activateFromFile(filePath);

        if (result.success) {
            licenseStore.save(result.license);
        }

        return result;
    });

    ipcMain.handle("license:getStatus", async () => {
        return {
            activated: licenseEngine.isActivated(),
            plan: licenseEngine.getPlan(),
            license: licenseEngine.getLicense()
        };
    });

    ipcMain.handle("license:hasFeature", async (event, feature) => {
        return licenseEngine.hasFeature(feature);
    });

    ipcMain.handle("license:deactivate", async () => {
        licenseEngine.deactivate();
        licenseStore.clear();
        return { success: true };
    });

    // Exposed in case other main-process code (not just IPC) needs it.
    return licenseEngine;
}

module.exports = registerLicenseIpc;