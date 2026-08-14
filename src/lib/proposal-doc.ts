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

export type ProposalCoreFeature = { name: string; description: string };

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
