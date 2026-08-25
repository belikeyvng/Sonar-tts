const fs = require("node:fs");
const path = require("node:path");
const { app, safeStorage } = require("electron");

class LicenseStore {
    constructor() {
        this.storeDir = path.join(app.getPath("userData"), "license");
        this.storeFile = path.join(this.storeDir, "license.dat");
    }

    _ensureDir() {
        if (!fs.existsSync(this.storeDir)) {
            fs.mkdirSync(this.storeDir, { recursive: true });
        }
    }

    /**
     * Encrypt and persist a license object.
     */
    save(license) {
        if (!safeStorage.isEncryptionAvailable()) {
            return { success: false, reason: "ENCRYPTION_UNAVAILABLE" };
        }

        this._ensureDir();

        const plaintext = JSON.stringify(license);
        const encrypted = safeStorage.encryptString(plaintext);

        fs.writeFileSync(this.storeFile, encrypted);

        return { success: true };
    }

    /**
     * Load and decrypt the stored license, if any.
     * Returns the parsed license object, or null.
     */
    load() {
        if (!fs.existsSync(this.storeFile)) {
            return null;
        }

        if (!safeStorage.isEncryptionAvailable()) {
            return null;
        }

        try {
            const encrypted = fs.readFileSync(this.storeFile);
            const plaintext = safeStorage.decryptString(encrypted);
            return JSON.parse(plaintext);
        } catch (error) {
            // Corrupted, tampered, or undecryptable — treat as no license.
            return null;
        }
    }

    /**
     * Remove the stored license.
     */
    clear() {
        if (fs.existsSync(this.storeFile)) {
            fs.unlinkSync(this.storeFile);
        }
    }

    hasStoredLicense() {
        return fs.existsSync(this.storeFile);
    }
}

module.exports = LicenseStore;