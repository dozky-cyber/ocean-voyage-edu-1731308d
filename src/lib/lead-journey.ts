/**
 * Lead intelligence: client-side visitor journey, attribution and lead scoring.
 *
 * Everything lives in sessionStorage so it survives client navigation inside a
 * visit without following the user across sessions. Fully SSR-safe: every
 * accessor no-ops on the server.
 */

export type JourneyStep = {
  step: string;
  at: string;
};

export type LeadTracking = {
  utmSource: string;
  utmMedium: string;
  utmCampaign: string;
  referrer: string;
  landingPage: string;
  visitedPages: string[];
  visitorSource: string;
  selectedPackage: string;
  viewedProducts: string[];
  clickedCtas: string[];
  journey: JourneyStep[];
  visitDurationSeconds: number;
  deviceType: "mobile" | "tablet" | "desktop" | "unknown";
  leadScore: number;
  leadTemperature: "Cold Lead" | "Warm Lead" | "Hot Lead";
  startedAt: string;
};

/** Points awarded per meaningful interaction (each type counted once). */
export const LEAD_SCORE_RULES = {
  open_consultation_form: 10,
  click_service_package: 20,
  view_portfolio_product: 30,
  complete_ai_consultation: 40,
  submit_consultation_form: 50,
} as const;

export type ScoreAction = keyof typeof LEAD_SCORE_RULES;

const STORAGE_KEY = "kerjaku_lead_journey";
const AI_STORAGE_KEY = "kerjaku_ai_consultation";

const emptyState: LeadTracking = {
  utmSource: "",
  utmMedium: "",
  utmCampaign: "",
  referrer: "",
  landingPage: "",
  visitedPages: [],
  visitorSource: "direct",
  selectedPackage: "",
  viewedProducts: [],
  clickedCtas: [],
  journey: [],
  visitDurationSeconds: 0,
  deviceType: "unknown",
  leadScore: 0,
  leadTemperature: "Cold Lead",
  startedAt: new Date(0).toISOString(),
};

export function temperatureFor(score: number): LeadTracking["leadTemperature"] {
  if (score >= 80) return "Hot Lead";
  if (score >= 30) return "Warm Lead";
  return "Cold Lead";
}

function detectDevice(): LeadTracking["deviceType"] {
  if (typeof window === "undefined") return "unknown";
  const width = window.innerWidth;
  const touch = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  if (width < 640 || (touch && width < 768)) return "mobile";
  if (width < 1024) return "tablet";
  return "desktop";
}

function classifySource(utmSource: string, referrer: string) {
  if (utmSource) return utmSource;
  if (!referrer) return "direct";
  try {
    const host = new URL(referrer).hostname.replace(/^www\./, "");
    if (host === window.location.hostname) return "internal";
    if (/google\./.test(host)) return "google";
    if (/bing\./.test(host)) return "bing";
    if (/(facebook|instagram|linkedin|twitter|x\.com|tiktok)/.test(host)) return "social";
    return host;
  } catch {
    return "referral";
  }
}

function read(): LeadTracking {
  if (typeof window === "undefined") return { ...emptyState };
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...emptyState };
    return { ...emptyState, ...(JSON.parse(raw) as Partial<LeadTracking>) };
  } catch {
    return { ...emptyState };
  }
}

function write(state: LeadTracking) {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* storage unavailable — tracking is best-effort */
  }
}

function update(mutate: (state: LeadTracking) => void) {
  if (typeof window === "undefined") return;
  const state = read();
  mutate(state);
  state.leadTemperature = temperatureFor(state.leadScore);
  write(state);
}

function pushUnique(list: string[], value: string, limit = 30) {
  const trimmed = value.trim();
  if (!trimmed || list.includes(trimmed)) return;
  if (list.length >= limit) list.shift();
  list.push(trimmed);
}

/** Initialise attribution on first load of a session. Safe to call repeatedly. */
export function initLeadJourney(path: string) {
  if (typeof window === "undefined") return;
  const existing = read();
  const isNew = !window.sessionStorage.getItem(STORAGE_KEY);

  if (isNew) {
    const params = new URLSearchParams(window.location.search);
    const utmSource = params.get("utm_source") ?? "";
    const referrer = document.referrer ?? "";
    write({
      ...emptyState,
      utmSource,
      utmMedium: params.get("utm_medium") ?? "",
      utmCampaign: params.get("utm_campaign") ?? "",
      referrer,
      landingPage: path,
      visitedPages: [path],
      visitorSource: classifySource(utmSource, referrer),
      deviceType: detectDevice(),
      journey: [{ step: `landing:${path}`, at: new Date().toISOString() }],
      startedAt: new Date().toISOString(),
    });
    return;
  }

  existing.deviceType = detectDevice();
  write(existing);
}

/** Record a page view in the visit path. */
export function trackJourneyPage(path: string) {
  update((state) => {
    pushUnique(state.visitedPages, path);
    state.journey.push({ step: `page:${path}`, at: new Date().toISOString() });
    if (state.journey.length > 60) state.journey.shift();
  });
}

/** Record a named journey step (section view, CTA, form stage). */
export function trackJourneyStep(step: string) {
  update((state) => {
    state.journey.push({ step, at: new Date().toISOString() });
    if (state.journey.length > 60) state.journey.shift();
  });
}

/** Award score for an action; each action type only scores once per session. */
export function scoreAction(action: ScoreAction) {
  update((state) => {
    const marker = `score:${action}`;
    if (!state.journey.some((entry) => entry.step === marker)) {
      state.leadScore += LEAD_SCORE_RULES[action];
      state.journey.push({ step: marker, at: new Date().toISOString() });
    }
  });
}

export function trackCtaClick(location: string, label: string) {
  update((state) => {
    pushUnique(state.clickedCtas, `${location}:${label}`);
    state.journey.push({ step: `cta:${location}`, at: new Date().toISOString() });
  });
}

export function trackProductView(product: string) {
  update((state) => {
    pushUnique(state.viewedProducts, product);
    state.journey.push({ step: `product:${product}`, at: new Date().toISOString() });
  });
  scoreAction("view_portfolio_product");
}

export function trackPackageSelect(pkg: string) {
  update((state) => {
    state.selectedPackage = pkg;
    state.journey.push({ step: `package:${pkg}`, at: new Date().toISOString() });
  });
  scoreAction("click_service_package");
}

/** Snapshot used as the hidden payload attached to a consultation submission. */
export function getLeadTracking(): LeadTracking {
  const state = read();
  const started = Date.parse(state.startedAt);
  const duration = Number.isFinite(started)
    ? Math.max(0, Math.round((Date.now() - started) / 1000))
    : 0;
  const score = state.leadScore + LEAD_SCORE_RULES.submit_consultation_form;
  return {
    ...state,
    visitDurationSeconds: duration,
    leadScore: score,
    leadTemperature: temperatureFor(score),
  };
}
