const CryptoService = require(
    "../../src/engines/license/CryptoService"
);

const cryptoService = new CryptoService();

console.log("Generating Ed25519 key pair...");

const { publicKey, privateKey } =
    cryptoService.generateKeyPair();

const message = JSON.stringify({
    licenseId: "SONAR-TEST-001",
    plan: "pro"
});

console.log("Signing license...");

const signature = cryptoService.sign(
    message,
    privateKey
);

console.log("Verifying signature...");

const valid = cryptoService.verify(
    message,
    signature,
    publicKey
);

console.log("");

if (valid) {
    console.log("✓ Signature is VALID");
} else {
    console.log("✗ Signature is INVALID");
}