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

    pinnedFiles: [
        { id: "meeting-notes", name: "Meeting_Notes.pdf" },
    ],
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
            timeElapsed: "0:00",
            timeTotal: "0:00",
            progress: 0,
            sectionLabel: "Section 1 of 1",
        },
        "project-notes": {
            fileName: "Project_Notes.pdf",
            title: "Project Notes",
            paragraphs: [
                "Placeholder content for Project_Notes.pdf.",
            ],
            narratorName: "Helen (NGA)",
            timeElapsed: "0:00",
            timeTotal: "0:00",
            progress: 0,
            sectionLabel: "Section 1 of 1",
        },
        "cook": {
            fileName: "Cook.pdf",
            title: "Cook",
            paragraphs: [
                "Placeholder content for Cook.pdf.",
            ],
            narratorName: "Helen (NGA)",
            timeElapsed: "0:00",
            timeTotal: "0:00",
            progress: 0,
            sectionLabel: "Section 1 of 1",
        },
        "story": {
            fileName: "Story.pdf",
            title: "Story",
            paragraphs: [
                "Placeholder content for Story.pdf.",
            ],
            narratorName: "Helen (NGA)",
            timeElapsed: "0:00",
            timeTotal: "0:00",
            progress: 0,
            sectionLabel: "Section 1 of 1",
        },
    },

    // null = show empty-state; an object (one of `documents` above) =
    // show reader-view + player-panel + mini-player
    currentDocument: null,

    // --- Plans (upgrade page) ---
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
            description: "Unlock high fidelity voices with ultra-customizable controls.",
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

    fragment.querySelector('[data-bind="voiceGenderFemale"]').checked = data.voiceGender === "female";
    fragment.querySelector('[data-bind="voiceGenderMale"]').checked = data.voiceGender === "male";
    fragment.querySelectorAll('input[name="voiceGender"]').forEach((el) => {
        el.addEventListener("change", (e) => {
            data.voiceGender = e.target.value;
        });
    });

    fragment.querySelector('[data-bind="themeLight"]').checked = data.theme === "light";
    fragment.querySelector('[data-bind="themeDark"]').checked = data.theme === "dark";
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
                el.setAttribute("aria-pressed", String(el.dataset.colorValue === color));
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
    roots.onboarding.style.display = state.currentView === "onboarding" ? "" : "none";
    roots.appShell.style.display = state.currentView === "app" ? "" : "none";
    roots.upgradePage.style.display = state.currentView === "upgrade" ? "" : "none";
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
    const fragment = clone("tpl-file-nav-item");
    bind(fragment, "fileName", file.name);
    fragment.querySelector(".file-nav__item-button")
        .addEventListener("click", () => openFile(file.id));
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
    dropzone.addEventListener("dragover", (e) => e.preventDefault());
    dropzone.addEventListener("drop", handleFileDrop);

    slots.main.replaceChildren(fragment);
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
}

// --- Render: player-panel + mini-player (only when a document is loaded) --

function renderPlayerPanel() {
    if (!state.currentDocument) {
        slots.playerPanel.replaceChildren();
        return;
    }

    const doc = state.currentDocument;
    const fragment = clone("tpl-player-panel");

    bind(fragment, "narratorName", doc.narratorName);
    bind(fragment, "timeElapsed", doc.timeElapsed);
    bind(fragment, "timeTotal", doc.timeTotal);
    bind(fragment, "progress", doc.progress);

    on(fragment, "play-pause", playPause);
    on(fragment, "rewind", rewind);
    on(fragment, "skip-forward", skipForward);
    on(fragment, "regenerate", regenerate);

    slots.playerPanel.replaceChildren(fragment);
}

function renderMiniPlayer() {
    if (!state.currentDocument) {
        slots.miniPlayer.replaceChildren();
        return;
    }

    const doc = state.currentDocument;
    const fragment = clone("tpl-mini-player");

    bind(fragment, "fileName", doc.fileName);
    bind(fragment, "fileMeta", `${doc.sectionLabel} · ${doc.timeElapsed} / ${doc.timeTotal}`);
    bind(fragment, "timeElapsed", doc.timeElapsed);
    bind(fragment, "timeTotal", doc.timeTotal);
    bind(fragment, "progress", doc.progress);
    bind(fragment, "narratorName", doc.narratorName);
    bind(fragment, "speedLabel", "1x");

    on(fragment, "play-pause", playPause);

    slots.miniPlayer.replaceChildren(fragment);
}

// --- Actions (stubs — wire to real IPC/engine calls as they land) ------

function toggleTheme() {
    const html = document.documentElement;
    const next = html.dataset.theme === "dark" ? "light" : "dark";
    html.dataset.theme = next;
}

function browseFiles() {
    // TODO: open native file picker via IPC, then call openFile() (or a
    // new loadDroppedOrPickedFile()) with the real extracted PDF content.
    console.log("TODO: open file picker dialog");
}

function handleFileDrop(event) {
    event.preventDefault();
    // TODO: same as browseFiles — extract real PDF text, then set
    // state.currentDocument to the extracted result and render().
    console.log("TODO: handle dropped file", event.dataTransfer.files);
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
    state.currentDocument = doc;
    render();
}

// "New file" returns to the welcome/upload screen — same state as a
// fresh launch with no document loaded. Sidebar itself is untouched
// since it never re-renders.
function goToNewFile() {
    state.currentDocument = null;
    render();
}

function playPause() {
    console.log("TODO: toggle playback");
}

function rewind() {
    console.log("TODO: rewind");
}

function skipForward() {
    console.log("TODO: skip forward");
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