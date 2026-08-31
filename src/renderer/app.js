// src/renderer/app.js
//
// Deliberately minimal: one state object, one render function per slot.
// No framework, no virtual DOM — just clone the right <template>, bind
// data-bind fields, wire data-action listeners. Rapid-dev friendly:
// extend `state` and the render*() functions as real features land.

const ACCENT_COLOR_OPTIONS = [
  "#8b5cf6",
  "#409CF2",
  "#FF6B6B",
  "#EC137F",
  "#00D2FF",
];

const ORB_BASE_HUE = 268; // orb-2.webm's dominant hue (violet/blue-violet band)

function applyAccentColor(hex) {
  const { h, s, l } = hexToHsl(hex);

  const hover = hslToHex(h, s, Math.max(l - 8, 0));
  const subtleRgb = hslToHex(h, Math.min(s, 80), 55); // fuller-strength color as the RGB base
  const thin = hslToHex(h, Math.min(s, 70), 82);
  const gradientEnd = hslToHex(
    (h + 45) % 360,
    Math.min(s + 10, 90),
    Math.max(l - 5, 30),
  );

  // Orb hue-rotation: shift orb-2.webm's own palette by the difference
  // between its base hue and the newly selected accent's hue. Normalized
  // into -180..180 so rotation always takes the shorter path around the
  // wheel (avoids e.g. rotating 300deg when -60deg gets the same result).
  let orbRotation = h - ORB_BASE_HUE;
  orbRotation = ((((orbRotation + 180) % 360) + 360) % 360) - 180;

  const root = document.documentElement.style;
  root.setProperty("--color-accent", hex);
  root.setProperty("--color-accent-hover", hover);
  root.setProperty("--color-accent-subtle", hexToRgba(subtleRgb, 0.12));
  root.setProperty("--color-accent-thin", thin);
  root.setProperty("--gradient-brand-start", hex);
  root.setProperty("--gradient-brand-end", gradientEnd);
  root.setProperty(
    "--shadow-accent-glow",
    `0 0 0 1px ${hex}, 0 0 24px ${hexToRgba(hex, 0.35)}`,
  );
  root.setProperty(
    "--shadow-accent-glow-subtle",
    `0 0 0 .5px ${hex}, 0 0 24px ${hexToRgba(hex, 0.171)}`,
  );
  root.setProperty("--orb-hue-rotation", `${orbRotation}deg`);
}

function hexToRgba(hex, alpha) {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function hexToRgb(hex) {
  const clean = hex.replace("#", "");
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  return { r, g, b };
}

function hexToHsl(hex) {
  let { r, g, b } = hexToRgb(hex);
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h, s;
  const l = (max + min) / 2;

  if (max === min) {
    h = s = 0;
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }

  return { h: h * 360, s: s * 100, l: l * 100 };
}

function hslToHex(h, s, l) {
  s /= 100;
  l /= 100;
  const k = (n) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n) =>
    l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  const toHex = (x) =>
    Math.round(255 * x)
      .toString(16)
      .padStart(2, "0");
  return `#${toHex(f(0))}${toHex(f(8))}${toHex(f(4))}`;
}

const ACCENT_OPTIONS = [
  { id: "british", name: "British English", flag: "🇬🇧" },
  { id: "american", name: "American English", flag: "🇺🇸" },
];
// TODO: real "has this user onboarded before" check needs a persisted
// settings file (same pattern as UsageStore/LicenseStore — an IPC call
// backed by app.getPath("userData")). Hardcoded false for now so the
// flow is always visible during development.
const HAS_ONBOARDED_BEFORE = false;

const SUN_ICON = `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M7.5458 1.38933C6.34549 1.47489 5.19102 1.88442 4.20569 2.57415C3.22037 3.26388 2.44121 4.20791 1.95145 5.3054C1.46169 6.40289 1.27972 7.6126 1.425 8.80531C1.57027 9.99802 2.03732 11.1289 2.77625 12.0772C3.51519 13.0255 4.49825 13.7556 5.62042 14.1894C6.7426 14.6232 7.96173 14.7446 9.14758 14.5404C10.3334 14.3362 11.4415 13.8142 12.3533 13.0302C13.2652 12.2462 13.9466 11.2295 14.3247 10.0889C13.1666 10.5664 11.8836 10.6514 10.6725 10.331C9.46134 10.0105 8.38888 9.30227 7.61956 8.31484C6.85023 7.32742 6.42651 6.1153 6.41335 4.86435C6.40019 3.6134 6.79833 2.39267 7.54671 1.38933M2.94606e-08 8.00504C-9.90165e-05 6.85143 0.249546 5.71143 0.731834 4.66314C1.21412 3.61484 1.91765 2.68302 2.79424 1.93151C3.67083 1.17999 4.69975 0.626543 5.81052 0.309071C6.9213 -0.00840044 8.08768 -0.0823922 9.22977 0.0921649C9.36363 0.112574 9.48848 0.172022 9.58862 0.263042C9.68876 0.354062 9.75973 0.472596 9.79262 0.603757C9.82551 0.734919 9.81885 0.872859 9.77348 1.00025C9.72811 1.12765 9.64605 1.23882 9.53761 1.3198C9.07553 1.66606 8.68713 2.10071 8.39506 2.5984C8.10299 3.0961 7.91309 3.64688 7.83643 4.21862C7.75978 4.79036 7.79791 5.37162 7.9486 5.92849C8.09929 6.48536 8.35952 7.00671 8.71412 7.46211C9.06871 7.91752 9.51058 8.29787 10.0139 8.58099C10.5173 8.8641 11.0721 9.04432 11.6459 9.11112C12.2198 9.17792 12.8012 9.12997 13.3563 8.97006C13.9114 8.81016 14.429 8.5415 14.879 8.17976C14.9842 8.09429 15.1123 8.04179 15.2473 8.02887C15.3822 8.01595 15.518 8.04319 15.6375 8.10714C15.757 8.1711 15.8549 8.26893 15.9188 8.38831C15.9827 8.50769 16.0099 8.64328 15.9968 8.77803C15.7955 10.8225 14.8146 12.7115 13.2573 14.054C11.6999 15.3966 9.68518 16.0899 7.63006 15.9906C5.57494 15.8913 3.63671 15.007 2.21646 13.5205C0.796206 12.0341 0.00264918 10.0594 2.94606e-08 8.00504Z" fill="#94A3B8"/></svg>`;

const MOON_ICON = `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M8 3.33333C8.64583 3.33333 9.25 3.45486 9.8125 3.69792C10.375 3.94097 10.8715 4.27431 11.3021 4.69792C11.7326 5.12153 12.066 5.61458 12.3021 6.17708C12.5382 6.73958 12.6597 7.34722 12.6667 8C12.6667 8.64583 12.5451 9.25 12.3021 9.8125C12.059 10.375 11.7257 10.8715 11.3021 11.3021C10.8785 11.7326 10.3854 12.066 9.82292 12.3021C9.26042 12.5382 8.65278 12.6597 8 12.6667C7.35417 12.6667 6.75 12.5451 6.1875 12.3021C5.625 12.059 5.12847 11.7257 4.69792 11.3021C4.26736 10.8785 3.93403 10.3854 3.69792 9.82292C3.46181 9.26042 3.34028 8.65278 3.33333 8C3.33333 7.35417 3.45486 6.75 3.69792 6.1875C3.94097 5.625 4.27431 5.12847 4.69792 4.69792C5.12153 4.26736 5.61458 3.93403 6.17708 3.69792C6.73958 3.46181 7.34722 3.34028 8 3.33333ZM8 11.3333C8.45833 11.3333 8.88889 11.2465 9.29167 11.0729C9.69444 10.8993 10.0451 10.6632 10.3438 10.3646C10.6424 10.066 10.8819 9.71181 11.0625 9.30208C11.2431 8.89236 11.3333 8.45833 11.3333 8C11.3333 7.54167 11.2465 7.11111 11.0729 6.70833C10.8993 6.30556 10.6597 5.95486 10.3542 5.65625C10.0486 5.35764 9.69444 5.11806 9.29167 4.9375C8.88889 4.75694 8.45833 4.66667 8 4.66667C7.54167 4.66667 7.11111 4.75347 6.70833 4.92708C6.30556 5.10069 5.95139 5.34028 5.64583 5.64583C5.34028 5.95139 5.10069 6.30556 4.92708 6.70833C4.75347 7.11111 4.66667 7.54167 4.66667 8C4.66667 8.45833 4.75347 8.88889 4.92708 9.29167C5.10069 9.69444 5.33681 10.0486 5.63542 10.3542C5.93403 10.6597 6.28819 10.8993 6.69792 11.0729C7.10764 11.2465 7.54167 11.3333 8 11.3333ZM8.66667 2H7.33333V0H8.66667V2ZM3.28125 4.22917L1.875 2.8125L2.8125 1.875L4.22917 3.28125L3.28125 4.22917ZM2 8.66667H0V7.33333H2V8.66667ZM3.28125 11.7708L4.22917 12.7188L2.8125 14.125L1.875 13.1875L3.28125 11.7708ZM7.33333 14H8.66667V16H7.33333V14ZM12.7188 11.7708L14.125 13.1875L13.1875 14.125L11.7708 12.7188L12.7188 11.7708ZM16 7.33333V8.66667H14V7.33333H16ZM12.7188 4.22917L11.7708 3.28125L13.1875 1.875L14.125 2.8125L12.7188 4.22917Z" fill="#94A3B8"/></svg>`;
const PAUSE_ICON = `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M15.0006 2.5H12.5003C12.04 2.5 11.6669 2.8731 11.6669 3.33333V16.6667C11.6669 17.1269 12.04 17.5 12.5003 17.5H15.0006C15.4609 17.5 15.834 17.1269 15.834 16.6667V3.33333C15.834 2.8731 15.4609 2.5 15.0006 2.5Z" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M7.49973 2.5H4.99944C4.53915 2.5 4.16602 2.8731 4.16602 3.33333V16.6667C4.16602 17.1269 4.53915 17.5 4.99944 17.5H7.49973C7.96002 17.5 8.33316 17.1269 8.33316 16.6667V3.33333C8.33316 2.8731 7.96002 2.5 7.49973 2.5Z" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>`;

const PLAY_ICON = `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M5 3.5L16 10L5 16.5V3.5Z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>`;

