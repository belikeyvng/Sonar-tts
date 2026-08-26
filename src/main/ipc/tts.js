const { ipcMain } = require("electron");
const path = require("node:path");
const { app } = require("electron");

const PiperEngine = require("../../engines/tts/piper/PiperEngine");

function registerTtsIpc() {
    const piperEngine = new PiperEngine();

    ipcMain.handle("tts:speak", async (event, { text, voiceId }) => {
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