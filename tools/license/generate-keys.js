const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");

const keysDir = path.join(__dirname, "keys");

if (!fs.existsSync(keysDir)) {
    fs.mkdirSync(keysDir, { recursive: true });
}

const { publicKey, privateKey } =
    crypto.generateKeyPairSync("ed25519");

fs.writeFileSync(
    path.join(keysDir, "private_key.pem"),
    privateKey.export({
        type: "pkcs8",
        format: "pem"
    })
);

fs.writeFileSync(
    path.join(keysDir, "public_key.pem"),
    publicKey.export({
        type: "spki",
        format: "pem"
    })
);

console.log("✓ Sonar DRM keypair generated.");
console.log("");
console.log("Private key:");
console.log(path.join(keysDir, "private_key.pem"));
console.log("");
console.log("Public key:");
console.log(path.join(keysDir, "public_key.pem"));
console.log("");
console.log("⚠ NEVER ship or commit private_key.pem.");