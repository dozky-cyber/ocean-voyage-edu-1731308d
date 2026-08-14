// Client-safe helpers for KERJAKU Proposal documents (naming, slug, WhatsApp copy).
// Branding is always "KERJAKU — Business System Consultant".

export type ProposalPricingItem = { item: string; detail: string; amount: number };
export type ProposalSectionData = { heading: string; body: string };

export type ProposalEnhancementItem = {
  name: string;
  benefit: string;
  amount: number;
  recommended?: boolean;
  /** Mirror Order Brief — alasan relevansi, dampak, dan kaitan alur bisnis. */
  reason?: string | null;
  impact?: string | null;
  relation?: string | null;
  priority?: number | null;
  phase?: 1 | 2 | null;
};

export type ProposalCoreFeature = { name: string; description: string; solves?: string | null };

export type ProposalDocData = {
  title: string;
  version: number;
  clientName: string;
  contactName: string;
  email: string | null;
  whatsapp: string | null;
  recommendedPackage: string | null;
  currency: string;
  validUntil: string | null;
  investmentNote: string | null;
  /** Payment agreement only — the Invoice system does the actual math. */
  paymentType: "full" | "termin";
  paymentDpPercent?: number | null;
  paymentTermsText?: string | null;
  sections: ProposalSectionData[];
  pricing: ProposalPricingItem[];
  /** Timeline from the Final Order Brief (client requirement). */
  briefTimeline?: string | null;
  /** Internal KERJAKU estimate; when filled it drives the production deadline. */
  estimatedTimeline?: string | null;
  enhancements?: ProposalEnhancementItem[];
  coreFeatures?: ProposalCoreFeature[];
  createdAt: string;
};

/* -------------------------------------------------------------------------
 * Client contact integrity — only real customer data reaches the document.
 * ---------------------------------------------------------------------- */

const INTERNAL_EMAIL_DOMAINS = ["kerjaku.space", "leads.kerjaku.space", "localhost", "example.com", "test.com"];
const GENERATED_EMAIL_PREFIXES = ["ai-", "ai_sess", "ai-sess", "lead-", "lead_", "guest-", "anon-", "noreply", "no-reply", "system-"];
const PLACEHOLDER_EMAILS = ["-", "n/a", "na", "none", "null", "undefined", "email"];

/**
 * Returns the customer email only when it is a real address given by the
 * client. Internal/system/generated/placeholder emails become null so the
 * document never shows an address the customer does not recognise.
 */
export function customerEmail(value: string | null | undefined): string | null {
  const email = (value ?? "").trim().toLowerCase();
  if (!email) return null;
  if (PLACEHOLDER_EMAILS.includes(email)) return null;
  if (!/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(email)) return null;
  const [local, domain] = email.split("@");
  if (!local || !domain) return null;
  if (INTERNAL_EMAIL_DOMAINS.some((d) => domain === d || domain.endsWith(`.${d}`))) return null;
  if (GENERATED_EMAIL_PREFIXES.some((p) => local.startsWith(p))) return null;
  return email;
}

/** Digits-only sanity check so "-" or "belum ada" never renders as a phone. */
export function customerWhatsapp(value: string | null | undefined): string | null {
  const raw = (value ?? "").trim();
  if (!raw) return null;
  const digits = raw.replace(/\D/g, "");
  if (digits.length < 8) return null;
  return raw;
}

function safeName(value: string) {
  return (
    value
      .trim()
      .replace(/[^A-Za-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "") || "Client"
  );
}

/** Proposal_KERJAKU_Candra.pdf */
export function proposalFileName(clientName: string) {
  return `Proposal_KERJAKU_${safeName(clientName)}.pdf`;
}

/** proposal-candra → short link base for https://kerjaku.space/d/proposal-candra */
export function proposalSlugBase(clientName: string) {
  const slug = clientName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug ? `proposal-${slug}` : "proposal-kerjaku";
}

/** WhatsApp message for proposal delivery — clean file name + short preview URL. */
export function buildProposalWhatsappMessage(input: {
  clientName: string;
  fileName: string;
  previewUrl?: string | null;
}) {
  const lines = [
    `Halo Kak ${input.clientName || "Client"},`,
    "",
    "Terima kasih sudah melakukan konsultasi bersama KERJAKU Business System Consultant.",
    "",
    "Berdasarkan kebutuhan yang sudah kami finalisasi, kami sudah menyiapkan Proposal Solusi Digital KERJAKU.",
    "",
    "Proposal ini berisi:",
    "- Analisa kebutuhan bisnis",
    "- Rekomendasi solusi",
    "- Scope pekerjaan",
    "- Investasi",
    "- Timeline pengerjaan",
    "",
    "📎 Proposal KERJAKU:",
    input.fileName,
  ];
  if (input.previewUrl) lines.push("", "📥 Lihat Proposal:", input.previewUrl);
  lines.push(
    "",
    "Kami siap berdiskusi apabila ada revisi kebutuhan atau penyesuaian solusi.",
    "",
    "Terima kasih,",
    "",
    "KERJAKU",
    "Business System Consultant",
  );
  return lines.join("\n");
}