// Renders the correct icon (sun when currently dark → click to go light;
// moon when currently light → click to go dark) into every mounted
// theme-toggle button. Both empty-state and reading-pane have one, plus
// the settings modal's thumb toggle (position/emphasis only, not an icon
// swap — it stays mounted across renders since modalSlot isn't recreated
// per-render the way other slots are).
function updateThemeToggleIcons() {
  const isDark = document.documentElement.dataset.theme === "dark";
  const icon = isDark ? SUN_ICON : MOON_ICON;

  document
    .querySelectorAll(".empty-state__theme-icon, .reading-pane__theme-icon")
    .forEach((el) => {
      el.innerHTML = icon;
    });

  const settingsToggle = modalSlot.querySelector(
    ".settings-modal__theme-toggle",
  );
  if (settingsToggle) {
    settingsToggle.classList.toggle(
      "settings-modal__theme-toggle--dark",
      isDark,
    );
  }
}

const state = {
  // --- View routing ---
  // "onboarding" | "app" | "upgrade"
  currentView: HAS_ONBOARDED_BEFORE ? "app" : "onboarding",
  previousView: "app", // where "Back to app" on the upgrade page returns to

  // --- Onboarding ---
  onboardingStep: "preferences", // "name" | "preferences" | "license"
  onboardingData: {
    name: "",
    voiceGender: "female",
    accent: "american",
    accentColor: ACCENT_COLOR_OPTIONS[0],
    licensePath: null,
    licenseStatus: "", // "", "checking", "valid", "invalid"
  },

  // --- Main app ---
  accountName: "Alexander Chen",
  accountEmail: "alex@sonar.ai",
  firstName: "Alex",

  pinnedFiles: [{ id: "meeting-notes", name: "Meeting_Notes.pdf" }],
  recentFiles: [
    { id: "project-notes", name: "Project_Notes.pdf" },
    { id: "cook", name: "Cook.pdf" },
    { id: "story", name: "Story.pdf" },
  ],

  // Sample documents keyed by file id — stands in for real PDF loading/
  // extraction until that pipeline exists. TODO: replace with actual
  // PDF text extraction + IPC call when that's wired up.
  documents: {
    "meeting-notes": {
      fileName: "Meeting_Notes.pdf",
      title: "Meeting Notes",
      paragraphs: [
        "Placeholder content for Meeting_Notes.pdf.",
        "Real PDF text extraction isn't wired up yet — this is stand-in copy.",
      ],
      narratorName: "Helen (NGA)",
      voiceId: "en_US-amy-medium",
      audioReady: false,
      audioFile: null,
      speed: "1x",
      timeElapsed: "0:00",
      timeTotal: "0:00",
      progress: 0,
      sectionLabel: "Section 1 of 1",
    },
    "project-notes": {
      fileName: "Project_Notes.pdf",
      title: "Project Notes",
      paragraphs: ["Placeholder content for Project_Notes.pdf."],
      narratorName: "Helen (NGA)",
      voiceId: "en_US-amy-medium",
      audioReady: false,
      audioFile: null,
      speed: "1x",
      timeElapsed: "0:00",
      timeTotal: "0:00",
      progress: 0,
      sectionLabel: "Section 1 of 1",
    },
    cook: {
      fileName: "Cook.pdf",
      title: "Cook",
      paragraphs: ["Placeholder content for Cook.pdf."],
      narratorName: "Helen (NGA)",
      voiceId: "en_US-amy-medium",
      audioReady: false,
      audioFile: null,
      speed: "1x",
      timeElapsed: "0:00",
      timeTotal: "0:00",
      progress: 0,
      sectionLabel: "Section 1 of 1",
    },
    story: {
      fileName: "Story.pdf",
      title: "Story",
      paragraphs: ["Placeholder content for Story.pdf."],
      narratorName: "Helen (NGA)",
      voiceId: "en_US-amy-medium",
      audioReady: false,
      audioFile: null,
      speed: "1x",
      timeElapsed: "0:00",
      timeTotal: "0:00",
      progress: 0,
      sectionLabel: "Section 1 of 1",
    },
  },
  // null = show empty-state; an object (one of `documents` above) =
  // show reader-view + player-panel + mini-player
  currentDocument: null,

  // Set while pdf:load/pdf:browse is in flight, or to an error message
  // string if the last attempt failed. Empty-state reads this to show
  // a spinner/error instead of the default dropzone copy.
  dropzoneStatus: null, // null | "loading" | { error: string }

  plans: [
    {
      id: "free",
      name: "Free",
      badge: "YOUR PLAN",
      priceAmount: "N0.00",
      pricePeriod: "/ month",
      description: "Standard document scanning and basic narration settings.",
      features: [
        "Basic voice options & standard narrators",
        "Unlimited document uploads",
        "Limit on upload word count and document length",
        "Automatic line-by-line word highlighting",
      ],
      ctaLabel: "Current Tier Active",
      ctaDisabled: true,
    },
    {
      id: "pro",
      name: "Pro",
      badge: "RECOMMENDED",
      priceAmount: "N4,500",
      pricePeriod: "/ month",
      description:
        "Unlock high fidelity voices with ultra-customizable controls.",
      features: [
        "Premium natural human-like voice options",
        "Unlimited PDF document uploads per day",
        "Generate and download offline audio",
        "No limit on word count or document length",
      ],
      ctaLabel: "Upgrade to Pro",
      ctaDisabled: false,
    },
  ],
};

// --- Playback runtime state (separate from `state` — this tracks the
// live Audio element, not serializable UI state, and must survive
// across render() calls since templates get re-cloned every time). ---
const playback = {
  audio: null, // the one shared <audio> element
  docId: null, // which document's audioFile is currently loaded
  isPlaying: false,
  progressTimer: null, // interval driving the scrubber while playing
  scrubbing: false,
};

// Updates the --fill-percent custom property on a range input so its
// CSS gradient track (see player-panel.css) shows the correct amount
// filled. Native range inputs have no cross-browser "filled track"
// pseudo-element in Chromium (which is what Electron uses), so the
// fill has to be faked via a JS-driven gradient stop instead.
function updateRangeFill(input) {
  if (!input) return;
  const min = Number(input.min) || 0;
  const max = Number(input.max) || 100;
  const pct = ((Number(input.value) - min) / (max - min)) * 100;
  input.style.setProperty("--fill-percent", `${pct}%`);
}

