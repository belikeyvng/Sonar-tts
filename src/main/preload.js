const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("sonar", {
    license: {
        activate: (filePath) =>
            ipcRenderer.invoke("license:activate", filePath),

        getStatus: () =>
            ipcRenderer.invoke("license:getStatus"),

        hasFeature: (feature) =>
            ipcRenderer.invoke("license:hasFeature", feature),

        deactivate: () =>
            ipcRenderer.invoke("license:deactivate")
    },
    tts: {
        speak: (text, voiceId) =>
            ipcRenderer.invoke("tts:speak", { text, voiceId })
    }
});