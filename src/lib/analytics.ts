/**
 * Lightweight GA4 wrapper. Safe no-op when no measurement ID is configured
 * or when running on the server, so nothing breaks and nothing is loaded.
 */

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

const measurementId = import.meta.env["VITE_LOVABLE_CONNECTOR_GOOGLE_ANALYTICS_API_KEY"] as
  | string
  | undefined;

let initialized = false;

export function initAnalytics() {
  if (typeof window === "undefined" || initialized || !measurementId) return;
  initialized = true;

  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
  document.head.appendChild(script);

  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag(...args: unknown[]) {
    window.dataLayer!.push(args);
  };
  window.gtag("js", new Date());
  window.gtag("config", measurementId);
}

export function trackEvent(name: string, params: Record<string, unknown> = {}) {
  if (typeof window === "undefined") return;
  window.gtag?.("event", name, params);
}

export function trackPageView(path: string) {
  trackEvent("page_view", { page_path: path });
}

/** Conversion-prep events */
export const analytics = {
  consultationButtonClick: (location: string, label: string) =>
    trackEvent("consultation_button_click", { cta_location: location, cta_label: label }),
  portfolioProjectClick: (project: string, url?: string) =>
    trackEvent("portfolio_project_click", { project_name: project, project_url: url ?? "" }),
  consultationFormSubmit: (params: { project_type: string; budget: string; timeline: string }) =>
    trackEvent("consultation_form_submit", params),
};
