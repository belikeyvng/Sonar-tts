const path = require("node:path");
const fs = require("node:fs");

const CryptoService = require(
    "../../src/engines/license/CryptoService"
);

const LicenseValidator = require(
    "../../src/engines/license/licenseValidator"
);

const LicenseEngine = require(
    "../../src/engines/license/licenseEngine"
);

const licenseFile = fs.readdirSync(__dirname)
    .find(file =>
        file.startsWith("SONAR-") &&
        file.endsWith(".json")
    );

if (!licenseFile) {
    console.error("No license found.");
    process.exit(1);
}

const publicKey = fs.readFileSync(
    path.join(__dirname, "keys", "public_key.pem"),
    "utf8"
);

const cryptoService = new CryptoService();

const validator = new LicenseValidator(
    cryptoService,
    publicKey
);

const licenseEngine = new LicenseEngine(
    validator
);

const result = licenseEngine.activateFromFile(
    path.join(__dirname, licenseFile)
);

console.log("");
console.log("================================");
console.log("       SONAR LICENSE ENGINE");
console.log("================================");
console.log("");

console.log(
    result.success
        ? "✓ License activated"
        : "✗ Activation failed"
);

console.log(
    `Plan: ${licenseEngine.getPlan().toUpperCase()}`
);

console.log(
    `PDF: ${
        licenseEngine.hasFeature("pdf")
            ? "AVAILABLE"
            : "LOCKED"
    }`
);

console.log(
    `Audio Export: ${
        licenseEngine.hasFeature("audioExport")
            ? "AVAILABLE"
            : "LOCKED"
    }`
);

console.log(
    `Activated: ${
        licenseEngine.isActivated()
            ? "YES"
            : "NO"
    }`
);

console.log("");