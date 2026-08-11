/**
 * Lightweight GA4 wrapper. Safe no-op when no measurement ID is configured
 * or when running on the server, so nothing breaks and nothing is loaded.
 */

import {
  scoreAction,
  trackCtaClick,
  trackJourneyPage,
  trackJourneyStep,
  trackPackageSelect,
  trackProductView,
} from "./lead-journey";

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

const GA4_MEASUREMENT_ID = "G-CVZRFL7G6L";

const measurementId =
  (import.meta.env["VITE_LOVABLE_CONNECTOR_GOOGLE_ANALYTICS_API_KEY"] as string | undefined) ||
  GA4_MEASUREMENT_ID;

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
  trackJourneyPage(path);
}

/** Conversion-prep events */
export const analytics = {
  consultationButtonClick: (location: string, label: string) => {
    trackEvent("consultation_button_click", { cta_location: location, cta_label: label });
    trackCtaClick(location, label);
  },
  portfolioProjectClick: (project: string, url?: string) => {
    trackEvent("portfolio_project_click", { project_name: project, project_url: url ?? "" });
    trackProductView(project);
  },
  servicePackageClick: (pkg: string) => {
    trackEvent("service_package_click", { package_name: pkg });
    trackPackageSelect(pkg);
  },
  consultationFormOpen: () => {
    trackEvent("consultation_form_open", {});
    scoreAction("open_consultation_form");
    trackJourneyStep("form:open");
  },
  sectionView: (section: string) => trackJourneyStep(`section:${section}`),
  consultationFormSubmit: (params: {
    project_type: string;
    budget: string;
    timeline: string;
    lead_score?: number;
    lead_temperature?: string;
  }) => {
    trackEvent("consultation_form_submit", params);
    scoreAction("submit_consultation_form");
    trackJourneyStep("form:submit");
  },
};
