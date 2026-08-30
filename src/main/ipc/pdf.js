// src/main/ipc/pdf.js
//
// Handles getting a PDF's text content into the renderer, from either
// the native "Browse files" dialog or a path resolved from a dropped
// File object (via webUtils.getPathForFile in the renderer).
//
// Uses pdfjs-dist directly (not pdf-parse) because pdf-parse's text
// reconstruction was observed corrupting content on multi-page PDFs
// with repeated header/footer elements — it interleaved and spliced
// text runs out of order, producing both duplicated AND fabricated
// (spliced-together) sentences. pdfjs-dist gives us raw positioned
// text items per page, which we order and dedupe ourselves below.

const { ipcMain, dialog, BrowserWindow } = require("electron");
const path = require("node:path");
const fs = require("node:fs/promises");

const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024; // 25MB — matches the UI copy in tpl-empty-state

// Lazily required — pdfjs-dist's legacy build works in Node without a
// DOM, but importing it eagerly at module load slows every app boot
// even when no PDF is ever opened this session.
let pdfjsLib = null;
async function getPdfjs() {
  if (!pdfjsLib) {
    // pdfjs-dist 6.x ships ESM-only (.mjs) builds — no CommonJS .js
    // file exists anymore, so this must be a dynamic import(), not
    // require(). Dynamic import works fine from a CommonJS module as
    // long as the caller awaits it, which loadAndExtractPdf does below.
    pdfjsLib = await import("pdfjs-dist/legacy/build/pdf.mjs");
  }
  return pdfjsLib;
}

// Extracts one page's text in reading order. pdfjs gives us each text
// run with a `transform` matrix — transform[4]/[5] are the x/y
// position (y measured from the page BOTTOM, so larger y = higher up
// the page). We sort top-to-bottom, then left-to-right within a row,
// using a small y-tolerance so runs on the same visual line (which
// rarely have byte-identical y values) still group together.
async function extractPageLines(page) {
  const content = await page.getTextContent();
  const items = content.items
    .filter((item) => item.str && item.str.trim().length > 0)
    .map((item) => ({
      text: item.str,
      x: item.transform[4],
      y: item.transform[5],
    }));

  const Y_TOLERANCE = 3; // px — items within this y-distance are treated as the same line

  const lines = [];
  for (const item of items) {
    let line = lines.find((l) => Math.abs(l.y - item.y) <= Y_TOLERANCE);
    if (!line) {
      line = { y: item.y, items: [] };
      lines.push(line);
    }
    line.items.push(item);
  }

  // Sort lines top-to-bottom (descending y = higher on page = earlier).
  lines.sort((a, b) => b.y - a.y);
  // Within each line, sort left-to-right.
  for (const line of lines) {
    line.items.sort((a, b) => a.x - b.x);
  }

  return lines.map((line) =>
    line.items
      .map((i) => i.text)
      .join(" ")
      .replace(/\s+/g, " ")
      .trim(),
  );
}

// Removes lines that repeat identically across many pages at a
// consistent relative position (top or bottom of the page) — this is
// the running-header/footer pattern that was causing pdf-parse to
// splice duplicate/out-of-order content into the extracted text.
// A line only counts as header/footer boilerplate if it appears on
// more than half the pages; incidental short repeated phrases in real
// body text (rare, but possible) won't hit that bar.
function stripRepeatedHeaderFooterLines(pagesOfLines) {
  const totalPages = pagesOfLines.length;
  if (totalPages < 3) return pagesOfLines; // not enough pages for the pattern to be meaningful

  const lineOccurrences = new Map(); // trimmed line text -> count of pages it appears on (top or bottom 2 lines only)

  for (const lines of pagesOfLines) {
    const edgeLines = new Set([...lines.slice(0, 2), ...lines.slice(-2)]);
    for (const line of edgeLines) {
      if (!line) continue;
      lineOccurrences.set(line, (lineOccurrences.get(line) || 0) + 1);
    }
  }

  const boilerplate = new Set(
    [...lineOccurrences.entries()]
      .filter(([, count]) => count > totalPages / 2)
      .map(([line]) => line),
  );

  if (boilerplate.size === 0) return pagesOfLines;

  return pagesOfLines.map((lines) =>
    lines.filter((line) => !boilerplate.has(line)),
  );
}

