// src/engines/tts/kokoro/kokoroWorker.js
//
// Runs inside an Electron utilityProcess (a real separate Node process),
// NOT the main process. This is where the actual ONNX inference happens,
// so it can never block main-process IPC no matter how long a chunk takes.
//
// Talks to KokoroEngine.js (in the main process) over process.parentPort.
// Protocol (all messages are { id, type, ...payload }):
//   in  → { id, type: "synthesize", text, voiceId, outputFile }
//   out → { id, type: "result", outputFile }
//   out → { id, type: "error", message }
//   out → { id, type: "cancelled" }   (if a synthesize is aborted mid-flight)
//
// There is deliberately no queue: one synthesize job runs at a time, and a
// "cancel" message just marks the in-flight job's token as stale so its
// eventual result/error is dropped instead of being sent back. Actually
// stopping the request early requires exiting the process — that's the main
// process's job (kill + respawn), not this file's.

const { KokoroTTS } = require("kokoro-js");

let tts = null;
let readyPromise = null;

// Bumped on every cancel so an in-flight synthesize can tell it's been
// superseded and just drop its result instead of posting it back.
let currentToken = 0;

async function ensureReady() {
    if (tts) return tts;
    if (!readyPromise) {
        readyPromise = KokoroTTS.from_pretrained(__dirname, {
            dtype: "q8",
            device: "cpu",
        }).then((instance) => {
            tts = instance;
            return instance;
        });
    }
    return readyPromise;
}

// Same chunking logic as before — kept identical so output doesn't change,
// only where it runs.
function chunkText(text, maxChars = 200) {
    const sentences = text
        .split(/(?<=[.!?])\s+/)
        .map((s) => s.trim())
        .filter(Boolean);

    const chunks = [];
    let current = "";

    for (const sentence of sentences) {
        if (sentence.length > maxChars) {
            if (current) {
                chunks.push(current);
                current = "";
            }
            let remaining = sentence;
            while (remaining.length > maxChars) {
                let cut = remaining.lastIndexOf(" ", maxChars);
                if (cut <= 0) cut = maxChars;
                chunks.push(remaining.slice(0, cut).trim());
                remaining = remaining.slice(cut).trim();
            }
            if (remaining) current = remaining;
            continue;
        }

        if ((current + " " + sentence).trim().length > maxChars) {
            chunks.push(current);
            current = sentence;
        } else {
            current = (current + " " + sentence).trim();
        }
    }
    if (current) chunks.push(current);

    return chunks;
}

async function synthesize(text, voiceId, outputFile, token) {
    const instance = await ensureReady();

    const chunks = chunkText(text);
    const audioParts = [];
    let samplingRate = null;
    let RawAudioCtor = null;

    for (const chunk of chunks) {
        // Bail out early if we've been cancelled — no point burning more
        // inference time on a result nobody wants. We still can't interrupt
        // a chunk that's already mid-inference (that's what the main
        // process's kill+respawn is for), but this stops the *next* chunk.
        if (token !== currentToken) {
            return { cancelled: true };
        }

        const audio = await instance.generate(chunk, { voice: voiceId });
        audioParts.push(audio.audio);
        samplingRate = audio.sampling_rate;
        RawAudioCtor = RawAudioCtor || audio.constructor;
    }

    if (token !== currentToken) {
        return { cancelled: true };
    }

    const gapSamples = Math.round(samplingRate * 0.12);
    const gap = new Float32Array(gapSamples);
    const totalLength =
        audioParts.reduce((sum, a) => sum + a.length, 0) +
        gap.length * (audioParts.length - 1);
    const combined = new Float32Array(totalLength);

    let offset = 0;
    audioParts.forEach((part, i) => {
        combined.set(part, offset);
        offset += part.length;
        if (i < audioParts.length - 1) {
            combined.set(gap, offset);
            offset += gap.length;
        }
    });

    const finalAudio = new RawAudioCtor(combined, samplingRate);
    finalAudio.save(outputFile);

    return { outputFile };
}

process.parentPort.on("message", async (e) => {
    const msg = e.data;

    if (msg.type === "cancel") {
        currentToken++;
        process.parentPort.postMessage({ id: msg.id, type: "cancelled" });
        return;
    }

    if (msg.type === "synthesize") {
        const token = ++currentToken;
        try {
            const result = await synthesize(msg.text, msg.voiceId, msg.outputFile, token);
            if (result.cancelled || token !== currentToken) {
                process.parentPort.postMessage({ id: msg.id, type: "cancelled" });
            } else {
                process.parentPort.postMessage({
                    id: msg.id,
                    type: "result",
                    outputFile: result.outputFile,
                });
            }
        } catch (err) {
            process.parentPort.postMessage({
                id: msg.id,
                type: "error",
                message: err && err.message ? err.message : String(err),
            });
        }
    }
});