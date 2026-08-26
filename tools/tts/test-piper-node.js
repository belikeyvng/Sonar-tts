// tools/tts/test-piper-node.js
const path = require("node:path");
const PiperEngine = require("../../src/engines/tts/piper/PiperEngine");

const piper = new PiperEngine();
const outputFile = path.join(__dirname, "node-test.wav");

piper.synthesize(
    "Hello from Node. This is a raw test of the Piper engine wrapper.",
    "en_US-libritts-high",
    outputFile
)
    .then((file) => {
        console.log("✓ Synthesis complete:", file);
    })
    .catch((err) => {
        console.error("✗ Synthesis failed:", err);
    });