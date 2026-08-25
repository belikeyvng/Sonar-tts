const fs = require("node:fs");
const path = require("node:path");

class LicenseEngine {
    constructor(validator) {
        this.validator = validator;
        this.activeLicense = null;
    }

    /**
     * Activate a license object.
     */
    activate(license) {
        const result = this.validator.validate(license);

        if (!result.valid) {
            this.activeLicense = null;

            return {
                success: false,
                reason: result.reason
            };
        }

        this.activeLicense = result.license;

        return {
            success: true,
            license: this.activeLicense
        };
    }

    /**
     * Load a license from a JSON file.
     */
    activateFromFile(filePath) {
        try {
            const licenseData = fs.readFileSync(
                filePath,
                "utf8"
            );

            const license = JSON.parse(licenseData);

            return this.activate(license);

        } catch (error) {
            this.activeLicense = null;

            return {
                success: false,
                reason: "INVALID_LICENSE_FILE"
            };
        }
    }

    /**
     * Whether a valid license is currently active.
     */
    isActivated() {
        return this.activeLicense !== null;
    }

    /**
     * Get the current plan.
     *
     * Unlicensed users are Free.
     */
    getPlan() {
        if (!this.activeLicense) {
            return "free";
        }

        return this.activeLicense.plan;
    }

    /**
     * Check whether the current license
     * provides a specific feature.
     */
    hasFeature(feature) {
        if (!this.activeLicense) {
            return false;
        }

        return this.activeLicense.features.includes(feature);
    }

    /**
     * Return the currently active license.
     */
    getLicense() {
        return this.activeLicense;
    }

    /**
     * Remove the current activation.
     */
    deactivate() {
        this.activeLicense = null;
    }
}

module.exports = LicenseEngine;