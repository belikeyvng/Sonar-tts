const { ipcMain, app } = require("electron");
const path = require("node:path");

const PiperEngine = require("../../engines/tts/piper/PiperEngine");

// Voices that require a Pro license.
const PRO_VOICES = new Set([
    "en_US-arctic-medium",
    "en_US-libritts_r-medium",
    "en_US-libritts-high"
]);

function registerTtsIpc(licenseEngine) {
    const piperEngine = new PiperEngine();

    ipcMain.handle("tts:speak", async (event, { text, voiceId }) => {
        if (PRO_VOICES.has(voiceId) && !licenseEngine.hasFeature("advancedVoices")) {
            return {
                success: false,
                reason: "VOICE_REQUIRES_PRO"
            };
        }

        const outputFile = path.join(
            app.getPath("temp"),
            `sonar-tts-${Date.now()}.wav`
        );

        try {
            const file = await piperEngine.synthesize(text, voiceId, outputFile);
            return { success: true, file };
        } catch (error) {
            return { success: false, reason: error.message };
        }
    });
}

module.exports = registerTtsIpc;