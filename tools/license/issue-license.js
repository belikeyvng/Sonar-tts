const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");

const keysDir = path.join(__dirname, "keys");

const privateKeyPath = path.join(
    keysDir,
    "private_key.pem"
);

if (!fs.existsSync(privateKeyPath)) {
    console.error("❌ Private key not found.");
    console.error("Run generate-keys.js first.");
    process.exit(1);
}

const privateKey = fs.readFileSync(
    privateKeyPath,
    "utf8"
);

const PLANS = {
    free: [
        "basicVoices"
    ],

    plus: [
        "basicVoices",
        "pdf",
        "advancedVoices"
    ],

    pro: [
        "basicVoices",
        "pdf",
        "advancedVoices",
        "audioExport"
    ]
};

function issueLicense(plan) {

    if (!PLANS[plan]) {
        throw new Error(
            `Invalid plan "${plan}". Use: free, plus, or pro.`
        );
    }

    const payload = {
        licenseId:
            `SONAR-${crypto.randomBytes(8)
                .toString("hex")
                .toUpperCase()}`,

        plan,

        issuedAt: Date.now(),

        expiresAt: null,

        features: PLANS[plan]
    };

    const payloadString = JSON.stringify(payload);

    const signature = crypto.sign(
        null,
        Buffer.from(payloadString, "utf8"),
        privateKey
    );

    return {
        payload,
        signature: signature.toString("base64")
    };
}


// ------------------------------------------------------------
// Command-line usage
// ------------------------------------------------------------

const plan = process.argv[2]?.toLowerCase() || "free";

try {

    const license = issueLicense(plan);

    const filename =
        `${license.payload.licenseId}.json`;

    const outputPath = path.join(
        __dirname,
        filename
    );

    fs.writeFileSync(
        outputPath,
        JSON.stringify(license, null, 4),
        "utf8"
    );

    console.log("");
    console.log("================================");
    console.log("       SONAR LICENSE ISSUED");
    console.log("================================");
    console.log("");
    console.log(`License ID : ${license.payload.licenseId}`);
    console.log(`Plan       : ${plan.toUpperCase()}`);
    console.log(`Issued     : ${new Date(
        license.payload.issuedAt
    ).toISOString()}`);
    console.log("");
    console.log(`Saved to:`);
    console.log(outputPath);
    console.log("");

} catch (error) {

    console.error("");
    console.error("❌ Failed to issue license.");
    console.error(error.message);
    console.error("");

    process.exit(1);
}