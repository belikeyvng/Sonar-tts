const fs = require("node:fs");
const path = require("node:path");

const CryptoService = require(
    "../../src/engines/license/CryptoService"
);

const LicenseValidator = require(
    "../../src/engines/license/licenseValidator"
);

const licenseFile = fs.readdirSync(__dirname)
    .find(file =>
        file.startsWith("SONAR-") &&
        file.endsWith(".json")
    );

if (!licenseFile) {
    console.error("❌ No Sonar license found.");
    process.exit(1);
}

const license = JSON.parse(
    fs.readFileSync(
        path.join(__dirname, licenseFile),
        "utf8"
    )
);

const publicKey = fs.readFileSync(
    path.join(__dirname, "keys", "public_key.pem"),
    "utf8"
);

const cryptoService = new CryptoService();

const validator = new LicenseValidator(
    cryptoService,
    publicKey
);

const result = validator.validate(license);

console.log("");
console.log("================================");
console.log("        SONAR DRM TEST");
console.log("================================");
console.log("");

if (result.valid) {
    console.log("✓ Signature valid");
    console.log(`✓ License ID: ${result.license.licenseId}`);
    console.log(`✓ Plan: ${result.license.plan.toUpperCase()}`);
    console.log("✓ License accepted");
} else {
    console.log("✗ License rejected");
    console.log(`Reason: ${result.reason}`);
}

console.log("");