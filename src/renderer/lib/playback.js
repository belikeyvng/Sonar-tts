// src/renderer/lib/playback.js

/**
 * Synthesize text with the given voice and play it immediately.
 * Returns the same result object tts:speak resolves with
 * ({ success, file } or { success: false, reason }).
 */
async function speakAndPlay(text, voiceId) {
    const result = await window.sonar.tts.speak(text, voiceId);

    if (!result.success) {
        console.error("TTS failed:", result.reason);
        return result;
    }

    const audio = new Audio("file://" + result.file);

    try {
        await audio.play();
    } catch (error) {
        console.error("Playback failed:", error);
        return { success: false, reason: "PLAYBACK_FAILED" };
    }

    return result;
}

window.sonar.tts.speakAndPlay = speakAndPlay;