const fs = require("node:fs");
const path = require("node:path");
const { spawn } = require("node:child_process");

class PiperEngine {
    constructor() {
        this.root = __dirname;

        this.exePath = path.join(this.root, "runtime", "piper.exe");
        this.voicesDir = path.join(this.root, "voices");
        this.manifestPath = path.join(this.root, "voices.json");
        this.currentProcess = null; // track the in-flight spawn, for cancel()
    }

    _resolveModelPath(voiceId) {
        return path.join(this.voicesDir, voiceId, `${voiceId}.onnx`);
    }

    getVoices() {
        const manifest = JSON.parse(
            fs.readFileSync(this.manifestPath, "utf8")
        );
        return manifest.voices.map((v) => ({ ...v, engine: "piper" }));
    }

    synthesize(text, voiceId, outputFile) {
        return new Promise((resolve, reject) => {
            const modelPath = this._resolveModelPath(voiceId);

            const piper = spawn(this.exePath, [
                "--model", modelPath,
                "--output_file", outputFile
            ]);
            this.currentProcess = piper;

            piper.stdin.write(text);
            piper.stdin.end();

            let stderr = "";
            piper.stderr.on("data", (chunk) => {
                stderr += chunk.toString();
            });

            piper.on("close", (code, signal) => {
                if (this.currentProcess === piper) this.currentProcess = null;
                if (signal === "SIGTERM" || signal === "SIGKILL") {
                    const err = new Error("Synthesis cancelled");
                    err.cancelled = true;
                    reject(err);
                } else if (code === 0) {
                    resolve(outputFile);
                } else {
                    reject(new Error(`Piper exited with code ${code}: ${stderr}`));
                }
            });

            piper.on("error", (err) => {
                if (this.currentProcess === piper) this.currentProcess = null;
                reject(err);
            });
        });
    }

    cancel() {
        if (!this.currentProcess) return;
        this.currentProcess.kill();
        this.currentProcess = null;
    }
}

module.exports = PiperEngine;