function formatTime(seconds) {
  if (!isFinite(seconds) || seconds < 0) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

// Returns up to 2 uppercase initials from a display name — "Alexander
// Chen" -> "AC", a single-word name -> its first letter. Falls back to
// "?" for an empty/missing name so the avatar never renders blank.
function getInitials(name) {
  const parts = (name || "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// --- Root containers -----------------------------------------------------
const roots = {
  onboarding: document.getElementById("onboarding-root"),
  appShell: document.getElementById("app-shell"),
  upgradePage: document.getElementById("upgrade-page-root"),
};

// --- Slot elements (persistent — grabbed once) -----------------------
const slots = {
  onboardingStep: document.getElementById("onboarding-step-slot"),
  fileNav: document.getElementById("file-nav-slot"),
  main: document.getElementById("main-slot"),
  playerPanel: document.getElementById("player-panel-slot"),
  miniPlayer: document.getElementById("mini-player-slot"),
  upgradePagePlans: document.getElementById("upgrade-page-plans-slot"),
};

const modalSlot = document.getElementById("modal-slot");

// --- Helpers -----------------------------------------------------------

function clone(templateId) {
  const tpl = document.getElementById(templateId);
  return tpl.content.cloneNode(true);
}

function bind(root, key, value) {
  const el = root.querySelector(`[data-bind="${key}"]`);
  if (!el) return;
  if (el.tagName === "INPUT") {
    el.value = value;
  } else {
    el.textContent = value;
  }
}

function on(root, action, handler) {
  const el = root.querySelector(`[data-action="${action}"]`);
  if (el) el.addEventListener("click", handler);
}

// ==========================================================================
// UPGRADE PAGE
// ==========================================================================

function renderUpgradePage() {
  const root = roots.upgradePage;

  on(root, "back-to-app", backToApp);
  on(root, "cancel-subscription-info", () => {
    // TODO: real behavior once settings exists — likely just
    // navigates to a settings/billing view rather than doing
    // anything inline here.
    console.log("TODO: show cancel-subscription info (settings not built yet)");
  });

  const plansContainer = slots.upgradePagePlans;
  plansContainer.replaceChildren();
  for (const plan of state.plans) {
    plansContainer.appendChild(renderPlanCard(plan));
  }
}

async function updateFileNavPlanLabel() {
  const label = slots.fileNav.querySelector('[data-bind="accountPlan"]');
  const upgradeButton = slots.fileNav.querySelector(
    '[data-action="upgrade-to-pro"]',
  );
  if (!label && !upgradeButton) return;

  const status = await window.sonar.license.getStatus();
  const isPro = status.activated && status.plan === "pro";

  if (label) label.textContent = isPro ? "Pro" : "Free";
  if (upgradeButton) {
    upgradeButton.classList.toggle("file-nav__upgrade--visible", !isPro);
  }
}

function renderPlanCard(plan) {
  const fragment = clone("tpl-plan-card");

  const card = fragment.querySelector(".plan-card");
  card.dataset.plan = plan.id;

  bind(fragment, "planName", plan.name);
  bind(fragment, "planBadge", plan.badge);
  bind(fragment, "priceAmount", plan.priceAmount);
  bind(fragment, "pricePeriod", plan.pricePeriod);
  bind(fragment, "planDescription", plan.description);

  const featureList = fragment.querySelector('[data-list="features"]');
  for (const featureText of plan.features) {
    const featureFragment = clone("tpl-plan-feature");
    bind(featureFragment, "featureText", featureText);
    featureList.appendChild(featureFragment);
  }

  const cta = fragment.querySelector('[data-action="plan-cta"]');
  cta.textContent = plan.ctaLabel;
  cta.disabled = plan.ctaDisabled;
  if (!plan.ctaDisabled) {
    cta.addEventListener("click", () => handlePlanCta(plan.id));
  }

  return fragment;
}

function handlePlanCta(planId) {
  if (planId === "pro") {
    // TODO: wire to real Paystack checkout flow. On success, that
    // flow should call window.sonar.license.activate(...) (or an
    // equivalent purchase-then-activate IPC call) and only then
    // return the user to the app.
    console.log("TODO: launch Paystack checkout for Pro upgrade");
  }
}

// ==========================================================================
// ONBOARDING
// ==========================================================================

function renderOnboardingStep() {
  const step = state.onboardingStep;

  if (step === "preferences") {
    renderOnboardingPreferences();
  } else if (step === "license") {
    renderOnboardingLicense();
  }
}

function renderOnboardingPreferences() {
  const fragment = clone("tpl-onboarding-preferences");
  const data = state.onboardingData;

  const nameInput = fragment.querySelector('[data-bind="nameInput"]');
  nameInput.value = data.name;
  nameInput.addEventListener("input", (e) => {
    data.name = e.target.value;
  });

  const pillGroup = fragment.querySelector('[data-group="voiceGender"]');
  pillGroup.querySelectorAll(".onboarding-step__pill").forEach((pill) => {
    pill.setAttribute(
      "aria-pressed",
      String(pill.dataset.value === data.voiceGender),
    );
    pill.addEventListener("click", () => {
      data.voiceGender = pill.dataset.value;
      pillGroup.querySelectorAll(".onboarding-step__pill").forEach((p) => {
        p.setAttribute(
          "aria-pressed",
          String(p.dataset.value === data.voiceGender),
        );
      });
    });
  });

  const accentGroup = fragment.querySelector('[data-group="accent"]');
  for (const accent of ACCENT_OPTIONS) {
    const cardFrag = clone("tpl-onboarding-accent-card");
    const card = cardFrag.querySelector(".onboarding-step__accent-card");
    card.dataset.accentId = accent.id;
    card.setAttribute("aria-pressed", String(accent.id === data.accent));
    bind(cardFrag, "accentFlag", accent.flag);
    bind(cardFrag, "accentName", accent.name);
    card.addEventListener("click", () => {
      data.accent = accent.id;
      accentGroup
        .querySelectorAll(".onboarding-step__accent-card")
        .forEach((c) => {
          c.setAttribute(
            "aria-pressed",
            String(c.dataset.accentId === accent.id),
          );
        });
    });
    accentGroup.appendChild(cardFrag);
  }

  const swatchGroup = fragment.querySelector('[data-group="accentColor"]');
  for (const color of ACCENT_COLOR_OPTIONS) {
    const swatch = clone("tpl-onboarding-swatch");
    const button = swatch.querySelector(".onboarding-step__swatch");
    button.dataset.colorValue = color;
    button.style.backgroundColor = color;
    button.style.color = color;
    button.setAttribute("aria-label", color);
    button.setAttribute("aria-pressed", String(color === data.accentColor));
    button.addEventListener("click", () => {
      data.accentColor = color;
      applyAccentColor(color);
      swatchGroup.querySelectorAll(".onboarding-step__swatch").forEach((el) => {
        el.setAttribute(
          "aria-pressed",
          String(el.dataset.colorValue === color),
        );
      });
    });
    swatchGroup.appendChild(swatch);
  }

  on(fragment, "next", () => {
    if (!data.name.trim()) return;
    state.onboardingStep = "license";
    renderOnboardingStep();
  });

  slots.onboardingStep.replaceChildren(fragment);
}

function renderOnboardingLicense() {
  const fragment = clone("tpl-onboarding-license");
  const data = state.onboardingData;

  bind(fragment, "licensePathDisplay", data.licensePath || "");

  const statusEl = fragment.querySelector('[data-bind="licenseStatus"]');
  function setStatus(text, stateName) {
    if (!statusEl) return;
    statusEl.textContent = text;
    statusEl.dataset.state = stateName || "";
  }
  setStatus(data.licenseStatusText || "", data.licenseState || "");

  const activateButton = fragment.querySelector('[data-action="activate-and-finish"]');

  // Gated until a license file has actually been chosen — picking a
  // file (regardless of whether it later validates) is what unlocks
  // this button; validity itself is checked when it's clicked.
  function updateActivateButtonState() {
    if (!activateButton) return;
    activateButton.disabled = !data.licensePath;
  }
  updateActivateButtonState();

  on(fragment, "browse-license", async () => {
    const result = await window.sonar.license.browseFile();
    if (!result.ok) return;

    data.licensePath = result.filePath;

    const pathInput = slots.onboardingStep.querySelector(
      '[data-bind="licensePathDisplay"]',
    );
    if (pathInput) pathInput.value = result.filePath;

    updateActivateButtonState();

    setStatus("Checking license…", "checking");
    data.licenseStatusText = "Checking license…";
    data.licenseState = "checking";

    const activateResult = await window.sonar.license.activate(result.filePath);

    if (activateResult.success) {
      const plan = activateResult.license?.plan || "pro";
      const text = `Valid — ${plan} license found`;
      setStatus(text, "valid");
      data.licenseStatusText = text;
      data.licenseState = "valid";
      data.licenseValidated = true;
    } else {
      const text = licenseErrorMessage(activateResult.reason);
      setStatus(text, "invalid");
      data.licenseStatusText = text;
      data.licenseState = "invalid";
      data.licenseValidated = false;
    }
  });

  on(fragment, "back", () => {
    state.onboardingStep = "preferences";
    renderOnboardingStep();
  });

  on(fragment, "skip", () => {
    finishOnboarding({ activateLicense: false });
  });

  on(fragment, "activate-and-finish", () => {
    if (!data.licensePath) return; // shouldn't be reachable — button is disabled — but guard anyway

    if (data.licenseValidated) {
      showToast("Sonar Pro activated!", { variant: "success" });
    } else {
      showToast(
        data.licenseStatusText || "Couldn't activate this license.",
        { variant: "error" },
      );
    }

    // Proceed to the app either way once a file's been through the
    // check — a failed license doesn't trap the user on this screen,
    // it just means they continue on the free plan (activeLicense
    // reflects the truth: only true if it actually validated).
    finishOnboarding({ activateLicense: Boolean(data.licenseValidated) });
  });

  slots.onboardingStep.replaceChildren(fragment);
}

// Turns a licenseEngine validation failure reason into user-facing copy.
function licenseErrorMessage(reason) {
  switch (reason) {
    case "INVALID_LICENSE_FILE":
      return "That file isn't a valid license file.";
    case "INVALID_STRUCTURE":
    case "MISSING_FIELDS":
      return "This license file is malformed or incomplete.";
    case "INVALID_PLAN":
      return "This license specifies an unrecognized plan.";
    case "INVALID_SIGNATURE":
      return "This license failed signature verification.";
    case "LICENSE_EXPIRED":
      return "This license has expired.";
    default:
      return "Couldn't activate this license.";
  }
}

function finishOnboarding({ activateLicense }) {
  const data = state.onboardingData;
  const trimmedName = data.name.trim();

  state.firstName = trimmedName || state.firstName;
  state.accountName = trimmedName || state.accountName;

  showWelcomeSplash(state.firstName, () => {
    state.currentView = "app";
    showActiveRoot();
    renderFileNav();
    render();
  });
}

// Plays a short "Welcome, {name}" splash after onboarding completes,
// distinct from the app-boot splash (different chime, personalized
// text) — then calls onDone once it's faded out. Mirrors the boot
// splash's timing/fade pattern from the DOMContentLoaded handler below.
function showWelcomeSplash(firstName, onDone) {
  const splash = document.getElementById("welcome-splash-screen");
  if (!splash) {
    onDone();
    return;
  }

  const messageEl = document.getElementById("welcome-splash-message");
  if (messageEl) {
    messageEl.textContent = firstName ? `Welcome, ${firstName}` : "You're all set";
  }

  splash.classList.remove("splash-screen--hidden");
  splash.style.display = "";

  const chime = new Audio("./assets/sound/splash-3.wav");
  chime.volume = 0.6;
  chime.play().catch((err) => {
    console.warn("Welcome splash chime blocked or failed to play:", err);
  });

  setTimeout(() => {
    splash.classList.add("splash-screen--hidden");
    setTimeout(() => {
      splash.style.display = "none";
      onDone();
    }, 300);
  }, 1200);
}
// --- Root switching --------------------------------------------------

function showActiveRoot() {
  roots.onboarding.style.display =
    state.currentView === "onboarding" ? "" : "none";
  roots.appShell.style.display = state.currentView === "app" ? "" : "none";
  roots.upgradePage.style.display =
    state.currentView === "upgrade" ? "" : "none";
}

function goToUpgradePage() {
  // Remember where we came from so "Back to app" is correct whether
  // triggered from the reader view, empty-state, or elsewhere.
  if (state.currentView !== "upgrade") {
    state.previousView = state.currentView;
  }
  state.currentView = "upgrade";
  showActiveRoot();
  renderUpgradePage();
}

function backToApp() {
  state.currentView = state.previousView;
  showActiveRoot();
}

// ==========================================================================
// MAIN APP — file nav (mounted once, never re-rendered)
// ==========================================================================

async function renderFileNav() {
  const fragment = clone("tpl-file-nav");

  bind(fragment, "accountName", state.accountName);
  bind(fragment, "accountEmail", state.accountEmail);

  const avatarEl = fragment.querySelector(".file-nav__avatar");
  if (avatarEl) {
    avatarEl.textContent = getInitials(state.accountName);
    avatarEl.dataset.accentColor = state.onboardingData.accentColor;
  }

  on(fragment, "toggle-pin", togglePin);
  on(fragment, "new-file", goToNewFile);
  on(fragment, "upgrade-to-pro", goToUpgradePage);

  const searchInput = fragment.querySelector(".file-nav__search-input");
  searchInput.addEventListener("input", (e) => {
    handleFileNavSearch(e.target.value);
  });

  const pinnedList = fragment.querySelector('[data-list="pinned"]');
  for (const file of state.pinnedFiles) {
    pinnedList.appendChild(renderFileNavItem(file, "tpl-file-nav-item"));
  }

  const recentsList = fragment.querySelector('[data-list="recents"]');
  for (const file of state.recentFiles) {
    recentsList.appendChild(
      renderFileNavItem(file, "tpl-recent-file-nav-item"),
    );
  }

  const settingsButton = fragment.querySelector(".file-nav__settings");
  if (settingsButton) {
    settingsButton.addEventListener("click", openSettingsModal);
  }

  slots.fileNav.replaceChildren(fragment);

  await updateFileNavPlanLabel();
}

// Click-to-pin toggles a class on the mounted .file-nav element directly
// (file-nav mounts once and is never re-rendered, so no need to route
// this through state + render()). Clicking outside the pinned sidebar
// un-pins it — standard rail/drawer UX.
function togglePin() {
  const fileNavEl = slots.fileNav.querySelector(".file-nav");
  if (!fileNavEl) return;
  state.sidebarPinned = fileNavEl.classList.toggle("file-nav--pinned");
}

document.addEventListener("click", (event) => {
  const fileNavEl = slots.fileNav.querySelector(".file-nav");
  if (!fileNavEl || !fileNavEl.classList.contains("file-nav--pinned")) return;
  if (!fileNavEl.contains(event.target)) {
    fileNavEl.classList.remove("file-nav--pinned");
    state.sidebarPinned = false;
  }
});

function renderFileNavItem(file, templateId = "tpl-recent-file-nav-item") {
  const fragment = clone(templateId);
  bind(fragment, "fileName", file.name);

  const li = fragment.querySelector(".file-nav__item");
  const button = fragment.querySelector(".file-nav__item-button");
  button.dataset.fileId = file.id;
  button.addEventListener("click", () => openFile(file.id));

  const pinBtn = fragment.querySelector('[data-action="pin"]');
  if (pinBtn) {
    pinBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      pinDocument(file.id);
    });
  }

  const unpinBtn = fragment.querySelector('[data-action="unpin"]');
  if (unpinBtn) {
    unpinBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      unpinDocument(file.id);
    });
  }

  const deleteBtn = fragment.querySelector('[data-action="delete"]');
  if (deleteBtn) {
    deleteBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      deleteDocument(file.id, file.name);
    });
  }

  return fragment;
}
// Marks whichever sidebar item (pinned, recents, or search results —
// wherever it currently lives) corresponds to state.currentDocument
// as active, and clears the class from everywhere else. Called after
// every render() since file-nav itself is never re-rendered, so this
// is the only thing keeping the sidebar's selected state in sync.
function updateActiveFileNavItem() {
  const activeId = state.currentDocument
    ? Object.keys(state.documents).find(
        (id) => state.documents[id] === state.currentDocument,
      )
    : null;

  slots.fileNav.querySelectorAll(".file-nav__item-button").forEach((button) => {
    button.classList.toggle(
      "file-nav__item-button--active",
      button.dataset.fileId === activeId,
    );
  });
}

