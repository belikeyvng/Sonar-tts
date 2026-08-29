const fs = require("node:fs");
const path = require("node:path");
const { app } = require("electron");

// Returns today's date as "YYYY-MM-DD" in local time — used as the
// rollover boundary for daily usage limits. Local time (not UTC) so
// the reset lines up with when the user's day actually ends.
function todayString() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

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

    // Reads the count for `key`, treating it as 0 if there's no entry
    // yet OR the stored entry is from a previous day. Entries are
    // shaped { date: "YYYY-MM-DD", count: number }. Older on-disk data
    // saved as a bare number (pre-daily-reset format) is also treated
    // as stale/reset — a harmless one-time freebie, not worth migrating.
    getCount(key) {
        const entry = this._data[key];
        if (!entry || typeof entry !== "object") return 0;
        if (entry.date !== todayString()) return 0;
        return entry.count || 0;
    }

    // Increments `key`'s count for today. If the existing entry is from
    // a previous day, starts fresh at 1 rather than adding onto a stale
    // count.
    increment(key) {
        const today = todayString();
        const current = this.getCount(key); // already handles staleness
        const next = current + 1;
        this._data[key] = { date: today, count: next };
        this._save();
        return next;
    }

    reset(key) {
        delete this._data[key];
        this._save();
    }

    resetAll() {
        this._data = {};
        this._save();
    }
}

module.exports = UsageStore;