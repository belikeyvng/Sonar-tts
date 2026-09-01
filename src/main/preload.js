const { contextBridge, ipcRenderer, webUtils } = require("electron");

contextBridge.exposeInMainWorld("sonar", {
 license: {
    activate: (filePath) => ipcRenderer.invoke("license:activate", filePath),
    getStatus: () => ipcRenderer.invoke("license:getStatus"),
    hasFeature: (feature) => ipcRenderer.invoke("license:hasFeature", feature),
    deactivate: () => ipcRenderer.invoke("license:deactivate"),
    browseFile: () => ipcRenderer.invoke("license:browseFile"),
  },
  tts: {
    getVoices: () => ipcRenderer.invoke("tts:getVoices"),

    getUsage: (voiceId) => ipcRenderer.invoke("tts:getUsage", voiceId),
    resetUsage: () => ipcRenderer.invoke("tts:resetUsage"),
    speak: (text, voiceId) =>
      ipcRenderer.invoke("tts:speak", { text, voiceId }),
    checkTextLength: (text, isPro) =>
      ipcRenderer.invoke("tts:checkTextLength", { text, isPro }),
  },
  pdf: {
    // Renderer hands us the real dropped File object; webUtils resolves
    // its on-disk path (only available here in preload, not in the
    // sandboxed renderer itself) so main can read + parse it.
    getPathForFile: (file) => webUtils.getPathForFile(file),

    // Load + extract a PDF already on disk (used by both drag-drop,
    // once we have a path, and anywhere else a path is already known).
    load: (filePath) => ipcRenderer.invoke("pdf:load", filePath),

    // Opens the native "Browse files" dialog and extracts the chosen
    // PDF in one round-trip.
    browse: () => ipcRenderer.invoke("pdf:browse"),
  },
  export: {
    getSettings: () => ipcRenderer.invoke("export:getSettings"),
    chooseFolder: () => ipcRenderer.invoke("export:chooseFolder"),
    saveAudio: (payload) => ipcRenderer.invoke("export:saveAudio", payload),
  },
  settings: {
    get: () => ipcRenderer.invoke("settings:get"),
    save: (partial) => ipcRenderer.invoke("settings:save", partial),
  },
  payment: {
    // Kicks off the Paystack checkout popup + polling in the main
    // process; resolves once the license is issued and activated
    // (or the popup is closed / times out / fails). See
    // src/main/ipc/payment.js for the full flow.
    startCheckout: (email) =>
      ipcRenderer.invoke("payment:startCheckout", email),
  },
});
