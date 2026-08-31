// src/engines/tts/piper/PiperEngine.js
const fs = require("node:fs");
const path = require("node:path");
const { spawn } = require("node:child_process");

class PiperEngine {
    constructor() {
        this.root = __dirname;

        this.exePath = path.join(this.root, "runtime", "piper.exe");
        this.voicesDir = path.join(this.root, "voices");
        this.manifestPath = path.join(this.root, "voices.json");
    }

    /**
     * Resolve a voice id (e.g. "en_US-amy-medium") to its .onnx path.
     */
    _resolveModelPath(voiceId) {
        return path.join(this.voicesDir, voiceId, `${voiceId}.onnx`);
    }

    /**
     * Return the list of available voices with metadata.
     */
        getVoices() {
        const manifest = JSON.parse(
            fs.readFileSync(this.manifestPath, "utf8")
        );

        return manifest.voices.map((v) => ({ ...v, engine: "piper" }));
    }

    /**
     * Synthesize text to a WAV file using the given voice.
     * Returns a promise that resolves with the output file path.
     */
    synthesize(text, voiceId, outputFile) {
        return new Promise((resolve, reject) => {
            const modelPath = this._resolveModelPath(voiceId);

            const piper = spawn(this.exePath, [
                "--model", modelPath,
                "--output_file", outputFile
            ]);

            piper.stdin.write(text);
            piper.stdin.end();

            let stderr = "";
            piper.stderr.on("data", (chunk) => {
                stderr += chunk.toString();
            });

            piper.on("close", (code) => {
                if (code === 0) {
                    resolve(outputFile);
                } else {
                    reject(new Error(`Piper exited with code ${code}: ${stderr}`));
                }
            });

            piper.on("error", (err) => {
                reject(err);
            });
        });
    }
}

module.exports = PiperEngine;