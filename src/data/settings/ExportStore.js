// src/data/settings/ExportStore.js
//
// Persists the user's chosen export folder + a daily-reset counter for
// free-tier export limits. Mirrors UsageStore.js's { date, count } shape
// and daily-rollover logic exactly, so the two stay consistent.

const fs = require("fs");
const path = require("path");
const { app } = require("electron");

const STORE_PATH = path.join(app.getPath("userData"), "export-store.json");
const DEFAULT_EXPORT_DIR = path.join(app.getPath("userData"), "exports");
const FREE_DAILY_EXPORT_LIMIT = 3;

function todayKey() {
  return new Date().toISOString().slice(0, 10); // "YYYY-MM-DD", local calendar day is fine here
}

function readStore() {
  try {
    const raw = fs.readFileSync(STORE_PATH, "utf-8");
    return JSON.parse(raw);
  } catch {
    return { exportPath: null, usage: { date: todayKey(), count: 0 } };
  }
}

function writeStore(store) {
  fs.mkdirSync(path.dirname(STORE_PATH), { recursive: true });
  fs.writeFileSync(STORE_PATH, JSON.stringify(store, null, 2), "utf-8");
}

function getExportPath() {
  const store = readStore();
  const exportPath = store.exportPath || DEFAULT_EXPORT_DIR;
  fs.mkdirSync(exportPath, { recursive: true });
  return exportPath;
}

function setExportPath(newPath) {
  const store = readStore();
  store.exportPath = newPath;
  writeStore(store);
}

function getUsage() {
  const store = readStore();
  const today = todayKey();
  if (!store.usage || store.usage.date !== today) {
    return { date: today, count: 0 };
  }
  return store.usage;
}

function incrementUsage() {
  const store = readStore();
  const today = todayKey();
  const current =
    store.usage && store.usage.date === today ? store.usage.count : 0;
  store.usage = { date: today, count: current + 1 };
  writeStore(store);
  return store.usage.count;
}

module.exports = {
  FREE_DAILY_EXPORT_LIMIT,
  getExportPath,
  setExportPath,
  getUsage,
  incrementUsage,
};