// Search is scoped to state.documents (the full set of known
// documents, not just what's currently listed in Pinned/Recents).
// While a query is active, Pinned/Recents are hidden and replaced
// by a single Search Results section — matching file-nav's "mount
// once, mutate in place" pattern rather than re-rendering the
// whole sidebar.
function handleFileNavSearch(query) {
  const trimmed = query.trim();

  const pinnedSection = slots.fileNav.querySelector(
    '.file-nav__section[aria-label="Pinned files"]',
  );
  const recentsSection = slots.fileNav.querySelector(
    '.file-nav__section[aria-label="Recent files"]',
  );
  const resultsSection = slots.fileNav.querySelector(
    '[data-section="search-results"]',
  );

  if (!trimmed) {
    if (pinnedSection) pinnedSection.style.display = "";
    if (recentsSection) recentsSection.style.display = "";
    if (resultsSection) resultsSection.style.display = "none";
    return;
  }

  if (pinnedSection) pinnedSection.style.display = "none";
  if (recentsSection) recentsSection.style.display = "none";
  if (resultsSection) resultsSection.style.display = "";

  renderSearchResults(trimmed);
}

function renderSearchResults(query) {
  const resultsList = slots.fileNav.querySelector(
    '[data-list="search-results"]',
  );
  if (!resultsList) return;

  resultsList.replaceChildren();

  const lowerQuery = query.toLowerCase();
  const matches = Object.entries(state.documents).filter(([, doc]) =>
    doc.fileName.toLowerCase().includes(lowerQuery),
  );

  if (matches.length === 0) {
    resultsList.appendChild(clone("tpl-search-no-results"));
    return;
  }

  for (const [docId, doc] of matches) {
    resultsList.appendChild(
      renderFileNavItem({ id: docId, name: doc.fileName }),
    );
  }
}

// --- Render: main slot (empty-state OR reader-view) --------------------

function renderMain() {
  if (!state.currentDocument) {
    renderEmptyState();
  } else {
    renderReaderView();
  }
}

function renderEmptyState() {
  const fragment = clone("tpl-empty-state");

  bind(fragment, "firstName", state.firstName);
  on(fragment, "toggle-theme", toggleTheme);
  on(fragment, "browse-files", browseFiles);

  const dropzone = fragment.querySelector('[data-action="dropzone"]');
  const isLoading = state.dropzoneStatus === "loading";

  if (isLoading) {
    dropzone.classList.add("empty-state__dropzone--loading");
    const title = fragment.querySelector(".empty-state__dropzone-title");
    if (title) title.textContent = "Reading your PDF...";
  } else if (state.dropzoneStatus && state.dropzoneStatus.error) {
    dropzone.classList.add("empty-state__dropzone--error");
    const title = fragment.querySelector(".empty-state__dropzone-title");
    if (title) title.textContent = state.dropzoneStatus.error;
  }

  dropzone.addEventListener("click", () => {
    if (isLoading) return;
    browseFiles();
  });
  dropzone.addEventListener("dragover", (e) => {
    e.preventDefault();
    if (isLoading) return;
    dropzone.classList.add("empty-state__dropzone--drag-over");
  });
  dropzone.addEventListener("dragleave", () => {
    dropzone.classList.remove("empty-state__dropzone--drag-over");
  });
  dropzone.addEventListener("drop", (e) => {
    dropzone.classList.remove("empty-state__dropzone--drag-over");
    if (isLoading) return;
    handleFileDrop(e);
  });

  slots.main.replaceChildren(fragment);
  updateThemeToggleIcons();
}

function renderReaderView() {
  const doc = state.currentDocument;
  const fragment = clone("tpl-reader-view");

  bind(fragment, "documentTitle", doc.title);
  on(fragment, "toggle-theme", toggleTheme);

  const body = fragment.querySelector('[data-bind="documentBody"]');

  if (!doc.sentenceMap) {
    doc.sentenceMap = buildSentenceMap(doc.paragraphs);
  }

  let currentParagraphIndex = -1;
  let currentP = null;

  for (const sentence of doc.sentenceMap.sentences) {
    if (sentence.paragraphIndex !== currentParagraphIndex) {
      currentP = document.createElement("p");
      currentP.className = "reading-pane__paragraph";
      body.appendChild(currentP);
      currentParagraphIndex = sentence.paragraphIndex;
    }
    const span = document.createElement("span");
    span.className = "reading-pane__sentence";
    span.dataset.charStart = sentence.charStart;
    span.dataset.charEnd = sentence.charEnd;
    span.textContent = sentence.text + " ";
    currentP.appendChild(span);
  }

  slots.main.replaceChildren(fragment);
  updateThemeToggleIcons();
}

function updateReadAlongHighlight(doc) {
  if (!doc.sentenceMap || !playback.audio || !playback.audio.duration) return;

  const progress = playback.audio.currentTime / playback.audio.duration;
  const targetChar = progress * doc.sentenceMap.totalChars;

  const active = doc.sentenceMap.sentences.find(
    (s) => targetChar >= s.charStart && targetChar < s.charEnd,
  );
  if (!active) return;

  const activeKey = `${active.charStart}-${active.charEnd}`;
  if (doc._lastHighlightKey === activeKey) return; // no change, skip DOM work
  doc._lastHighlightKey = activeKey;

  const allSpans = slots.main.querySelectorAll(".reading-pane__sentence");
  allSpans.forEach((span) =>
    span.classList.remove("reading-pane__sentence--active"),
  );

  const activeSpan = slots.main.querySelector(
    `[data-char-start="${active.charStart}"][data-char-end="${active.charEnd}"]`,
  );
  if (activeSpan) {
    activeSpan.classList.add("reading-pane__sentence--active");
    activeSpan.scrollIntoView({ behavior: "smooth", block: "center" });
  }
}

// --- Render: player-panel + mini-player (only when a document is loaded) --

function renderPlayerPanel() {
  if (!state.currentDocument) {
    slots.playerPanel.replaceChildren();
    return;
  }

  const doc = state.currentDocument;

  if (!doc.audioReady) {
    return renderPlayerPanelGenerate(doc);
  } else {
    return renderPlayerPanelReady(doc);
  }
}

async function renderPlayerPanelGenerate(doc) {
  const fragment = clone("tpl-player-panel-generate");

  bind(fragment, "narratorName", doc.narratorName);

  const generateButton = fragment.querySelector(
    '[data-action="generate-audio"]',
  );
  if (doc.generating) {
    generateButton.textContent = "Generating…";
    generateButton.disabled = true;
  } else {
    generateButton.textContent = "Generate audio";
  }

  const [voices, status] = await Promise.all([
    window.sonar.tts.getVoices(),
    window.sonar.license.getStatus(),
  ]);

  const isPro = status.activated && status.plan === "pro";

  if (!doc.voiceId || !voices.some((v) => v.id === doc.voiceId)) {
    const firstFree = voices.find((v) => v.tier !== "pro");
    doc.voiceId = firstFree ? firstFree.id : voices[0]?.id;
  }

  await setupVoiceDropdown(fragment, doc, voices, isPro);

  on(fragment, "generate-audio", () => generateAudioForCurrentDocument());

  slots.playerPanel.replaceChildren(fragment);

  const video = slots.playerPanel.querySelector(
    ".player-panel__orb-wrap video",
  );
  if (video) {
    video.load();
    video.play().catch((err) => console.error("Orb video play failed:", err));
  }
}

// Formats a voice into its display label (name + gender/accent, plus
// a "(Pro)" suffix for gated voices) — shared by the trigger button
// and every option row so they never drift out of sync.
function formatVoiceLabel(voice, locked, usage) {
  const details = [voice.gender, voice.accent].filter(Boolean).join(", ");
  let label = details ? `${voice.name} — ${details}` : voice.name;
  if (locked) label += " (Pro)";
  if (usage) label += ` · ${usage.remaining}/${usage.limit} left today`;
  return label;
}

