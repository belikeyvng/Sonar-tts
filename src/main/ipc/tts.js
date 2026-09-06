//tts.js
const fs = require("node:fs");
const { ipcMain, app } = require("electron");
const path = require("node:path");

const PiperEngine = require("../../engines/tts/piper/PiperEngine");
const KokoroEngine = require("../../engines/tts/kokoro/KokoroEngine");
const UsageStore = require("../../data/settings/UsageStore");
const { checkTextLength } = require("../../data/settings/text-limits");

const { FREE_KOKORO_VOICE_IDS, FREE_KOKORO_GENERATION_LIMIT } = KokoroEngine;

function registerTtsIpc(licenseEngine) {
  const engines = {
    piper: new PiperEngine(),
    kokoro: new KokoroEngine(),
  };

  const usageStore = new UsageStore();

  // Tracks the engine currently mid-synthesize, so tts:cancel knows what
  // to kill. Null when nothing is in flight. Only one generation runs at
  // a time from the renderer's perspective (Generate button disables
  // itself while generating), so a single slot is sufficient.
  let activeEngine = null;

  function getAllVoices() {
    return Object.values(engines).flatMap((engine) => engine.getVoices());
  }

  ipcMain.handle("tts:getVoices", async () => {
    return getAllVoices();
  });

  ipcMain.handle("tts:getUsage", async (event, voiceId) => {
    if (!FREE_KOKORO_VOICE_IDS.includes(voiceId)) {
      return { limited: false };
    }
    const used = usageStore.getCount(voiceId);
    return {
      limited: true,
      used,
      limit: FREE_KOKORO_GENERATION_LIMIT,
      remaining: Math.max(FREE_KOKORO_GENERATION_LIMIT - used, 0),
    };
  });

  ipcMain.handle("tts:resetUsage", async () => {
    for (const id of FREE_KOKORO_VOICE_IDS) usageStore.reset(id);
    return { ok: true };
  });

  ipcMain.handle("tts:checkTextLength", async (event, { text, isPro }) => {
    return checkTextLength(text, isPro);
  });

  ipcMain.handle("tts:speak", async (event, { text, voiceId }) => {
    const voices = getAllVoices();
    const voice = voices.find((v) => v.id === voiceId);

    if (!voice) {
      return { success: false, reason: "UNKNOWN_VOICE" };
    }

    const isPro = licenseEngine.hasFeature("advancedVoices");

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

    if (FREE_KOKORO_VOICE_IDS.includes(voiceId) && !isPro) {
      const used = usageStore.getCount(voiceId);
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

    const audioDir = path.join(app.getPath("userData"), "generated-audio");
    fs.mkdirSync(audioDir, { recursive: true });

    const outputFile = path.join(audioDir, `sonar-tts-${Date.now()}.wav`);
    activeEngine = engine;

    try {
      const file = await engine.synthesize(text, voiceId, outputFile);

      if (FREE_KOKORO_VOICE_IDS.includes(voiceId) && !isPro) {
        const used = usageStore.increment(voiceId);
        return {
          success: true,
          file,
          usage: { used, limit: FREE_KOKORO_GENERATION_LIMIT },
        };
      }

      return { success: true, file };
    } catch (error) {
      if (error.cancelled) {
        return { success: false, reason: "CANCELLED" };
      }
      return { success: false, reason: error.message };
    } finally {
      if (activeEngine === engine) activeEngine = null;
    }
  });

  ipcMain.handle("fs:fileExists", async (event, filePath) => {
    try {
      await fs.promises.access(filePath);
      return true;
    } catch {
      return false;
    }
  });

  // Cancel whatever's currently generating. No-op if nothing's in
  // flight (e.g. renderer double-clicks Cancel, or the request already
  // resolved right before this arrives).
  ipcMain.handle("tts:cancel", async () => {
    if (activeEngine) {
      activeEngine.cancel();
      return { ok: true };
    }
    return { ok: false, reason: "NOTHING_IN_FLIGHT" };
  });
}

module.exports = registerTtsIpc;
