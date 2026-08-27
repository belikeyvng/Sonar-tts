// Shared constant — import this in both the renderer (for instant
// upload-time feedback) and src/main/ipc/tts.js (defensive check, in
// case someone bypasses the renderer check via devtools/scripting).
const TEXT_LENGTH_LIMITS = {
    free: {
        maxCharacters: 10000,
        maxWords: 1800, // approximate — characters is the enforced number
    },
    pro: {
        maxCharacters: 100000,
        maxWords: 15000,
    },
};

function checkTextLength(text, isPro) {
    const limit = isPro ? TEXT_LENGTH_LIMITS.pro : TEXT_LENGTH_LIMITS.free;
    const length = text.length;

    if (length > limit.maxCharacters) {
        return {
            allowed: false,
            reason: "TEXT_TOO_LONG",
            limit: limit.maxCharacters,
            actual: length,
        };
    }

    return { allowed: true };
}

module.exports = { TEXT_LENGTH_LIMITS, checkTextLength };