// src/renderer/app.js
//
// Deliberately minimal: one state object, one render function per slot.
// No framework, no virtual DOM — just clone the right <template>, bind
// data-bind fields, wire data-action listeners. Rapid-dev friendly:
// extend `state` and the render*() functions as real features land.

const ACCENT_COLOR_OPTIONS = ["violet", "blue", "green", "rose", "amber"];

// TODO: real "has this user onboarded before" check needs a persisted
// settings file (same pattern as UsageStore/LicenseStore — an IPC call
// backed by app.getPath("userData")). Hardcoded false for now so the
// flow is always visible during development.
const HAS_ONBOARDED_BEFORE = false;

const SUN_ICON = `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M7.5458 1.38933C6.34549 1.47489 5.19102 1.88442 4.20569 2.57415C3.22037 3.26388 2.44121 4.20791 1.95145 5.3054C1.46169 6.40289 1.27972 7.6126 1.425 8.80531C1.57027 9.99802 2.03732 11.1289 2.77625 12.0772C3.51519 13.0255 4.49825 13.7556 5.62042 14.1894C6.7426 14.6232 7.96173 14.7446 9.14758 14.5404C10.3334 14.3362 11.4415 13.8142 12.3533 13.0302C13.2652 12.2462 13.9466 11.2295 14.3247 10.0889C13.1666 10.5664 11.8836 10.6514 10.6725 10.331C9.46134 10.0105 8.38888 9.30227 7.61956 8.31484C6.85023 7.32742 6.42651 6.1153 6.41335 4.86435C6.40019 3.6134 6.79833 2.39267 7.54671 1.38933M2.94606e-08 8.00504C-9.90165e-05 6.85143 0.249546 5.71143 0.731834 4.66314C1.21412 3.61484 1.91765 2.68302 2.79424 1.93151C3.67083 1.17999 4.69975 0.626543 5.81052 0.309071C6.9213 -0.00840044 8.08768 -0.0823922 9.22977 0.0921649C9.36363 0.112574 9.48848 0.172022 9.58862 0.263042C9.68876 0.354062 9.75973 0.472596 9.79262 0.603757C9.82551 0.734919 9.81885 0.872859 9.77348 1.00025C9.72811 1.12765 9.64605 1.23882 9.53761 1.3198C9.07553 1.66606 8.68713 2.10071 8.39506 2.5984C8.10299 3.0961 7.91309 3.64688 7.83643 4.21862C7.75978 4.79036 7.79791 5.37162 7.9486 5.92849C8.09929 6.48536 8.35952 7.00671 8.71412 7.46211C9.06871 7.91752 9.51058 8.29787 10.0139 8.58099C10.5173 8.8641 11.0721 9.04432 11.6459 9.11112C12.2198 9.17792 12.8012 9.12997 13.3563 8.97006C13.9114 8.81016 14.429 8.5415 14.879 8.17976C14.9842 8.09429 15.1123 8.04179 15.2473 8.02887C15.3822 8.01595 15.518 8.04319 15.6375 8.10714C15.757 8.1711 15.8549 8.26893 15.9188 8.38831C15.9827 8.50769 16.0099 8.64328 15.9968 8.77803C15.7955 10.8225 14.8146 12.7115 13.2573 14.054C11.6999 15.3966 9.68518 16.0899 7.63006 15.9906C5.57494 15.8913 3.63671 15.007 2.21646 13.5205C0.796206 12.0341 0.00264918 10.0594 2.94606e-08 8.00504Z" fill="#94A3B8"/></svg>`;

