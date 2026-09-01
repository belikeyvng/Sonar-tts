// src/main/config.js
//
// Single source of truth for the license server's base URL. Swap this
// one line when moving from local dev to the deployed Railway URL —
// nothing else in the app should hardcode this.

const LICENSE_SERVER_URL = "https://sonar-license-server-production.up.railway.app";

module.exports = { LICENSE_SERVER_URL };
