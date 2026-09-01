const { KokoroTTS } = require("kokoro-js");

// Voice metadata — id must match what tts.js will match voiceId against.
// tier: "free" | "pro" — adjust to match your licensing plan.
// gender/accent are explicit here (not parsed from id at render time)
// so any voice that doesn't follow Kokoro's af_/am_/bf_/bm_ convention
// can just be hand-corrected in this one place.
const VOICE_LIST = [
    { id: "af_sky", name: "Sky", gender: "female", accent: "American", tier: "free" },
    { id: "af_bella", name: "Bella", gender: "female", accent: "American", tier: "pro" },
    { id: "af_nicole", name: "Nicole", gender: "female", accent: "American", tier: "pro" },
    { id: "af_sarah", name: "Sarah", gender: "female", accent: "American", tier: "pro" },
    { id: "am_adam", name: "Adam", gender: "male", accent: "American", tier: "pro" },
    { id: "am_michael", name: "Michael", gender: "male", accent: "American", tier: "pro" },
    { id: "bf_emma", name: "Emma", gender: "female", accent: "British", tier: "pro" },
    { id: "bf_isabella", name: "Isabella", gender: "female", accent: "British", tier: "pro" },
    { id: "bm_george", name: "George", gender: "male", accent: "British", tier: "pro" },
    { id: "bm_lewis", name: "Lewis", gender: "male", accent: "British", tier: "pro" },
];

// Free-tier users get a capped number of generations on the one free
// Kokoro voice (Kokoro is more expensive to run than Piper).
const FREE_KOKORO_VOICE_ID = "af_sky";
const FREE_KOKORO_GENERATION_LIMIT = 3;

class KokoroEngine {
    constructor() {
        this.tts = null;
        this.readyPromise = null;
    }

    async _ensureReady() {
        if (this.tts) return this.tts;
        if (!this.readyPromise) {
            this.readyPromise = KokoroTTS.from_pretrained(__dirname, {
                dtype: "q8",
                device: "cpu",
            }).then((tts) => {
                this.tts = tts;
                return tts;
            });
        }
        return this.readyPromise;
    }

    getVoices() {
        // Tagged so tts:speak / the renderer can tell which engine owns each voice.
        return VOICE_LIST.map((v) => ({ ...v, engine: "kokoro" }));
    }

    async synthesize(text, voiceId, outputFile) {
        const tts = await this._ensureReady();

        const chunks = chunkText(text);
        const audioParts = [];
        let samplingRate = null;
        let RawAudioCtor = null;

        for (const chunk of chunks) {
            const audio = await tts.generate(chunk, { voice: voiceId });
            audioParts.push(audio.audio); // Float32Array of samples for this chunk
            samplingRate = audio.sampling_rate;
            RawAudioCtor = RawAudioCtor || audio.constructor; // reuse the class kokoro-js returns
        }

        // Concatenate with a short silence gap between chunks so sentence
        // boundaries don't run together.
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
        return outputFile;
    }
}

// Groups sentences into chunks under a conservative character budget.
// Kokoro's hard limit is ~510 phoneme tokens, and phoneme count tends to
// run higher than raw character count, so this stays well under that.
function chunkText(text, maxChars = 200) {
    const sentences = text
        .split(/(?<=[.!?])\s+/)
        .map((s) => s.trim())
        .filter(Boolean);

    const chunks = [];
    let current = "";

    for (const sentence of sentences) {
        // A single sentence longer than the budget on its own — hard-split it
        // on whitespace so nothing gets silently dropped or overflows.
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

module.exports = KokoroEngine;
module.exports.FREE_KOKORO_VOICE_ID = FREE_KOKORO_VOICE_ID;
module.exports.FREE_KOKORO_GENERATION_LIMIT = FREE_KOKORO_GENERATION_LIMIT;