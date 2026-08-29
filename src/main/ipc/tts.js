//tts.js
const { ipcMain, app } = require("electron");
const path = require("node:path");

const PiperEngine = require("../../engines/tts/piper/PiperEngine");
const KokoroEngine = require("../../engines/tts/kokoro/KokoroEngine");
const UsageStore = require("../../data/settings/UsageStore");
const { checkTextLength } = require("../../data/settings/text-limits");

const { FREE_KOKORO_VOICE_ID, FREE_KOKORO_GENERATION_LIMIT } = KokoroEngine;

function registerTtsIpc(licenseEngine) {
  const engines = {
    piper: new PiperEngine(),
    kokoro: new KokoroEngine(),
  };

  const usageStore = new UsageStore();

  function getAllVoices() {
    return Object.values(engines).flatMap((engine) => engine.getVoices());
  }

  ipcMain.handle("tts:getVoices", async () => {
    return getAllVoices();
  });

  ipcMain.handle("tts:getUsage", async (event, voiceId) => {
    if (voiceId !== FREE_KOKORO_VOICE_ID) {
      return { limited: false };
    }
    const used = usageStore.getCount(FREE_KOKORO_VOICE_ID);
    return {
      limited: true,
      used,
      limit: FREE_KOKORO_GENERATION_LIMIT,
      remaining: Math.max(FREE_KOKORO_GENERATION_LIMIT - used, 0),
    };
  });

  // Dev-only convenience — resets the free-tier Kokoro usage counter
  // so testing doesn't require deleting usage.json by hand every time.
  // TODO: gate or remove before shipping a real build.
  ipcMain.handle("tts:resetUsage", async () => {
    usageStore.reset(FREE_KOKORO_VOICE_ID);
    return { ok: true };
  });

  ipcMain.handle("tts:speak", async (event, { text, voiceId }) => {
    const voices = getAllVoices();
    const voice = voices.find((v) => v.id === voiceId);

    if (!voice) {
      return { success: false, reason: "UNKNOWN_VOICE" };
    }

    const isPro = licenseEngine.hasFeature("advancedVoices");

    // Defensive check — the renderer should already block this at
    // upload time so users see it before generation, not after, but
    // this catches anyone bypassing that (devtools, scripting) since
    // it's the last gate before real synthesis work happens.
    const lengthCheck = checkTextLength(text, isPro);
    if (!lengthCheck.allowed) {
      return {
        success: false,
        reason: lengthCheck.reason,
        limit: lengthCheck.limit,
        actual: lengthCheck.actual,
      };
    }

    if (voice.tier === "pro" && !isPro) {
      return { success: false, reason: "VOICE_REQUIRES_PRO" };
    }

    // Free users get a capped number of generations on the free
    // Kokoro voice specifically (not Piper's free voices — Kokoro
    // is the more expensive engine to run).
    if (voiceId === FREE_KOKORO_VOICE_ID && !isPro) {
      const used = usageStore.getCount(FREE_KOKORO_VOICE_ID);
      if (used >= FREE_KOKORO_GENERATION_LIMIT) {
        return {
          success: false,
          reason: "FREE_GENERATION_LIMIT_REACHED",
          limit: FREE_KOKORO_GENERATION_LIMIT,
          used,
        };
      }
    }

    const engine = engines[voice.engine];
    if (!engine) {
      return { success: false, reason: "UNKNOWN_ENGINE" };
    }

    const outputFile = path.join(
      app.getPath("temp"),
      `sonar-tts-${Date.now()}.wav`,
    );

    try {
      const file = await engine.synthesize(text, voiceId, outputFile);

      if (voiceId === FREE_KOKORO_VOICE_ID && !isPro) {
        const used = usageStore.increment(FREE_KOKORO_VOICE_ID);
        return {
          success: true,
          file,
          usage: { used, limit: FREE_KOKORO_GENERATION_LIMIT },
        };
      }

      return { success: true, file };
    } catch (error) {
      return { success: false, reason: error.message };
    }
  });
}

module.exports = registerTtsIpc;
