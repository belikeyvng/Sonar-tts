// src/main/ipc/payment.js
//
// Wires up the Paystack checkout flow: opens a BrowserWindow popup for
// the hosted checkout, polls the license server until a license is
// ready, then feeds it into the SAME licenseEngine/licenseStore the
// onboarding "browse for a license file" flow already uses — payment
// is just a second source of a license object, not a separate
// activation path.
//
// Call this once from main.js, after registerLicenseIpc() — it needs
// the already-constructed licenseEngine and licenseStore back from
// that call, so registerLicenseIpc's `return licenseEngine` needs a
// matching `return licenseStore` too (see note in main.js wiring
// below). Simplest fix: have registerLicenseIpc return both.

const { ipcMain, BrowserWindow } = require("electron");
//const fetch = require("node-fetch"); // already a dep? if not: npm install node-fetch@2 in the Electron app too
const { LICENSE_SERVER_URL } = require("../config");

const POLL_INTERVAL_MS = 2000;
const POLL_TIMEOUT_MS = 5 * 60 * 1000; // give up after 5 minutes of no webhook

function registerPaymentIpc({ licenseEngine, licenseStore }) {
  ipcMain.handle("payment:startCheckout", async (event, email) => {
    // 1. Ask the backend to start a Paystack transaction.
    let initData;
    try {
      const res = await fetch(`${LICENSE_SERVER_URL}/transaction/initialize`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      initData = await res.json();
      if (!res.ok || !initData.status) {
        throw new Error(initData.message || "Server rejected the request");
      }
    } catch (err) {
      console.error("Failed to start checkout:", err.message);
      return { ok: false, reason: "INIT_FAILED", message: err.message };
    }

    const { authorizationUrl, reference } = initData;

    // 2. Open the hosted checkout page in a popup window.
    const popup = new BrowserWindow({
      width: 480,
      height: 720,
      title: "Sonar Pro — Checkout",
      webPreferences: { nodeIntegration: false, contextIsolation: true },
    });
    popup.loadURL(authorizationUrl);

    // 3. Poll the license server until the webhook has landed and a
    // license is ready (or until the user closes the popup, or we
    // time out waiting).
    return new Promise((resolve) => {
      let settled = false;
      let pollTimer = null;
      let timeoutTimer = null;

      function finish(result) {
        if (settled) return;
        settled = true;
        clearInterval(pollTimer);
        clearTimeout(timeoutTimer);
        if (!popup.isDestroyed()) popup.close();
        resolve(result);
      }

      popup.on("closed", () => {
        // User closed the popup manually — only treat as a cancel if
        // we haven't already resolved via a successful poll.
        finish({ ok: false, reason: "POPUP_CLOSED" });
      });

      pollTimer = setInterval(async () => {
        try {
          const res = await fetch(
            `${LICENSE_SERVER_URL}/license/${encodeURIComponent(reference)}`,
          );
          const data = await res.json();

          if (data.status === "ready") {
            const activateResult = licenseEngine.activate(data.license);
            if (activateResult.success) {
              licenseStore.save(data.license);
            }
            finish({
              ok: activateResult.success,
              reason: activateResult.success ? null : activateResult.reason,
              license: activateResult.license || null,
            });
          } else if (data.status === "failed") {
            finish({ ok: false, reason: data.reason || "PAYMENT_FAILED" });
          }
          // "pending" — keep polling
        } catch (err) {
          // Transient network hiccup while polling — don't give up on
          // a single failed poll, just try again next interval.
          console.warn("Poll attempt failed, will retry:", err.message);
        }
      }, POLL_INTERVAL_MS);

      timeoutTimer = setTimeout(() => {
        finish({ ok: false, reason: "TIMEOUT" });
      }, POLL_TIMEOUT_MS);
    });
  });
}

module.exports = registerPaymentIpc;
