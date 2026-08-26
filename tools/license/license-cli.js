// tools/license/license-cli.js
//
// Plain-Node CLI to activate/deactivate/check the license without
// opening the Electron app — for quick manual testing.
//
// NOTE: activation/deactivation *state* (LicenseStore) is written
// wherever your app persists it. If LicenseStore.js uses Electron's
// app.getPath("userData"), this script can't call it directly the
// same way test-license.js validates a raw file (that script only
// checks a license file's signature — it never touches stored
// activation state). Paste LicenseStore.js if you want this script
// to actually flip real activation state instead of just re-running
// the same signature check as test-license.js.

const fs = require("node:fs");
const path = require("node:path");

const CryptoService = require("../../src/engines/license/CryptoService");
const LicenseValidator = require("../../src/engines/license/licenseValidator");

const LICENSE_FILE_PATH = path.join(
    __dirname,
    "SONAR-C2E1617DCF51E69F.json"
);

const PUBLIC_KEY_PATH = path.join(__dirname, "keys", "public_key.pem");

function loadValidator() {
    const publicKey = fs.readFileSync(PUBLIC_KEY_PATH, "utf8");
    const cryptoService = new CryptoService();
    return new LicenseValidator(cryptoService, publicKey);
}

function loadLicense() {
    return JSON.parse(fs.readFileSync(LICENSE_FILE_PATH, "utf8"));
}

function printHeader(title) {
    console.log("");
    console.log("================================");
    console.log(`  ${title}`);
    console.log("================================");
    console.log("");
}

function checkCommand() {
    printHeader("SONAR LICENSE — CHECK");
    const validator = loadValidator();
    const license = loadLicense();
    const result = validator.validate(license);

    if (result.valid) {
        console.log("✓ Signature valid");
        console.log(`✓ License ID: ${result.license.licenseId}`);
        console.log(`✓ Plan: ${result.license.plan.toUpperCase()}`);
    } else {
        console.log("✗ License rejected");
        console.log(`Reason: ${result.reason}`);
    }
    console.log("");
}

function activateCommand() {
    printHeader("SONAR LICENSE — ACTIVATE (dry run)");
    console.log(`License file: ${LICENSE_FILE_PATH}`);
    console.log("");
    console.log("This script validates the license signature only.");
    console.log("It does NOT flip real app activation state (LicenseStore),");
    console.log("since that likely persists via Electron's app.getPath()");
    console.log("and can't run outside an Electron process.");
    console.log("");
    console.log("To actually activate inside the running app, use the");
    console.log("DevTools console instead:");
    console.log("");
    console.log(`  await window.sonar.license.activate("${LICENSE_FILE_PATH.replace(/\\/g, "\\\\")}");`);
    console.log("");
    checkCommand();
}

function deactivateCommand() {
    printHeader("SONAR LICENSE — DEACTIVATE (reminder)");
    console.log("Run this in the app's DevTools console instead:");
    console.log("");
    console.log(`  await window.sonar.license.deactivate();`);
    console.log("");
}

const [, , command] = process.argv;

switch (command) {
    case "check":
        checkCommand();
        break;
    case "activate":
        activateCommand();
        break;
    case "deactivate":
        deactivateCommand();
        break;
    default:
        console.error("Usage: node tools/license/license-cli.js <check|activate|deactivate>");
        process.exit(1);
}