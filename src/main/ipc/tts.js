const { ipcMain, app } = require("electron");
const path = require("node:path");

const PiperEngine = require("../../engines/tts/piper/PiperEngine");

function registerTtsIpc(licenseEngine) {
    const piperEngine = new PiperEngine();

    ipcMain.handle("tts:getVoices", async () => {
        return piperEngine.getVoices();
    });

    ipcMain.handle("tts:speak", async (event, { text, voiceId }) => {
        const voices = piperEngine.getVoices();
        const voice = voices.find((v) => v.id === voiceId);

        if (!voice) {
            return { success: false, reason: "UNKNOWN_VOICE" };
        }

        if (voice.tier === "pro" && !licenseEngine.hasFeature("advancedVoices")) {
            return { success: false, reason: "VOICE_REQUIRES_PRO" };
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