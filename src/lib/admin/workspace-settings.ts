/**
 * Workspace preferences for the Business OS.
 * Stored locally per device — no schema, auth or CRM data is touched.
 */

export const AI_TONES = ["Profesional", "Konsultatif", "Santai", "Persuasif"] as const;
export type AiTone = (typeof AI_TONES)[number];

export type WorkspaceSettings = {
  companyName: string;
  companyTagline: string;
  companyEmail: string;
  companyWebsite: string;
  companyAddress: string;
  salesName: string;
  salesWhatsapp: string;
  salesEmail: string;
  salesHours: string;
  aiTone: AiTone;
  aiLanguage: "Indonesia" | "English";
  aiSignature: string;
  notifyNewLead: boolean;
  notifyHotLead: boolean;
  notifyProposalStatus: boolean;
  notifyDailyDigest: boolean;
};

export const DEFAULT_WORKSPACE_SETTINGS: WorkspaceSettings = {
  companyName: "KERJAKU",
  companyTagline: "Work, made your way.",
  companyEmail: "halo@kerjaku.space",
  companyWebsite: "https://kerjaku.space",
  companyAddress: "",
  salesName: "Adji Taufiq",
  salesWhatsapp: "",
  salesEmail: "",
  salesHours: "Senin–Jumat, 09.00–18.00 WIB",
  aiTone: "Konsultatif",
  aiLanguage: "Indonesia",
  aiSignature: "Salam hangat, tim KERJAKU",
  notifyNewLead: true,
  notifyHotLead: true,
  notifyProposalStatus: true,
  notifyDailyDigest: false,
};

const STORAGE_KEY = "kerjaku_workspace_settings";

export function loadWorkspaceSettings(): WorkspaceSettings {
  if (typeof window === "undefined") return DEFAULT_WORKSPACE_SETTINGS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_WORKSPACE_SETTINGS;
    const parsed = JSON.parse(raw) as Partial<WorkspaceSettings>;
    return { ...DEFAULT_WORKSPACE_SETTINGS, ...parsed };
  } catch {
    return DEFAULT_WORKSPACE_SETTINGS;
  }
}

export function saveWorkspaceSettings(settings: WorkspaceSettings): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}
