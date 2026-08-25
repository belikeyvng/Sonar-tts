const crypto = require("node:crypto");

class CryptoService {
    /**
     * Generate an Ed25519 key pair.
     *
     * The private key signs licenses.
     * The public key verifies licenses.
     */
    generateKeyPair() {
        return crypto.generateKeyPairSync("ed25519");
    }

    /**
     * Sign arbitrary data with the private key.
     */
    sign(data, privateKey) {
        return crypto.sign(
            null,
            Buffer.from(data, "utf8"),
            privateKey
        );
    }

    /**
     * Verify a signature with the public key.
     */
    verify(data, signature, publicKey) {
        return crypto.verify(
            null,
            Buffer.from(data, "utf8"),
            publicKey,
            signature
        );
    }
}

module.exports = CryptoService;