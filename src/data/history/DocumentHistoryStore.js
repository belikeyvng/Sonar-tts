const fs = require("node:fs");
const path = require("node:path");
const { app } = require("electron");

// Persists document metadata + pin/recency state so the sidebar and
// documents survive an app restart. Does NOT persist audio (audioFile
// points at a temp file that won't survive relaunch — audioReady
// always comes back false, requiring regeneration) or the live
// playback/progress fields (timeElapsed, progress, etc — those reset
// naturally as fresh UI state).
class DocumentHistoryStore {
    constructor(fileName = "history.json") {
        this.filePath = path.join(app.getPath("userData"), fileName);
        this._data = this._load();
    }

    _load() {
        try {
            const raw = JSON.parse(fs.readFileSync(this.filePath, "utf8"));
            return {
                documents: raw.documents || {},
                pinnedIds: raw.pinnedIds || [],
                recentIds: raw.recentIds || [],
            };
        } catch {
            return { documents: {}, pinnedIds: [], recentIds: [] };
        }
    }

    _save() {
        fs.mkdirSync(path.dirname(this.filePath), { recursive: true });
        fs.writeFileSync(this.filePath, JSON.stringify(this._data, null, 2));
    }

    getAll() {
        return this._data;
    }

    // Upserts a document's persisted metadata (called whenever a PDF is
    // loaded, or a voice is changed on an existing doc). `docId` is the
    // file path — same key convention app.js already uses in-memory.
    saveDocument(docId, doc) {
        this._data.documents[docId] = {
            fileName: doc.fileName,
            title: doc.title,
            paragraphs: doc.paragraphs,
            narratorName: doc.narratorName,
            voiceId: doc.voiceId,
            sectionLabel: doc.sectionLabel,
        };
        this._save();
    }

    removeDocument(docId) {
        delete this._data.documents[docId];
        this._data.pinnedIds = this._data.pinnedIds.filter((id) => id !== docId);
        this._data.recentIds = this._data.recentIds.filter((id) => id !== docId);
        this._save();
    }

    setPinned(pinnedIds) {
        this._data.pinnedIds = pinnedIds;
        this._save();
    }

    setRecents(recentIds) {
        this._data.recentIds = recentIds;
        this._save();
    }
}

module.exports = DocumentHistoryStore;