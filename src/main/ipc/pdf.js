// src/main/ipc/pdf.js
//
// Handles getting a PDF's text content into the renderer, from either
// the native "Browse files" dialog or a path resolved from a dropped
// File object (via webUtils.getPathForFile in the renderer).
//
// Follows the same registerXIpc(...) pattern as license.js/tts.js —
// called once from main.js after app.whenReady().

const { ipcMain, dialog, BrowserWindow } = require("electron");
const path = require("node:path");
const fs = require("node:fs/promises");
const { PDFParse } = require("pdf-parse"); // pdf-parse v2 API — class-based,
// NOT the v1 pdf(buffer) function call. See:
// https://github.com/mehmet-kozan/pdf-parse#getting-started-with-v2-coming-from-v1

const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024; // 25MB — matches the UI copy in tpl-empty-state

// Splits extracted PDF text into paragraph-ish chunks for the reading
// pane. pdf-parse gives us one big text blob with page breaks as
// form-feed chars (\f) and inconsistent line breaks within a page, so
// this is a simple heuristic: treat blank-line-separated runs as
// paragraphs. Good enough for now — replace if the reading pane needs
// more structure (headings, lists) later.
function splitIntoParagraphs(rawText) {
  return rawText
    .split(/\f/g) // split on page breaks first
    .join("\n\n") // then treat every page break as a paragraph break
    .split(/\n\s*\n+/g) // split on blank lines
    .map((p) => p.replace(/\s+/g, " ").trim())
    .filter((p) => p.length > 0);
}

async function loadAndExtractPdf(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext !== ".pdf") {
    return { ok: false, error: "not-a-pdf", message: "Only .pdf files are supported." };
  }

  let stat;
  try {
    stat = await fs.stat(filePath);
  } catch (err) {
    return { ok: false, error: "not-found", message: "That file couldn't be found." };
  }

  if (stat.size > MAX_FILE_SIZE_BYTES) {
    return {
      ok: false,
      error: "too-large",
      message: "PDF is larger than the 25MB limit.",
    };
  }

  let buffer;
  try {
    buffer = await fs.readFile(filePath);
  } catch (err) {
    return { ok: false, error: "read-failed", message: "Couldn't read that file." };
  }

  let result;
  let parser;
  try {
    parser = new PDFParse({ data: buffer });
    result = await parser.getText();
  } catch (err) {
    // Log the real cause during dev — the message we return to the
    // renderer stays generic, but this is what you want to check in
    // the main-process console (terminal running `npm start`, not
    // DevTools) if this branch fires again.
    console.error("[pdf:load] pdf-parse failed:", err);
    return {
      ok: false,
      error: "parse-failed",
      message: "Couldn't extract text from that PDF. It may be scanned or image-only.",
    };
  } finally {
    // PDFParse holds the document open until destroy()'d — leaking
    // these across repeated loads would slowly eat memory.
    await parser?.destroy();
  }

  const paragraphs = splitIntoParagraphs(result.text || "");

  return {
    ok: true,
    fileName: path.basename(filePath),
    filePath,
    title: path.basename(filePath, ext),
    paragraphs,
    pageCount: result.total ?? null,
  };
}

function registerPdfIpc() {
  ipcMain.handle("pdf:load", async (_event, filePath) => {
    if (typeof filePath !== "string" || !filePath) {
      return { ok: false, error: "invalid-path", message: "No file path given." };
    }
    return loadAndExtractPdf(filePath);
  });

  ipcMain.handle("pdf:browse", async (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    const result = await dialog.showOpenDialog(win, {
      title: "Choose a PDF",
      properties: ["openFile"],
      filters: [{ name: "PDF Documents", extensions: ["pdf"] }],
    });

    if (result.canceled || result.filePaths.length === 0) {
      return { ok: false, error: "canceled" };
    }

    return loadAndExtractPdf(result.filePaths[0]);
  });
}

module.exports = registerPdfIpc;