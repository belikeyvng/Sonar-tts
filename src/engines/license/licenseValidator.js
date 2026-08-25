const VALID_PLANS = ["free", "plus", "pro"];

class LicenseValidator {
    constructor(cryptoService, publicKey) {
        this.cryptoService = cryptoService;
        this.publicKey = publicKey;
    }

    validate(license) {
        if (!license || !license.payload || !license.signature) {
            return {
                valid: false,
                reason: "INVALID_STRUCTURE"
            };
        }

        const {
            licenseId,
            plan,
            issuedAt,
            expiresAt
        } = license.payload;

        // Required fields
        if (!licenseId || !plan || !issuedAt) {
            return {
                valid: false,
                reason: "MISSING_FIELDS"
            };
        }

        // Valid plan
        if (!VALID_PLANS.includes(plan)) {
            return {
                valid: false,
                reason: "INVALID_PLAN"
            };
        }

        // Verify cryptographic signature
        const signatureValid = this.cryptoService.verify(
            JSON.stringify(license.payload),
            Buffer.from(license.signature, "base64"),
            this.publicKey
        );

        if (!signatureValid) {
            return {
                valid: false,
                reason: "INVALID_SIGNATURE"
            };
        }

        // Check expiration
        if (
            expiresAt !== null &&
            Date.now() > expiresAt
        ) {
            return {
                valid: false,
                reason: "LICENSE_EXPIRED"
            };
        }

        return {
            valid: true,
            license: license.payload
        };
    }
}

module.exports = LicenseValidator;