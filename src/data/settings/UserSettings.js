// src/data/settings/UserSettings.js
//
// Persisted user settings — onboarding completion flag plus the actual
// preferences collected during onboarding (name, voice gender, accent,
// accent color). Same on-disk JSON pattern as UsageStore/ExportStore:
// lives under app.getPath("userData"), read/written via fs, created
// with defaults on first access.
//
// This intentionally covers more than "onboarding" as a flow — the
// settings modal edits these same fields post-onboarding, so this is
// named for the data's domain (user settings), not the flow that first
// populates it.

const fs = require("fs");
const path = require("path");
const { app } = require("electron");

const SETTINGS_FILENAME = "user-settings.json";

const DEFAULTS = {
  hasOnboarded: false,
  name: "",
  voiceGender: "female",
  accent: "american",
  accentColor: "#8b5cf6", // ACCENT_COLOR_OPTIONS[0] in app.js — kept in sync manually, no shared module between main/renderer today
};

function getSettingsPath() {
  return path.join(app.getPath("userData"), SETTINGS_FILENAME);
}

function readSettingsFile() {
  const filePath = getSettingsPath();
  try {
    const raw = fs.readFileSync(filePath, "utf-8");
    const parsed = JSON.parse(raw);
    return { ...DEFAULTS, ...parsed };
  } catch (err) {
    // Missing file (first run) or corrupt JSON — either way, fall back
    // to defaults rather than throwing. A corrupt file gets overwritten
    // on the next save.
    return { ...DEFAULTS };
  }
}

function writeSettingsFile(settings) {
  const filePath = getSettingsPath();
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(settings, null, 2), "utf-8");
}

function getSettings() {
  return readSettingsFile();
}

// Shallow-merges `partial` into the persisted settings and writes the
// result — callers pass only the fields they're changing (e.g. just
// { accentColor } when a swatch is clicked in the settings modal),
// not the full settings object every time.
function saveSettings(partial) {
  const current = readSettingsFile();
  const next = { ...current, ...partial };
  writeSettingsFile(next);
  return next;
}

module.exports = {
  getSettings,
  saveSettings,
};