// Custom dropdown replacing the native <select> — same data (grouped
// Free/Pro voices) but fully styleable and always opens downward,
// which native <select>/<optgroup> couldn't guarantee. Supports
// click-to-open, click-outside-to-close, and full keyboard nav
// (arrows, Home/End, type-to-jump, Enter/Space/Escape).
async function setupVoiceDropdown(fragment, doc, voices, isPro) {
  const dropdown = fragment.querySelector('[data-bind="voiceDropdown"]');
  const trigger = fragment.querySelector('[data-action="voice-trigger"]');
  const triggerLabel = fragment.querySelector(
    '[data-bind="voiceTriggerLabel"]',
  );
  const listbox = fragment.querySelector('[data-bind="voiceListbox"]');

  const groups = [
    { label: "Free", list: voices.filter((v) => v.tier !== "pro") },
    { label: "Pro", list: voices.filter((v) => v.tier === "pro") },
  ];

  const usageByVoiceId = {};
  await Promise.all(
    voices.map(async (v) => {
      const usage = await window.sonar.tts.getUsage(v.id);
      if (usage.limited) usageByVoiceId[v.id] = usage;
    }),
  );

  const optionEls = [];

  function buildOptions() {
    listbox.replaceChildren();
    optionEls.length = 0;

    for (const group of groups) {
      if (group.list.length === 0) continue;

      const headerFrag = clone("tpl-voice-group-header");
      bind(headerFrag, "groupLabel", group.label);
      listbox.appendChild(headerFrag);

      for (const voice of group.list) {
        const locked = voice.tier === "pro" && !isPro;
        const usage = usageByVoiceId[voice.id];
        const optFrag = clone("tpl-voice-option");
        const optEl = optFrag.querySelector(".player-panel__voice-option");
        optEl.dataset.value = voice.id;
        optEl.textContent = formatVoiceLabel(voice, locked, usage);
        optEl.setAttribute("aria-selected", String(voice.id === doc.voiceId));
        optEl.setAttribute("aria-disabled", String(locked));
        if (locked) optEl.classList.add("player-panel__voice-option--locked");
        if (usage && usage.remaining === 0) {
          optEl.classList.add("player-panel__voice-option--exhausted");
        }
        if (voice.id === doc.voiceId) {
          optEl.classList.add("player-panel__voice-option--selected");
        }
        listbox.appendChild(optFrag);
        optionEls.push(optEl);
      }
    }
  }

  function setTriggerLabel() {
    const current = voices.find((v) => v.id === doc.voiceId);
    if (current) {
      const locked = current.tier === "pro" && !isPro;
      const usage = usageByVoiceId[current.id];
      triggerLabel.textContent = formatVoiceLabel(current, locked, usage);
    }
  }

  function openDropdown() {
    listbox.hidden = false;
    trigger.setAttribute("aria-expanded", "true");
    dropdown.classList.add("player-panel__voice-dropdown--open");
    const activeEl =
      optionEls.find((el) => el.dataset.value === doc.voiceId) || optionEls[0];
    focusOption(activeEl);
    document.addEventListener("click", handleOutsideClick);
  }

  function closeDropdown() {
    listbox.hidden = true;
    trigger.setAttribute("aria-expanded", "false");
    dropdown.classList.remove("player-panel__voice-dropdown--open");
    document.removeEventListener("click", handleOutsideClick);
  }

  function isOpen() {
    return !listbox.hidden;
  }

  function focusOption(el) {
    if (!el) return;
    optionEls.forEach((o) =>
      o.classList.remove("player-panel__voice-option--focused"),
    );
    el.classList.add("player-panel__voice-option--focused");
    el.scrollIntoView({ block: "nearest" });
  }

  function getFocusedOption() {
    return (
      optionEls.find((el) =>
        el.classList.contains("player-panel__voice-option--focused"),
      ) || null
    );
  }

  function selectVoice(voiceId) {
    const chosen = voices.find((v) => v.id === voiceId);
    if (!chosen) return;

    if (chosen.tier === "pro" && !isPro) {
      closeDropdown();
      goToUpgradePage();
      return;
    }

    doc.voiceId = chosen.id;
    doc.narratorName = chosen.name;
    closeDropdown();
    render();
  }

  function handleOutsideClick(e) {
    if (!dropdown.contains(e.target)) closeDropdown();
  }

  trigger.addEventListener("click", () => {
    if (isOpen()) {
      closeDropdown();
    } else {
      openDropdown();
    }
  });

  listbox.addEventListener("click", (e) => {
    const optEl = e.target.closest(".player-panel__voice-option");
    if (!optEl || optEl.getAttribute("aria-disabled") === "true") return;
    selectVoice(optEl.dataset.value);
  });

  let typeBuffer = "";
  let typeTimer = null;

  trigger.addEventListener("keydown", (e) => {
    if (["ArrowDown", "ArrowUp", "Enter", " "].includes(e.key)) {
      e.preventDefault();
      openDropdown();
    }
  });

  listbox.addEventListener("keydown", (e) => {
    const focused = getFocusedOption();
    const currentIndex = focused ? optionEls.indexOf(focused) : -1;

    if (e.key === "Escape") {
      e.preventDefault();
      closeDropdown();
      trigger.focus();
      return;
    }

    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (focused && focused.getAttribute("aria-disabled") !== "true") {
        selectVoice(focused.dataset.value);
        trigger.focus();
      }
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      const next = optionEls[Math.min(currentIndex + 1, optionEls.length - 1)];
      focusOption(next);
      return;
    }

    if (e.key === "ArrowUp") {
      e.preventDefault();
      const prev = optionEls[Math.max(currentIndex - 1, 0)];
      focusOption(prev);
      return;
    }

    if (e.key === "Home") {
      e.preventDefault();
      focusOption(optionEls[0]);
      return;
    }

    if (e.key === "End") {
      e.preventDefault();
      focusOption(optionEls[optionEls.length - 1]);
      return;
    }

    if (e.key.length === 1 && /\S/.test(e.key)) {
      clearTimeout(typeTimer);
      typeBuffer += e.key.toLowerCase();
      typeTimer = setTimeout(() => {
        typeBuffer = "";
      }, 600);

      const startAt = currentIndex + 1;
      const ordered = [
        ...optionEls.slice(startAt),
        ...optionEls.slice(0, startAt),
      ];
      const match = ordered.find(
        (el) =>
          el.getAttribute("aria-disabled") !== "true" &&
          el.textContent.toLowerCase().startsWith(typeBuffer),
      );
      if (match) focusOption(match);
    }
  });

  buildOptions();
  setTriggerLabel();
}

async function renderPlayerPanelReady(doc) {
  const fragment = clone("tpl-player-panel-ready");

  bind(fragment, "narratorName", doc.narratorName);
  bind(fragment, "timeElapsed", doc.timeElapsed);
  bind(fragment, "timeTotal", doc.timeTotal);
  bind(fragment, "progress", doc.progress);
  bind(fragment, "speedLabel", doc.speed);

  on(fragment, "play-pause", playPause);
  on(fragment, "rewind", rewind);
  on(fragment, "skip-forward", skipForward);
  on(fragment, "regenerate", () => {
    stopPlayback();
    doc.audioReady = false;
    doc.audioFile = null;
    render();
  });
  on(fragment, "cycle-speed", () => cycleSpeed(doc));
  const progressInput = fragment.querySelector('[data-bind="progress"]');

  progressInput.addEventListener("pointerdown", () => {
    playback.scrubbing = true;
  });

  progressInput.addEventListener("input", () => {
    if (!playback.audio || !playback.audio.duration) return;
    const pct = Number(progressInput.value);
    playback.audio.currentTime = (pct / 100) * playback.audio.duration;
    updateRangeFill(progressInput);

    const doc = state.currentDocument;
    if (doc) {
      doc.timeElapsed = formatTime(playback.audio.currentTime);
      doc.progress = pct;
      updateReadAlongHighlight(doc);
    }
  });

  progressInput.addEventListener("pointerup", () => {
    playback.scrubbing = false;
  });

  const volumeSlider = fragment.querySelector('[data-bind="volume"]');
  volumeSlider.value = (playback.audio ? playback.audio.volume : 1) * 100;
  updateRangeFill(volumeSlider);
  volumeSlider.addEventListener("input", () => {
    const vol = Number(volumeSlider.value) / 100;
    if (playback.audio) playback.audio.volume = vol;
    updateRangeFill(volumeSlider);
  });

  // --- Export ---
  on(fragment, "choose-export-folder", async () => {
    const result = await window.sonar.export.chooseFolder();
    if (result.ok) {
      renderPlayerPanel(); // re-render to reflect new path
    }
  });

  on(fragment, "save-audio", () => saveCurrentDocumentAudio(doc));

  slots.playerPanel.replaceChildren(fragment);
  updateRangeFill(progressInput);

  await updateExportUI(doc);

  const playIcon = slots.playerPanel.querySelector(
    ".player-panel__transport-button--primary .player-panel__transport-icon",
  );
  if (playIcon) {
    const isPlayingThis =
      playback.isPlaying && playback.docId === doc.audioFile;
    playIcon.innerHTML = isPlayingThis ? PAUSE_ICON : PLAY_ICON;
    playIcon.dataset.iconState = isPlayingThis ? "pause" : "play";
  }
}

async function generateAudioForCurrentDocument() {
  const doc = state.currentDocument;
  if (!doc) return;

  doc.generating = true;
  renderPlayerPanel();

  const fullText = doc.paragraphs.join(" ");
  const result = await window.sonar.tts.speak(fullText, doc.voiceId);

  doc.generating = false;

  if (!result.success) {
    if (result.reason === "VOICE_REQUIRES_PRO") {
      goToUpgradePage();
      return;
    }
    if (result.reason === "FREE_GENERATION_LIMIT_REACHED") {
      await renderPlayerPanel();
      const errorEl = slots.playerPanel.querySelector(
        '[data-bind="generationError"]',
      );
      if (errorEl) {
        errorEl.textContent = `Daily limit reached for this voice (${result.limit}/${result.limit} used). Resets tomorrow, or choose another voice.`;
        errorEl.hidden = false;
      }
      return;
    }

    if (result.reason === "TEXT_TOO_LONG") {
      await renderPlayerPanel();
      const errorEl = slots.playerPanel.querySelector(
        '[data-bind="generationError"]',
      );
      if (errorEl) {
        errorEl.textContent = `This document is too long for the free plan (${result.actual.toLocaleString()} / ${result.limit.toLocaleString()} characters). Upgrade to Pro for longer documents, or trim the text.`;
        errorEl.hidden = false;
      }
      return;
    }
    console.error("Audio generation failed:", result.reason);
    renderPlayerPanel();
    return;
  }

  doc.audioReady = true;
  doc.audioFile = result.file;
  render();
}

