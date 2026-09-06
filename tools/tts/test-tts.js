// tools/tts/test-tts.js
//
// Electron-process smoke test for both TTS engines + tier/usage gating,
// mirroring the tools/license/test-license.js pattern where possible —
// but unlike that one, this MUST run under Electron (not plain Node),
// because KokoroEngine uses utilityProcess.fork(), which only exists
// inside a running Electron process. Run via `npm run test:tts:*`
// (which invokes `electron tools/tts/test-tts.js ...`), not `node`.

const { app } = require("electron");
const fs = require("node:fs");
const path = require("node:path");

const PiperEngine = require("../../src/engines/tts/piper/PiperEngine");
const KokoroEngine = require("../../src/engines/tts/kokoro/KokoroEngine");

const { FREE_KOKORO_VOICE_IDS, FREE_KOKORO_GENERATION_LIMIT } = KokoroEngine;

// --- CLI args -----------------------------------------------------
// electron tools/tts/test-tts.js voices
// electron tools/tts/test-tts.js speak <voiceId> ["custom text"]
// electron tools/tts/test-tts.js limit-test [voiceId]   (defaults to first free Kokoro voice)
const [, , command = "voices", arg1, arg2] = process.argv;

const OUTPUT_DIR = path.join(__dirname, "output");
fs.mkdirSync(OUTPUT_DIR, { recursive: true });

const engines = {
    piper: new PiperEngine(),
    kokoro: new KokoroEngine(),
};

function getAllVoices() {
    return Object.values(engines).flatMap((engine) => engine.getVoices());
}

async function speak(voiceId, text) {
    const voices = getAllVoices();
    const voice = voices.find((v) => v.id === voiceId);

    if (!voice) {
        return { success: false, reason: "UNKNOWN_VOICE" };
    }

    const engine = engines[voice.engine];
    const outputFile = path.join(OUTPUT_DIR, `test-${voice.engine}-${voiceId}-${Date.now()}.wav`);

    const start = Date.now();
    try {
        const file = await engine.synthesize(text, voiceId, outputFile);
        const ms = Date.now() - start;
        return { success: true, file, ms };
    } catch (error) {
        return { success: false, reason: error.message };
    }
}

function printHeader(title) {
    console.log("");
    console.log("================================");
    console.log(`  ${title}`);
    console.log("================================");
    console.log("");
}

async function main() {
    if (command === "voices") {
        printHeader("SONAR TTS — VOICE LIST");
        const voices = getAllVoices();
        console.log(`Total voices: ${voices.length}`);
        console.log("");
        for (const v of voices) {
            const tag = FREE_KOKORO_VOICE_IDS.includes(v.id) ? " (usage-limited free voice)" : "";
            console.log(`[${v.engine.padEnd(6)}] ${v.id.padEnd(24)} tier=${v.tier}${tag}`);
        }
        console.log("");
        return;
    }

    if (command === "speak") {
        if (!arg1) {
            console.error("Usage: electron tools/tts/test-tts.js speak <voiceId> [\"text\"]");
            process.exitCode = 1;
            return;
        }
        const text = arg2 || `Test synthesis for voice ${arg1}.`;

        printHeader(`SONAR TTS — SPEAK (${arg1})`);
        const result = await speak(arg1, text);

        if (result.success) {
            console.log(`✓ Generated in ${result.ms}ms`);
            console.log(`✓ Output: ${result.file}`);
        } else {
            console.log(`✗ Failed: ${result.reason}`);
        }
        console.log("");
        return;
    }

    if (command === "limit-test") {
        const testVoiceId = arg1 || FREE_KOKORO_VOICE_IDS[0];

        printHeader(`SONAR TTS — FREE LIMIT TEST (${testVoiceId})`);
        console.log(`Note: this exercises raw engine.synthesize() directly,`);
        console.log(`so it does NOT go through UsageStore/tier gating —`);
        console.log(`that logic lives in src/main/ipc/tts.js.`);
        console.log(`This just confirms ${testVoiceId} reliably generates N times in a row.`);
        console.log("");

        for (let i = 1; i <= FREE_KOKORO_GENERATION_LIMIT + 1; i++) {
            const result = await speak(testVoiceId, `Limit test generation number ${i}.`);
            if (result.success) {
                console.log(`  ${i}. ✓ ${result.ms}ms → ${path.basename(result.file)}`);
            } else {
                console.log(`  ${i}. ✗ ${result.reason}`);
            }
        }
        console.log("");
        return;
    }

    console.error(`Unknown command: ${command}`);
    console.error("Available: voices | speak <voiceId> [\"text\"] | limit-test [voiceId]");
    process.exitCode = 1;
}

app.whenReady().then(() => {
    main()
        .catch((error) => {
            console.error("Test script crashed:");
            console.error(error);
            process.exitCode = 1;
        })
        .finally(() => {
            app.exit(process.exitCode || 0);
        });
});