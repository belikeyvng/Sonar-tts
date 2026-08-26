const fs = require("node:fs");
const path = require("node:path");
const { app } = require("electron");

class UsageStore {
    constructor(fileName = "usage.json") {
        this.filePath = path.join(app.getPath("userData"), fileName);
        this._data = this._load();
    }

    _load() {
        try {
            return JSON.parse(fs.readFileSync(this.filePath, "utf8"));
        } catch {
            return {};
        }
    }

    _save() {
        fs.mkdirSync(path.dirname(this.filePath), { recursive: true });
        fs.writeFileSync(this.filePath, JSON.stringify(this._data, null, 2));
    }

    getCount(key) {
        return this._data[key] || 0;
    }

    increment(key) {
        this._data[key] = this.getCount(key) + 1;
        this._save();
        return this._data[key];
    }
}

module.exports = UsageStore;