// Truncates a folder path for display the same way filenames are
// middle-truncated elsewhere (ByteLock precedent) — shows start and
// end, elides the middle, so a deeply nested path doesn't blow out
// the panel width.
function truncatePath(fullPath, maxLength = 34) {
  if (fullPath.length <= maxLength) return fullPath;
  const keep = Math.floor((maxLength - 3) / 2);
  return fullPath.slice(0, keep) + "..." + fullPath.slice(-keep);
}

async function updateExportUI(doc) {
  const [exportSettings, status] = await Promise.all([
    window.sonar.export.getSettings(),
    window.sonar.license.getStatus(),
  ]);

  const isPro = status.activated && status.plan === "pro";

  const pathEl = slots.playerPanel.querySelector('[data-bind="exportPath"]');
  if (pathEl) {
    pathEl.textContent = truncatePath(exportSettings.exportPath);
    pathEl.title = exportSettings.exportPath;
  }

  const saveButton = slots.playerPanel.querySelector(
    '[data-action="save-audio"]',
  );
  const saveLabel = slots.playerPanel.querySelector(
    '[data-bind="exportSaveLabel"]',
  );
  if (!saveButton || !saveLabel) return;

  if (isPro) {
    saveLabel.textContent = "Save audio";
    saveButton.disabled = false;
    saveButton.title = "";
    return;
  }

  const remaining = exportSettings.limit - exportSettings.used;
  if (remaining <= 0) {
    saveLabel.textContent = `Save audio (0/${exportSettings.limit} today)`;
    saveButton.disabled = true;
    saveButton.title =
      "Daily export limit reached. Resets tomorrow, or upgrade to Pro for unlimited exports.";
  } else {
    saveLabel.textContent = `Save audio (${exportSettings.used}/${exportSettings.limit} today)`;
    saveButton.disabled = false;
    saveButton.title = "";
  }
}

// Builds "PDF name + voice + date" filename, e.g.
// "Meeting_Notes_Amy_2026-08-30.mp3" — strips the source .pdf extension,
// sanitizes the voice name (spaces/parens aren't great in filenames),
// and appends today's date for uniqueness across repeated exports.
function buildExportFileName(doc) {
  const baseName = doc.fileName.replace(/\.pdf$/i, "");
  const safeVoice = (doc.narratorName || "voice").replace(/[^\w-]+/g, "_");
  const dateStr = new Date().toISOString().slice(0, 10);
  return `${baseName}_${safeVoice}_${dateStr}.mp3`;
}

async function saveCurrentDocumentAudio(doc) {
  if (!doc.audioFile) return;

  const status = await window.sonar.license.getStatus();
  const isPro = status.activated && status.plan === "pro";

  const fileName = buildExportFileName(doc);

  const result = await window.sonar.export.saveAudio({
    sourceFilePath: doc.audioFile,
    fileName,
    isPro,
  });

  if (!result.ok) {
    if (result.reason === "EXPORT_LIMIT_REACHED") {
      await updateExportUI(doc);
      return;
    }
    showToast("Export failed. Check the console for details.", {
      variant: "error",
    });
    console.error("Export failed:", result.reason, result.message);
    return;
  }

  showToast(`Saved "${fileName}"`, { variant: "success" });
  await updateExportUI(doc);
}

// Seeks the currently loaded audio by a relative number of seconds
// (negative for rewind), clamped to the track's actual bounds. Shared
// by the rewind/forward buttons and can be reused for keyboard shortcuts
// later without duplicating the clamping logic.
function seekBy(seconds) {
  const audio = playback.audio;
  if (!audio || !audio.duration) return;

  const next = Math.min(
    Math.max(audio.currentTime + seconds, 0),
    audio.duration,
  );
  audio.currentTime = next;

  const doc = state.currentDocument;
  if (doc) {
    doc.timeElapsed = formatTime(audio.currentTime);
    doc.progress = Math.round((audio.currentTime / audio.duration) * 100);
    updatePlaybackUI(doc);
  }
}

// Loads doc.audioFile into the shared Audio element if it isn't already
// the active track, then toggles play/pause. Safe to call repeatedly —
// re-selects the same file without restarting playback.

function playPause() {
  console.log("playPause() called", {
    docId: state.currentDocument?.audioFile,
    playbackDocId: playback.docId,
    audioExists: !!playback.audio,
    paused: playback.audio?.paused,
  });
  const doc = state.currentDocument;
  if (!doc || !doc.audioReady || !doc.audioFile) return;

  const docId = doc.audioFile;

  if (playback.docId !== docId) {
    loadAudioForDoc(doc, docId);
    return;
  }

  if (playback.audio.paused) {
    playback.audio.play();
    playback.isPlaying = true;
    startProgressTimer();
    updatePlaybackUI(doc);
  } else {
    playback.audio.pause();
    playback.isPlaying = false;
    stopProgressTimer();
    updatePlaybackUI(doc);
  }
}

function loadAudioForDoc(doc, docId) {
  stopProgressTimer();

  if (playback.audio) {
    playback.audio.pause();
    playback.audio.removeEventListener("ended", handleAudioEnded);
  }

  const audio = new Audio("file://" + doc.audioFile);
  audio.playbackRate = SPEED_VALUES[doc.speed] || 1;
  playback.audio = audio;
  playback.docId = docId;

  audio.addEventListener("loadedmetadata", () => {
    doc.timeTotal = formatTime(audio.duration);
    updatePlaybackUI(doc);
  });

  audio.addEventListener("ended", handleAudioEnded);

  audio.play();
  playback.isPlaying = true;
  startProgressTimer();
  updatePlaybackUI(doc);
}

function handleAudioEnded() {
  playback.isPlaying = false;
  stopProgressTimer();
  const doc = state.currentDocument;
  if (doc) {
    doc.progress = 0;
    doc.timeElapsed = "0:00";
    doc._lastHighlightKey = null;
    if (playback.audio) playback.audio.currentTime = 0;
    updatePlaybackUI(doc);
    slots.main
      .querySelectorAll(".reading-pane__sentence--active")
      .forEach((s) => s.classList.remove("reading-pane__sentence--active"));
  }
}

// Fully stops and tears down the current audio element — called whenever
// the user switches to a different document, so audio from the previous
// one never keeps playing invisibly in the background (option A: switching
// documents always stops playback, no cross-document background audio).
function stopPlayback() {
  stopProgressTimer();
  if (playback.audio) {
    playback.audio.pause();
    playback.audio.removeEventListener("ended", handleAudioEnded);
    playback.audio = null;
  }
  playback.docId = null;
  playback.isPlaying = false;
  playback.scrubbing = false;
}

function startProgressTimer() {
  stopProgressTimer();
  playback.progressTimer = setInterval(() => {
    const audio = playback.audio;
    if (!audio || !audio.duration) return;

    const doc = state.currentDocument;
    if (!doc || doc.audioFile !== playback.docId) {
      return;
    }
    doc.timeElapsed = formatTime(audio.currentTime);
    doc.progress = Math.round((audio.currentTime / audio.duration) * 100);
    playback.isPlaying = !audio.paused;
    updatePlaybackUI(doc);
    updateReadAlongHighlight(doc);
  }, 250);
}

function stopProgressTimer() {
  if (playback.progressTimer) {
    clearInterval(playback.progressTimer);
    playback.progressTimer = null;
  }
}

// Updates the currently-mounted player-panel and mini-player DOM directly
// (time/progress/play-icon) without a full render() — re-cloning the
// whole panel every 250ms would wipe scrubber drag state and feels
// janky. Full render() is still used for state transitions (e.g.
// audioReady flipping), just not for routine playback ticks.
function updatePlaybackUI(doc) {
  for (const root of [slots.playerPanel, slots.miniPlayer]) {
    const elapsedEl = root.querySelector('[data-bind="timeElapsed"]');
    const totalEl = root.querySelector('[data-bind="timeTotal"]');
    const progressEl = root.querySelector('[data-bind="progress"]');
    if (elapsedEl) elapsedEl.textContent = doc.timeElapsed;
    if (totalEl) totalEl.textContent = doc.timeTotal;
    if (progressEl && !playback.scrubbing) {
      progressEl.value = doc.progress;
      updateRangeFill(progressEl);
    }

    const playIcon = root.querySelector(
      ".player-panel__transport-button--primary .player-panel__transport-icon, .mini-player__play-icon",
    );
    if (playIcon) {
      const wantIcon = playback.isPlaying ? "pause" : "play";
      if (playIcon.dataset.iconState !== wantIcon) {
        playIcon.innerHTML = playback.isPlaying ? PAUSE_ICON : PLAY_ICON;
        playIcon.dataset.iconState = wantIcon;
      }
    }
  }

  const metaEl = slots.miniPlayer.querySelector('[data-bind="fileMeta"]');
  if (metaEl) {
    metaEl.textContent = `${doc.sectionLabel} · ${doc.timeElapsed} / ${doc.timeTotal}`;
  }
}
const SPEED_OPTIONS = ["0.75x", "1x", "1.25x", "1.5x", "2x"];

const SPEED_VALUES = {
  "0.75x": 0.75,
  "1x": 1,
  "1.25x": 1.25,
  "1.5x": 1.5,
  "2x": 2,
};

function cycleSpeed(doc) {
  const currentIndex = SPEED_OPTIONS.indexOf(doc.speed);
  const nextIndex = (currentIndex + 1) % SPEED_OPTIONS.length;
  doc.speed = SPEED_OPTIONS[nextIndex];
  if (playback.audio && playback.docId === doc.audioFile) {
    playback.audio.playbackRate = SPEED_VALUES[doc.speed];
  }
  renderPlayerPanel();
}