// Splits a flat list of lines into paragraph-ish chunks. pdfjs gives
// us discrete lines, not pre-joined paragraphs, so consecutive lines
// are joined with a space (soft-wrapped text) and a paragraph break is
// inserted wherever a line is very short relative to its neighbors
// (heuristic for "this was a genuine paragraph end, not a wrap") OR
// wherever the source PDF had a blank-line gap (not directly visible
// here since pdfjs doesn't report blank lines, so this is intentionally
// conservative — under-splitting into fewer, longer paragraphs is a much
// safer failure mode than the duplication/splicing bug we're replacing).
function joinLinesIntoParagraphs(allLines) {
  const paragraphs = [];
  let current = [];

  for (const line of allLines) {
    current.push(line);
    // Heuristic: a line ending in sentence-final punctuation AND
    // noticeably shorter than a full line is likely a paragraph end.
    // This is conservative on purpose — see comment above.
    if (/[.!?]["')\]]?$/.test(line) && line.length < 70) {
      paragraphs.push(current.join(" ").replace(/\s+/g, " ").trim());
      current = [];
    }
  }
  if (current.length > 0) {
    paragraphs.push(current.join(" ").replace(/\s+/g, " ").trim());
  }

  return paragraphs.filter((p) => p.length > 0);
}

async function loadAndExtractPdf(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext !== ".pdf") {
    return {
      ok: false,
      error: "not-a-pdf",
      message: "Only .pdf files are supported.",
    };
  }

  let stat;
  try {
    stat = await fs.stat(filePath);
  } catch (err) {
    return {
      ok: false,
      error: "not-found",
      message: "That file couldn't be found.",
    };
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
    return {
      ok: false,
      error: "read-failed",
      message: "Couldn't read that file.",
    };
  }

  let pdfDocument;
  try {
    const pdfjs = await getPdfjs();
    const loadingTask = pdfjs.getDocument({ data: new Uint8Array(buffer) });
    pdfDocument = await loadingTask.promise;

    const pageCount = pdfDocument.numPages;
    const pagesOfLines = [];

    for (let pageNum = 1; pageNum <= pageCount; pageNum++) {
      const page = await pdfDocument.getPage(pageNum);
      const lines = await extractPageLines(page);
      pagesOfLines.push(lines);
      page.cleanup();
    }

    const cleanedPages = stripRepeatedHeaderFooterLines(pagesOfLines);
    // TEMP DEBUG — remove after diagnosing duplication
    console.log("=== PAGE 1 LINES ===");
    console.log(JSON.stringify(cleanedPages[0], null, 2));
    console.log("=== PAGE 2 LINES (first 10) ===");
    console.log(JSON.stringify(cleanedPages[1]?.slice(0, 10), null, 2));


    const allLines = cleanedPages.flat();
    const paragraphs = joinLinesIntoParagraphs(allLines);
        // TEMP DEBUG — remove after diagnosing duplication
    console.log("=== PARAGRAPHS (first 6) ===");
    console.log(JSON.stringify(paragraphs.slice(0, 6), null, 2));

    return {
      ok: true,
      fileName: path.basename(filePath),
      filePath,
      title: path.basename(filePath, ext),
      paragraphs,
      pageCount,
    };
  } catch (err) {
    console.error("[pdf:load] pdfjs-dist extraction failed:", err);
    return {
      ok: false,
      error: "parse-failed",
      message:
        "Couldn't extract text from that PDF. It may be scanned or image-only.",
    };
  } finally {
    if (pdfDocument && typeof pdfDocument.destroy === "function") {
      await pdfDocument.destroy();
    }
  }
}

function registerPdfIpc() {
  ipcMain.handle("pdf:load", async (_event, filePath) => {
    if (typeof filePath !== "string" || !filePath) {
      return {
        ok: false,
        error: "invalid-path",
        message: "No file path given.",
      };
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
