// src/engines/tts/kokoro/KokoroEngine.js
//
// Runs in the MAIN process, but does none of the actual inference itself.
// All it does is own a utilityProcess running kokoroWorker.js and proxy
// synthesize/cancel calls to it over process messaging. This keeps
// long-running ONNX inference off the main thread entirely, so app-wide
// IPC (settings reads, license checks, everything) stays responsive no
// matter how long a document takes to synthesize.

const path = require("node:path");
const { utilityProcess } = require("electron");

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

const FREE_KOKORO_VOICE_ID = "af_sky";
const FREE_KOKORO_GENERATION_LIMIT = 3;

let nextMsgId = 1;

class KokoroEngine {
    constructor() {
        this.child = null;
        this.pending = new Map(); // msgId -> { resolve, reject }
        this.currentJobId = null; // msgId of the in-flight synthesize, for cancel()
    }

    _ensureChild() {
        if (this.child) return this.child;

        this.child = utilityProcess.fork(path.join(__dirname, "kokoroWorker.js"), [], {
            // stdio inherited by default; set to "pipe" here if you want to
            // capture/log the worker's console output separately.
        });

        this.child.on("message", (msg) => {
            const waiter = this.pending.get(msg.id);
            if (!waiter) return; // stale/cancelled reply, ignore
            this.pending.delete(msg.id);

            if (msg.type === "result") {
                waiter.resolve(msg.outputFile);
            } else if (msg.type === "cancelled") {
                const err = new Error("Synthesis cancelled");
                err.cancelled = true;
                waiter.reject(err);
            } else if (msg.type === "error") {
                waiter.reject(new Error(msg.message));
            }
        });

        this.child.on("exit", (code) => {
            // Worker died (crash, or we killed it for cancel). Reject anything
            // still waiting so callers don't hang forever, then clear the
            // handle so the next synthesize() call spins up a fresh one.
            for (const waiter of this.pending.values()) {
                const err = new Error(`Kokoro worker exited (code ${code})`);
                waiter.reject(err);
            }
            this.pending.clear();
            this.child = null;
            this.currentJobId = null;
        });

        return this.child;
    }

    getVoices() {
        return VOICE_LIST.map((v) => ({ ...v, engine: "kokoro" }));
    }

    synthesize(text, voiceId, outputFile) {
        const child = this._ensureChild();
        const id = nextMsgId++;
        this.currentJobId = id;

        return new Promise((resolve, reject) => {
            this.pending.set(id, { resolve, reject });
            child.postMessage({ id, type: "synthesize", text, voiceId, outputFile });
        });
    }

    // Cancel the in-flight synthesis, if any. Because inference inside the
    // worker can't be interrupted mid-chunk (see kokoroWorker.js), the only
    // way to guarantee an immediate stop is killing the worker process
    // outright — the next synthesize() call transparently spins up a new
    // one via _ensureChild(). This is quick since the model itself is only
    // reloaded once (on that fresh worker's first synthesize call).
    cancel() {
        if (!this.child || this.currentJobId === null) return;

        const jobId = this.currentJobId;
        const waiter = this.pending.get(jobId);
        if (waiter) {
            const err = new Error("Synthesis cancelled");
            err.cancelled = true;
            waiter.reject(err);
            this.pending.delete(jobId);
        }

        this.child.kill();
        this.child = null;
        this.currentJobId = null;
    }
}

module.exports = KokoroEngine;
module.exports.FREE_KOKORO_VOICE_ID = FREE_KOKORO_VOICE_ID;
module.exports.FREE_KOKORO_GENERATION_LIMIT = FREE_KOKORO_GENERATION_LIMIT;