function renderMiniPlayer() {
  if (!state.currentDocument) {
    slots.miniPlayer.replaceChildren();
    return;
  }

  const doc = state.currentDocument;
  const fragment = clone("tpl-mini-player");

  bind(fragment, "fileName", doc.fileName);
  bind(
    fragment,
    "fileMeta",
    `${doc.sectionLabel} · ${doc.timeElapsed} / ${doc.timeTotal}`,
  );
  bind(fragment, "timeElapsed", doc.timeElapsed);
  bind(fragment, "timeTotal", doc.timeTotal);
  bind(fragment, "progress", doc.progress);
  bind(fragment, "narratorName", doc.narratorName);
  bind(fragment, "speedLabel", doc.speed);

  on(fragment, "play-pause", playPause);

  const progressInput = fragment.querySelector('[data-bind="progress"]');
  updateRangeFill(progressInput);

  progressInput.addEventListener("pointerdown", () => {
    playback.scrubbing = true;
  });
  progressInput.addEventListener("input", () => {
    if (!playback.audio || !playback.audio.duration) return;
    const pct = Number(progressInput.value);
    playback.audio.currentTime = (pct / 100) * playback.audio.duration;
    updateRangeFill(progressInput);
    doc.timeElapsed = formatTime(playback.audio.currentTime);
    doc.progress = pct;
    updateReadAlongHighlight(doc);
  });
  progressInput.addEventListener("pointerup", () => {
    playback.scrubbing = false;
  });

  slots.miniPlayer.replaceChildren(fragment);
  const miniPlayIcon = slots.miniPlayer.querySelector(
    ".mini-player__play-icon",
  );
  if (miniPlayIcon) {
    const isPlayingThis =
      playback.isPlaying && playback.docId === doc.audioFile;
    miniPlayIcon.innerHTML = isPlayingThis ? PAUSE_ICON : PLAY_ICON;
    miniPlayIcon.dataset.iconState = isPlayingThis ? "pause" : "play";
  }
}

// --- Actions (stubs — wire to real IPC/engine calls as they land) ------

function toggleTheme() {
  const html = document.documentElement;
  const next = html.dataset.theme === "dark" ? "light" : "dark";
  html.dataset.theme = next;
  updateThemeToggleIcons();
}

async function browseFiles() {
  state.dropzoneStatus = "loading";
  renderMain();

  const result = await window.sonar.pdf.browse();
  handlePdfLoadResult(result);
}

async function handleFileDrop(event) {
  event.preventDefault();

  const file = event.dataTransfer.files?.[0];
  if (!file) return;

  state.dropzoneStatus = "loading";
  renderMain();

  // webUtils.getPathForFile only works in preload — that's why this
  // goes through window.sonar.pdf rather than reading file.path
  // directly (removed in newer Electron under contextIsolation).
  const filePath = window.sonar.pdf.getPathForFile(file);
  const result = await window.sonar.pdf.load(filePath);
  handlePdfLoadResult(result);
}

// Shared by both browse and drop paths — turns a pdf:load/pdf:browse
// IPC result into a documents entry (or a dropzoneStatus error) and
// re-renders.
async function handlePdfLoadResult(result) {
  if (!result.ok) {
    // User just closed the dialog — not an error, quietly reset.
    if (result.error === "canceled") {
      state.dropzoneStatus = null;
      renderMain();
      return;
    }
    state.dropzoneStatus = {
      error: result.message || "Couldn't load that file.",
    };
    renderMain();
    return;
  }

  // Free-tier length gate — checked here (once, at upload) as well as
  // defensively in tts:speak, so a free user finds out their doc is
  // too long immediately instead of only after clicking Generate.
  const fullText = result.paragraphs.join(" ");
  const status = await window.sonar.license.getStatus();
  const isPro = status.activated && status.plan === "pro";
  const lengthCheck = await window.sonar.tts.checkTextLength(fullText, isPro);

  if (!lengthCheck.allowed) {
    state.dropzoneStatus = {
      error: `This document is too long for the free plan (${lengthCheck.actual.toLocaleString()} / ${lengthCheck.limit.toLocaleString()} characters). Upgrade to Pro, or try a shorter document.`,
    };
    renderMain();
    return;
  }

  const docId = result.filePath; // path is unique per file, good enough as a key for now

  const doc = {
    fileName: result.fileName,
    title: result.title,
    paragraphs: result.paragraphs.length
      ? result.paragraphs
      : ["This PDF doesn't contain any extractable text."],
    narratorName: "Amy",
    voiceId: "en_US-amy-medium",
    audioReady: false,
    audioFile: null,
    generating: false,
    speed: "1x",
    timeElapsed: "0:00",
    timeTotal: "0:00",
    progress: 0,
    sectionLabel: result.pageCount
      ? `Section 1 of ${result.pageCount}`
      : "Section 1 of 1",
  };

  state.documents[docId] = doc;
  state.dropzoneStatus = null;
  stopPlayback();
  state.currentDocument = doc;

  // New file becomes the most recent recent-file too, and jumps to
  // the top even if it was already listed (real "recently used"
  // behavior). file-nav mounts once and is never re-rendered (see
  // renderFileNav's doc comment), so we surgically move the DOM node
  // instead of re-cloning the whole sidebar — that would wipe pin
  // state and scroll position for no reason.
  state.recentFiles = state.recentFiles.filter((f) => f.id !== docId);
  state.recentFiles.unshift({ id: docId, name: doc.fileName });
  moveRecentFileNavItemToTop({ id: docId, name: doc.fileName });

  render();
}