const MOON_ICON = `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M8 3.33333C8.64583 3.33333 9.25 3.45486 9.8125 3.69792C10.375 3.94097 10.8715 4.27431 11.3021 4.69792C11.7326 5.12153 12.066 5.61458 12.3021 6.17708C12.5382 6.73958 12.6597 7.34722 12.6667 8C12.6667 8.64583 12.5451 9.25 12.3021 9.8125C12.059 10.375 11.7257 10.8715 11.3021 11.3021C10.8785 11.7326 10.3854 12.066 9.82292 12.3021C9.26042 12.5382 8.65278 12.6597 8 12.6667C7.35417 12.6667 6.75 12.5451 6.1875 12.3021C5.625 12.059 5.12847 11.7257 4.69792 11.3021C4.26736 10.8785 3.93403 10.3854 3.69792 9.82292C3.46181 9.26042 3.34028 8.65278 3.33333 8C3.33333 7.35417 3.45486 6.75 3.69792 6.1875C3.94097 5.625 4.27431 5.12847 4.69792 4.69792C5.12153 4.26736 5.61458 3.93403 6.17708 3.69792C6.73958 3.46181 7.34722 3.34028 8 3.33333ZM8 11.3333C8.45833 11.3333 8.88889 11.2465 9.29167 11.0729C9.69444 10.8993 10.0451 10.6632 10.3438 10.3646C10.6424 10.066 10.8819 9.71181 11.0625 9.30208C11.2431 8.89236 11.3333 8.45833 11.3333 8C11.3333 7.54167 11.2465 7.11111 11.0729 6.70833C10.8993 6.30556 10.6597 5.95486 10.3542 5.65625C10.0486 5.35764 9.69444 5.11806 9.29167 4.9375C8.88889 4.75694 8.45833 4.66667 8 4.66667C7.54167 4.66667 7.11111 4.75347 6.70833 4.92708C6.30556 5.10069 5.95139 5.34028 5.64583 5.64583C5.34028 5.95139 5.10069 6.30556 4.92708 6.70833C4.75347 7.11111 4.66667 7.54167 4.66667 8C4.66667 8.45833 4.75347 8.88889 4.92708 9.29167C5.10069 9.69444 5.33681 10.0486 5.63542 10.3542C5.93403 10.6597 6.28819 10.8993 6.69792 11.0729C7.10764 11.2465 7.54167 11.3333 8 11.3333ZM8.66667 2H7.33333V0H8.66667V2ZM3.28125 4.22917L1.875 2.8125L2.8125 1.875L4.22917 3.28125L3.28125 4.22917ZM2 8.66667H0V7.33333H2V8.66667ZM3.28125 11.7708L4.22917 12.7188L2.8125 14.125L1.875 13.1875L3.28125 11.7708ZM7.33333 14H8.66667V16H7.33333V14ZM12.7188 11.7708L14.125 13.1875L13.1875 14.125L11.7708 12.7188L12.7188 11.7708ZM16 7.33333V8.66667H14V7.33333H16ZM12.7188 4.22917L11.7708 3.28125L13.1875 1.875L14.125 2.8125L12.7188 4.22917Z" fill="#94A3B8"/></svg>`;

// Renders the correct icon (sun when currently dark → click to go light;
// moon when currently light → click to go dark) into every mounted
// theme-toggle button. Both empty-state and reading-pane have one.
function updateThemeToggleIcons() {
  const isDark = document.documentElement.dataset.theme === "dark";
  const icon = isDark ? SUN_ICON : MOON_ICON;

  document
    .querySelectorAll(".empty-state__theme-icon, .reading-pane__theme-icon")
    .forEach((el) => {
      el.innerHTML = icon;
    });
}

