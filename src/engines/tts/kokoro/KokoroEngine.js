const { KokoroTTS } = require("kokoro-js");

// Voice metadata — id must match what tts.js will match voiceId against.
// tier: "free" | "pro" — adjust to match your licensing plan.
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
        const audio = await tts.generate(text, { voice: voiceId });
        audio.save(outputFile);
        return outputFile;
    }
}

module.exports = KokoroEngine;
module.exports.FREE_KOKORO_VOICE_ID = FREE_KOKORO_VOICE_ID;
module.exports.FREE_KOKORO_GENERATION_LIMIT = FREE_KOKORO_GENERATION_LIMIT;