// Splits a paragraph into sentences for read-along highlighting. Naive
// regex split on sentence-ending punctuation followed by whitespace —
// won't handle abbreviations perfectly (e.g. "Dr. Smith") but is good
// enough for highlight granularity, where an occasional over-split
// sentence just means two chunks highlight in sequence instead of one.
function splitIntoSentences(paragraph) {
  const boundaryRegex = /[.!?]+["')\]]?\s+/g;
  const sentences = [];
  let start = 0;
  let match;

  while ((match = boundaryRegex.exec(paragraph)) !== null) {
    const end = match.index + match[0].length;
    sentences.push(paragraph.slice(start, end).trim());
    start = end;
  }

  const remainder = paragraph.slice(start).trim();
  if (remainder) sentences.push(remainder);

  return sentences.length ? sentences.filter(Boolean) : [paragraph];
}

// Builds a flat list of { paragraphIndex, sentenceIndex, text, charStart,
// charEnd } across all paragraphs, plus the total character count — used
// both for rendering (wrap each sentence in its own span) and for
// estimating timing later.
function buildSentenceMap(paragraphs) {
  const sentences = [];
  let charOffset = 0;

  paragraphs.forEach((paragraph, paragraphIndex) => {
    const parts = splitIntoSentences(paragraph);
    parts.forEach((text, sentenceIndex) => {
      sentences.push({
        paragraphIndex,
        sentenceIndex,
        text,
        charStart: charOffset,
        charEnd: charOffset + text.length,
      });
      charOffset += text.length;
    });
  });

  return { sentences, totalChars: charOffset };
}
// Ensures exactly one entry for `file` sits at the top of the live
// Recents list in the already-mounted file-nav, without touching
// anything else in that subtree (pin state, scroll position, search
// input value, etc). Removes any existing DOM node for this file
// first so re-dropping an already-listed PDF moves it rather than
// duplicating it.
function moveRecentFileNavItemToTop(file) {
  const recentsList = slots.fileNav.querySelector('[data-list="recents"]');
  if (!recentsList) return;

  const existing = Array.from(
    recentsList.querySelectorAll(".file-nav__item-button"),
  ).find((btn) => btn.dataset.fileId === file.id);
  if (existing) {
    existing.closest(".file-nav__item")?.remove();
  }

  const fragment = renderFileNavItem(file);
  recentsList.insertBefore(fragment, recentsList.firstChild);
}
// Wired: clicking a sidebar file now genuinely swaps the center pane +
// mounts the player-panel/mini-player, using the placeholder `documents`
// map above. Swap the lookup for real extracted PDF content once the
// upload/extraction pipeline exists — nothing else here should need to
// change, since render() already reacts to state.currentDocument.
function openFile(fileId) {
  const doc = state.documents[fileId];
  if (!doc) {
    console.warn(`No document found for file id "${fileId}"`);
    return;
  }
  stopPlayback();
  state.currentDocument = doc;
  render();
}

// "New file" returns to the welcome/upload screen — same state as a
// fresh launch with no document loaded. Sidebar itself is untouched
// since it never re-renders.
function goToNewFile() {
  stopPlayback();

  state.currentDocument = null;
  render();
}

function pinDocument(fileId) {
  const doc = state.documents[fileId];
  if (!doc) return;

  if (!state.pinnedFiles.some((f) => f.id === fileId)) {
    state.pinnedFiles.push({ id: fileId, name: doc.fileName });
  }
  state.recentFiles = state.recentFiles.filter((f) => f.id !== fileId);
  renderFileNav();
}

function unpinDocument(fileId) {
  const doc = state.documents[fileId];
  state.pinnedFiles = state.pinnedFiles.filter((f) => f.id !== fileId);
  if (doc) {
    state.recentFiles = state.recentFiles.filter((f) => f.id !== fileId);
    state.recentFiles.unshift({ id: fileId, name: doc.fileName });
  }
  renderFileNav();
}

function showDeleteConfirmModal(fileName, onConfirm) {
  const fragment = clone("tpl-delete-confirm-modal");
  bind(
    fragment,
    "modalBody",
    `"${fileName}" will be permanently deleted. This can't be undone.`,
  );

  function close() {
    modalSlot.replaceChildren();
    document.removeEventListener("keydown", onKeydown);
  }

  function onKeydown(e) {
    if (e.key === "Escape") close();
  }

  on(fragment, "modal-cancel", close);
  on(fragment, "modal-confirm", () => {
    close();
    onConfirm();
  });

  const backdrop = fragment.querySelector('[data-action="modal-backdrop"]');
  backdrop.addEventListener("click", (e) => {
    if (e.target === backdrop) close();
  });

  document.addEventListener("keydown", onKeydown);

  modalSlot.replaceChildren(fragment);
}

async function openSettingsModal() {
  const fragment = clone("tpl-settings-modal");
  const data = state.onboardingData;

  // Fetch license status once, up front — reused for the activation
  // status label and the Go Pro button visibility below.
  const status = await window.sonar.license.getStatus();
  const isPro = status.activated && status.plan === "pro";

  bind(fragment, "settingsAccountName", state.accountName);

  const settingsAvatarEl = fragment.querySelector(".settings-modal__avatar");
  if (settingsAvatarEl) {
    settingsAvatarEl.textContent = getInitials(state.accountName);
    settingsAvatarEl.dataset.accentColor = state.onboardingData.accentColor;
  }

  // Email span is repurposed as an activation status indicator, not
  // an actual email address — Pro users see a green "ACTIVATED"
  // label, free users see a red "NOT ACTIVATED" link to upgrade.
  const emailEl = fragment.querySelector('[data-bind="settingsAccountEmail"]');
  if (emailEl) {
    if (isPro) {
      emailEl.textContent = "ACTIVATED — Premium";
      emailEl.className =
        "settings-modal__account-status settings-modal__account-status--active";
    } else {
      const link = document.createElement("button");
      link.type = "button";
      link.className =
        "settings-modal__account-status settings-modal__account-status--inactive";
      link.textContent = "NOT ACTIVATED";
      link.addEventListener("click", () => {
        close();
        goToUpgradePage();
      });
      emailEl.replaceWith(link);
    }
  }

  const themeToggle = fragment.querySelector(
    '[data-action="settings-toggle-theme"]',
  );
  themeToggle.addEventListener("click", toggleTheme);
  themeToggle.classList.toggle(
    "settings-modal__theme-toggle--dark",
    document.documentElement.dataset.theme === "dark",
  );

  const pillGroup = fragment.querySelector(
    '[data-group="settingsVoiceGender"]',
  );
  pillGroup.querySelectorAll(".onboarding-step__pill").forEach((pill) => {
    pill.setAttribute(
      "aria-pressed",
      String(pill.dataset.value === data.voiceGender),
    );
    pill.addEventListener("click", () => {
      data.voiceGender = pill.dataset.value;
      pillGroup.querySelectorAll(".onboarding-step__pill").forEach((p) => {
        p.setAttribute(
          "aria-pressed",
          String(p.dataset.value === data.voiceGender),
        );
      });
    });
  });

  const accentGroup = fragment.querySelector('[data-group="settingsAccent"]');
  for (const accent of ACCENT_OPTIONS) {
    const cardFrag = clone("tpl-onboarding-accent-card");
    const card = cardFrag.querySelector(".onboarding-step__accent-card");
    card.dataset.accentId = accent.id;
    card.setAttribute("aria-pressed", String(accent.id === data.accent));
    bind(cardFrag, "accentFlag", accent.flag);
    bind(cardFrag, "accentName", accent.name);
    card.addEventListener("click", () => {
      data.accent = accent.id;
      accentGroup
        .querySelectorAll(".onboarding-step__accent-card")
        .forEach((c) => {
          c.setAttribute(
            "aria-pressed",
            String(c.dataset.accentId === accent.id),
          );
        });
    });
    accentGroup.appendChild(cardFrag);
  }

  const settingsSwatchGroup = fragment.querySelector(
    '[data-group="settingsAccentColor"]',
  );
  for (const color of ACCENT_COLOR_OPTIONS) {
    const swatch = clone("tpl-onboarding-swatch");
    const button = swatch.querySelector(".onboarding-step__swatch");
    button.dataset.colorValue = color;
    button.style.backgroundColor = color;
    button.style.color = color;
    button.setAttribute("aria-label", color);
    button.setAttribute("aria-pressed", String(color === data.accentColor));
    button.addEventListener("click", () => {
      data.accentColor = color;
      applyAccentColor(color);
      settingsSwatchGroup
        .querySelectorAll(".onboarding-step__swatch")
        .forEach((el) => {
          el.setAttribute(
            "aria-pressed",
            String(el.dataset.colorValue === color),
          );
        });
    });
    settingsSwatchGroup.appendChild(swatch);
  }

  // Edit (pencil) button — swaps the name span for an inline input,
  // commits on blur/Enter, discards on Escape.
  const editButton = fragment.querySelector(".settings-modal__edit");
  const nameEl = fragment.querySelector('[data-bind="settingsAccountName"]');

  if (editButton) {
    editButton.addEventListener("click", () => {
      // Re-query live each click — after a prior edit, the original
      // nameEl closed over here would be a stale, detached node.
      const liveNameEl = modalSlot.querySelector(
        '[data-bind="settingsAccountName"]',
      );
      if (!liveNameEl || liveNameEl.tagName === "INPUT") return; // already editing

      const input = document.createElement("input");
      input.type = "text";
      input.className = "settings-modal__account-name-input";
      input.value = state.accountName;

      liveNameEl.replaceWith(input);
      input.focus();
      input.select();

      let settled = false; // guards against double-commit (Enter's blur() + the blur event itself)

      function finish(nextValue) {
        if (settled) return;
        settled = true;

        const trimmed = nextValue.trim();
        if (trimmed) {
          state.accountName = trimmed;
          state.firstName = trimmed.split(/\s+/)[0];
        }
        renderFileNav();

        const freshNameEl = document.createElement("span");
        freshNameEl.className = "settings-modal__account-name";
        freshNameEl.setAttribute("data-bind", "settingsAccountName");
        freshNameEl.textContent = state.accountName;
        input.replaceWith(freshNameEl);

        const avatarEl = modalSlot.querySelector(".settings-modal__avatar");
        if (avatarEl) avatarEl.textContent = getInitials(state.accountName);
      }

      input.addEventListener("blur", () => finish(input.value));
      input.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          finish(input.value);
        }
        if (e.key === "Escape") {
          e.preventDefault();
          finish(state.accountName); // discard: commit the unchanged name
        }
      });
    });
  }

  const logoutButton = fragment.querySelector(
    '[data-action="settings-logout"]',
  );
  const logoutLabel = logoutButton?.querySelector("span");
  if (logoutButton && logoutLabel) {
    if (isPro) {
      logoutLabel.textContent = "Deactivate Sonar";
      logoutButton.classList.add("settings-modal__logout--deactivate");
      logoutButton.classList.remove("settings-modal__logout--activate");
    } else {
      logoutLabel.textContent = "Activate Sonar";
      logoutButton.classList.add("settings-modal__logout--activate");
      logoutButton.classList.remove("settings-modal__logout--deactivate");
    }
  }

  on(fragment, "settings-logout", () => {
    if (isPro) {
      // TODO: real deactivation — clear license state via IPC (e.g.
      // window.sonar.license.deactivate()) once that handler exists.
      console.log("TODO: implement real license deactivation");
    } else {
      close();
      goToUpgradePage();
    }
  });

  function close() {
    modalSlot.replaceChildren();
    document.removeEventListener("keydown", onKeydown);
  }

  function onKeydown(e) {
    if (e.key === "Escape") close();
  }

  on(fragment, "modal-cancel", close);
  on(fragment, "settings-go-pro", () => {
    close();
    goToUpgradePage();
  });

  const backdrop = fragment.querySelector('[data-action="modal-backdrop"]');
  backdrop.addEventListener("click", (e) => {
    if (e.target === backdrop) close();
  });

  document.addEventListener("keydown", onKeydown);

  modalSlot.replaceChildren(fragment);

  // Hide "Go Pro" for users who already have Pro — status was already
  // fetched above, no second license check needed here.
  const goProButton = modalSlot.querySelector(
    '[data-action="settings-go-pro"]',
  );
  if (goProButton) {
    goProButton.style.display = isPro ? "none" : "";
  }
}

function deleteDocument(fileId, fileName) {
  showDeleteConfirmModal(fileName, () => {
    state.pinnedFiles = state.pinnedFiles.filter((f) => f.id !== fileId);
    state.recentFiles = state.recentFiles.filter((f) => f.id !== fileId);

    const wasCurrent = state.currentDocument === state.documents[fileId];
    delete state.documents[fileId];

    if (wasCurrent) {
      stopPlayback();
      state.currentDocument = null;
    }

    renderFileNav();
    render();
  });
}

// Lightweight toast, mounted into its own fixed-position container so it
// doesn't interfere with modal-slot or any render() cycle. Auto-dismisses;
// stacking multiple toasts just replaces the current one for now — fine
// for single-action confirmations like export, revisit if we ever need
// simultaneous independent toasts.
let toastContainer = document.getElementById("toast-container");
if (!toastContainer) {
  toastContainer = document.createElement("div");
  toastContainer.id = "toast-container";
  document.body.appendChild(toastContainer);
}

let toastTimer = null;

function showToast(message, { variant = "success", duration = 3000 } = {}) {
  clearTimeout(toastTimer);

  const toast = document.createElement("div");
  toast.className = `toast toast--${variant}`;
  toast.textContent = message;
  toastContainer.replaceChildren(toast);

  requestAnimationFrame(() => toast.classList.add("toast--visible"));

  toastTimer = setTimeout(() => {
    toast.classList.remove("toast--visible");
    setTimeout(() => toast.remove(), 200);
  }, duration);
}

function rewind() {
  seekBy(-10);
}

function skipForward() {
  seekBy(10);
}

function regenerate() {
  console.log("TODO: regenerate audio");
}

// --- Full re-render (call after any state mutation) --------------------

function render() {
  renderMain();
  renderPlayerPanel();
  renderMiniPlayer();
  updateActiveFileNavItem();
}

// --- Boot ----------------------------------------------------------------

applyAccentColor(state.onboardingData.accentColor);
showActiveRoot();

if (state.currentView === "app") {
  renderFileNav();
  render();
} else if (state.currentView === "onboarding") {
  renderOnboardingStep();
}

// --- Splash screen -------------------------------------------------------
// Fixed ~1s show, then fades regardless of boot state (explicit choice —
// not tied to render() completion). Chime plays alongside it — browsers
// block audio autoplay without a user gesture in some contexts, so this
// is wrapped in a catch; a silent splash is an acceptable fallback, a
// thrown error is not.
window.addEventListener("DOMContentLoaded", () => {
  const splash = document.getElementById("splash-screen");
  if (!splash) return;

  const chime = new Audio("./assets/sound/splash.wav");
  chime.volume = 0.6;
  chime.play().catch((err) => {
    console.warn("Splash chime blocked or failed to play:", err);
  });

  setTimeout(() => {
    splash.classList.add("splash-screen--hidden");
    setTimeout(() => splash.remove(), 300);
  }, 1000);
});
