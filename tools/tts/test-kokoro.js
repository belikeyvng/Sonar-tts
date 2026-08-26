const path = require("path");
const { KokoroTTS } = require("kokoro-js");

async function main() {
    console.log("Initializing Kokoro...");

    const modelPath = path.resolve(
        __dirname,
        "../../src/engines/tts/kokoro"
    );

    console.log("Model path:", modelPath);

    const tts = await KokoroTTS.from_pretrained(modelPath, {
        dtype: "q8",
        device: "cpu"
    });

    console.log("Kokoro loaded successfully!");

    console.log("Available voices:");
    console.log(tts.list_voices());

    console.log("Generating speech...");

    const audio = await tts.generate(
        "Hello. This is Kokoro running locally inside Sonar.",
        {
            voice: "af_heart"
        }
    );

    const outputPath = path.resolve(
        __dirname,
        "kokoro-test.wav"
    );

    audio.save(outputPath);

    console.log("Speech generated successfully!");
    console.log("Output:", outputPath);
}

main().catch(error => {
    console.error("Kokoro test failed:");
    console.error(error);
    process.exit(1);
});