const state = {
  // --- View routing ---
  // "onboarding" | "app" | "upgrade"
  currentView: HAS_ONBOARDED_BEFORE ? "app" : "onboarding",
  previousView: "app", // where "Back to app" on the upgrade page returns to

  // --- Onboarding ---
  onboardingStep: "name", // "name" | "preferences" | "license"
  onboardingData: {
    name: "",
    voiceGender: "female",
    theme: "light",
    accentColor: "violet",
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
  dropzoneStatus: null, // null | "loading" | { error: string }e) ---

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
        "3 PDF document uploads per day limit",
        "Standard speeds (0.75x to 1.5x only)",
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
        "Up to 10 PDF document uploads per day",
        "Generate and download offline audio MP3s",
        "Wider playback speeds (0.5x to 2x granular)",
        "24/7 priority support and custom voice models",
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

function formatTime(seconds) {
  if (!isFinite(seconds) || seconds < 0) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
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

  if (step === "name") {
    renderOnboardingName();
  } else if (step === "preferences") {
    renderOnboardingPreferences();
  } else if (step === "license") {
    renderOnboardingLicense();
  }
}

function renderOnboardingName() {
  const fragment = clone("tpl-onboarding-name");
  const data = state.onboardingData;

  const input = fragment.querySelector('[data-bind="nameInput"]');
  input.value = data.name;
  input.addEventListener("input", (e) => {
    data.name = e.target.value;
  });

  on(fragment, "next", () => {
    // Minimal validation — real UX would show an inline message
    // instead of blocking silently. Left as a TODO since this is
    // structure-only, no visual/error-state design yet.
    if (!data.name.trim()) return;
    state.onboardingStep = "preferences";
    renderOnboardingStep();
  });

  slots.onboardingStep.replaceChildren(fragment);
}

function renderOnboardingPreferences() {
  const fragment = clone("tpl-onboarding-preferences");
  const data = state.onboardingData;

  fragment.querySelector('[data-bind="voiceGenderFemale"]').checked =
    data.voiceGender === "female";
  fragment.querySelector('[data-bind="voiceGenderMale"]').checked =
    data.voiceGender === "male";
  fragment.querySelectorAll('input[name="voiceGender"]').forEach((el) => {
    el.addEventListener("change", (e) => {
      data.voiceGender = e.target.value;
    });
  });

  fragment.querySelector('[data-bind="themeLight"]').checked =
    data.theme === "light";
  fragment.querySelector('[data-bind="themeDark"]').checked =
    data.theme === "dark";
  fragment.querySelectorAll('input[name="theme"]').forEach((el) => {
    el.addEventListener("change", (e) => {
      data.theme = e.target.value;
      document.documentElement.dataset.theme = e.target.value;
    });
  });

  const swatchGroup = fragment.querySelector('[data-group="accentColor"]');
  for (const color of ACCENT_COLOR_OPTIONS) {
    const swatch = clone("tpl-onboarding-swatch");
    const button = swatch.querySelector(".onboarding-step__swatch");
    button.dataset.colorValue = color;
    button.textContent = color;
    button.setAttribute("aria-pressed", String(color === data.accentColor));
    button.addEventListener("click", () => {
      data.accentColor = color;
      swatchGroup.querySelectorAll(".onboarding-step__swatch").forEach((el) => {
        el.setAttribute(
          "aria-pressed",
          String(el.dataset.colorValue === color),
        );
      });
    });
    swatchGroup.appendChild(swatch);
  }

  on(fragment, "back", () => {
    state.onboardingStep = "name";
    renderOnboardingStep();
  });
  on(fragment, "next", () => {
    state.onboardingStep = "license";
    renderOnboardingStep();
  });

  slots.onboardingStep.replaceChildren(fragment);
}

function renderOnboardingLicense() {
  const fragment = clone("tpl-onboarding-license");
  const data = state.onboardingData;

  bind(fragment, "licensePathDisplay", data.licensePath || "");
  bind(fragment, "licenseStatus", data.licenseStatus);

  on(fragment, "browse-license", async () => {
    // TODO: wire to a real file picker via IPC (e.g. an
    // "dialog:openFile" handler in main process, filtered to .json).
    console.log("TODO: open native file picker for license file");
  });

  on(fragment, "back", () => {
    state.onboardingStep = "preferences";
    renderOnboardingStep();
  });

  on(fragment, "skip", () => {
    finishOnboarding({ activateLicense: false });
  });

  on(fragment, "activate-and-finish", async () => {
    // TODO: wire to window.sonar.license.activate(data.licensePath)
    // once a real file path exists from the picker above.
    finishOnboarding({ activateLicense: Boolean(data.licensePath) });
  });

  slots.onboardingStep.replaceChildren(fragment);
}

function finishOnboarding({ activateLicense }) {
  const data = state.onboardingData;

  // Carry onboarding choices into the main app state.
  state.firstName = data.name.trim() || state.firstName;
  // TODO: persist name/voiceGender/theme/accentColor/license choice to
  // a real settings file (IPC-backed) so this survives app restarts —
  // currently in-memory only, resets every launch.

  if (activateLicense) {
    console.log("TODO: call window.sonar.license.activate(licensePath)");
  }

  state.currentView = "app";
  showActiveRoot();
  renderFileNav();
  render();
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

function renderFileNav() {
  const fragment = clone("tpl-file-nav");

  bind(fragment, "accountName", state.accountName);
  bind(fragment, "accountEmail", state.accountEmail);

  on(fragment, "toggle-pin", togglePin);
  on(fragment, "new-file", goToNewFile);
  on(fragment, "upgrade-to-pro", goToUpgradePage);

  const pinnedList = fragment.querySelector('[data-list="pinned"]');
  for (const file of state.pinnedFiles) {
    pinnedList.appendChild(renderFileNavItem(file));
  }

  const recentsList = fragment.querySelector('[data-list="recents"]');
  for (const file of state.recentFiles) {
    recentsList.appendChild(renderFileNavItem(file));
  }

  slots.fileNav.replaceChildren(fragment);
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

function renderFileNavItem(file) {
  const fragment = clone("tpl-recent-file-nav-item");
  bind(fragment, "fileName", file.name);
  const button = fragment.querySelector(".file-nav__item-button");
  button.dataset.fileId = file.id;
  button.addEventListener("click", () => openFile(file.id));
  return fragment;
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
  for (const paragraph of doc.paragraphs) {
    const p = document.createElement("p");
    p.className = "reading-pane__paragraph";
    p.textContent = paragraph;
    body.appendChild(p);
  }

  slots.main.replaceChildren(fragment);
  updateThemeToggleIcons();
}

// --- Render: player-panel + mini-player (only when a document is loaded) --

function renderPlayerPanel() {
  if (!state.currentDocument) {
    slots.playerPanel.replaceChildren();
    return;
  }

  const doc = state.currentDocument;

  if (!doc.audioReady) {
    renderPlayerPanelGenerate(doc);
  } else {
    renderPlayerPanelReady(doc);
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
  const select = fragment.querySelector('[data-bind="voiceSelect"]');

  if (!doc.voiceId || !voices.some((v) => v.id === doc.voiceId)) {
    const firstFree = voices.find((v) => v.tier !== "pro");
    doc.voiceId = firstFree ? firstFree.id : voices[0]?.id;
  }

  for (const voice of voices) {
    const locked = voice.tier === "pro" && !isPro;
    const option = document.createElement("option");
    option.value = voice.id;
    option.textContent = locked
      ? `${voice.name} (Pro)`
      : `${voice.name} — ${voice.gender}, ${voice.quality}`;
    option.disabled = locked;
    if (voice.id === doc.voiceId) option.selected = true;
    select.appendChild(option);
  }

  select.addEventListener("change", () => {
    const chosen = voices.find((v) => v.id === select.value);
    if (chosen && chosen.tier === "pro" && !isPro) {
      select.value = doc.voiceId;
      goToUpgradePage();
      return;
    }
    doc.voiceId = select.value;
    doc.narratorName = chosen.name;
    render();
  });

  on(fragment, "generate-audio", () => generateAudioForCurrentDocument());

  slots.playerPanel.replaceChildren(fragment);

  // Video autoplay can silently fail when inserted after an async gap
  // (the await calls above) — force it explicitly rather than relying
  // solely on the autoplay attribute.
  const video = slots.playerPanel.querySelector(
    ".player-panel__orb-wrap video",
  );
  if (video) {
    video.load();
    video.play().catch((err) => console.error("Orb video play failed:", err));
  }
}

function renderPlayerPanelReady(doc) {
  const fragment = clone("tpl-player-panel-ready");

  bind(fragment, "narratorName", doc.narratorName);
  bind(fragment, "timeElapsed", doc.timeElapsed);
  bind(fragment, "timeTotal", doc.timeTotal);
  bind(fragment, "progress", doc.progress);
  bind(fragment, "speedLabel", doc.speed);

  on(fragment, "play-pause", playPause);
  on(fragment, "rewind", rewind);
  on(fragment, "skip-forward", skipForward);
  on(fragment, "regenerate", () => generateAudioForCurrentDocument());
  on(fragment, "cycle-speed", () => cycleSpeed(doc));
  const progressInput = fragment.querySelector('[data-bind="progress"]');

  progressInput.addEventListener("pointerdown", () => {
    playback.scrubbing = true;
  });

  progressInput.addEventListener("input", () => {
    if (!playback.audio || !playback.audio.duration) return;
    const pct = Number(progressInput.value);
    playback.audio.currentTime = (pct / 100) * playback.audio.duration;

    const doc = state.currentDocument;
    if (doc) {
      doc.timeElapsed = formatTime(playback.audio.currentTime);
      doc.progress = pct;
    }
  });

  progressInput.addEventListener("pointerup", () => {
    playback.scrubbing = false;
  });

  const volumeSlider = fragment.querySelector('[data-bind="volume"]');
  volumeSlider.value = (playback.audio ? playback.audio.volume : 1) * 100;
  volumeSlider.addEventListener("input", () => {
    const vol = Number(volumeSlider.value) / 100;
    if (playback.audio) playback.audio.volume = vol;
  });

  slots.playerPanel.replaceChildren(fragment);
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
    // UNKNOWN_VOICE or any Piper/process failure — surface inline
    // rather than silently failing. No dedicated error UI slot for
    // the player panel yet, so console for now; revisit once we
    // decide where generation errors should actually show.
    console.error("Audio generation failed:", result.reason);
    renderPlayerPanel();
    return;
  }

  doc.audioReady = true;
  doc.audioFile = result.file;
  render();
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
  const doc = state.currentDocument;
  if (!doc || !doc.audioReady || !doc.audioFile) return;

  const docId = doc.audioFile; // file path is a fine unique key here

  if (playback.docId !== docId) {
    loadAudioForDoc(doc, docId);
    return; // loadAudioForDoc starts playback once metadata is ready
  }

  if (playback.audio.paused) {
    playback.audio.play();
  } else {
    playback.audio.pause();
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
  startProgressTimer(doc);
  updatePlaybackUI(doc);
}

function handleAudioEnded() {
  playback.isPlaying = false;
  stopProgressTimer();
  const doc = state.currentDocument;
  if (doc) {
    doc.progress = 0;
    doc.timeElapsed = "0:00";
    if (playback.audio) playback.audio.currentTime = 0;
    updatePlaybackUI(doc);
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

function startProgressTimer(doc) {
  stopProgressTimer();
  playback.progressTimer = setInterval(() => {
    const audio = playback.audio;
    if (!audio || !audio.duration) return;

    doc.timeElapsed = formatTime(audio.currentTime);
    doc.progress = Math.round((audio.currentTime / audio.duration) * 100);
    playback.isPlaying = !audio.paused;
    updatePlaybackUI(doc);
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
    if (progressEl && !playback.scrubbing) progressEl.value = doc.progress;

    const playIcon = root.querySelector(
      ".player-panel__transport-button--primary .player-panel__transport-icon, .mini-player__play-icon",
    );
    if (playIcon) {
      playIcon.textContent = playback.isPlaying ? "⏸" : "▶";
    }
  }

  const metaEl = slots.miniPlayer.querySelector('[data-bind="fileMeta"]');
  if (metaEl) {
    metaEl.textContent = `${doc.sectionLabel} · ${doc.timeElapsed} / ${doc.timeTotal}`;
  }
}

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
  progressInput.addEventListener("pointerdown", () => {
    playback.scrubbing = true;
  });
  progressInput.addEventListener("input", () => {
    if (!playback.audio || !playback.audio.duration) return;
    const pct = Number(progressInput.value);
    playback.audio.currentTime = (pct / 100) * playback.audio.duration;
    doc.timeElapsed = formatTime(playback.audio.currentTime);
    doc.progress = pct;
  });
  progressInput.addEventListener("pointerup", () => {
    playback.scrubbing = false;
  });

  slots.miniPlayer.replaceChildren(fragment);
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
function handlePdfLoadResult(result) {
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

// Ensures exactly one entry for `file` sits at the top of the live
// Recents list in the already-mounted file-nav, without touching
// anything else in that subtree (pin state, scroll position, search
// input value, etc). Removes any existing DOM node for this file
// first so re-dropping an already-listed PDF moves it rather than
// duplicating it.
function moveRecentFileNavItemToTop(file) {
  const recentsList = slots.fileNav.querySelector('[data-list="recents"]');
  if (!recentsList) return; // file-nav not mounted yet — shouldn't happen post-boot, but don't throw

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
}

// --- Boot ----------------------------------------------------------------

showActiveRoot();

if (state.currentView === "app") {
  renderFileNav();
  render();
} else if (state.currentView === "onboarding") {
  renderOnboardingStep();
}
