/**
 * KERJAKU Proposal Generator V5 — feature recommendation (master library),
 * core solution, timeline/deadline logic, split investment and payment terms.
 *
 * Pure client-safe helpers. Order Brief + Client Discovery = source of truth.
 */

import {
  coreSolutionFeatures,
  detectSelectedFeatures,
  recommendFeatures,
  resolvePackage,
  type LibraryFeature,
} from "./feature-library";

export type EnhancementItem = {
  name: string;
  benefit: string;
  amount: number;
  recommended?: boolean;
};

export function parseEnhancements(value: unknown): EnhancementItem[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((row) =>
    row && typeof row === "object"
      ? [
          {
            name: String((row as { name?: unknown }).name ?? ""),
            benefit: String((row as { benefit?: unknown }).benefit ?? ""),
            amount: Number((row as { amount?: unknown }).amount ?? 0) || 0,
            recommended: Boolean((row as { recommended?: unknown }).recommended),
          },
        ]
      : [],
  );
}

export function enhancementsTotal(items: EnhancementItem[]): number {
  return items.reduce((sum, i) => sum + (Number(i.amount) || 0), 0);
}

/* -------------------------------------------------------------------------
 * Core Solution feature list (stored on the proposal, editable by admin)
 * ---------------------------------------------------------------------- */

export type CoreFeatureItem = { name: string; description: string };

export function parseCoreFeatures(value: unknown): CoreFeatureItem[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((row) =>
    row && typeof row === "object"
      ? [
          {
            name: String((row as { name?: unknown }).name ?? ""),
            description: String((row as { description?: unknown }).description ?? ""),
          },
        ]
      : [],
  );
}

/**
 * Core Solution = the client's Order Brief feature list, verbatim.
 * No package default feature, no AI-invented feature, no renaming.
 */
export function buildCoreFeatures(input: {
  packageName: string | null | undefined;
  briefFeatures: string[];
  context?: string;
}): CoreFeatureItem[] {
  return briefIncludedFeatures(input.briefFeatures).map((name) => {
    const match = matchLibraryFeature(name);
    return {
      name,
      description: match?.description ?? "Sesuai kebutuhan yang disampaikan client pada Order Brief.",
    };
  });
}


/* -------------------------------------------------------------------------
 * Payment terms (proposal agreement text only — Invoice does the math)
 * ---------------------------------------------------------------------- */

export type PaymentType = "full" | "termin";

export type PaymentTermsInput = {
  type: PaymentType | null | undefined;
  dpPercent?: number | null;
  customText?: string | null;
};

/**
 * Default = FULL PAYMENT. No assumption about DP or schedule is ever made
 * unless the admin explicitly chooses DP / Termin.
 */
export function buildPaymentTermsLines(input: PaymentTermsInput): string[] {
  const custom = (input.customText ?? "").trim();
  if (custom) return custom.split("\n").map((line) => line.trimEnd());
  if (input.type !== "termin") return ["Full Payment"];
  const dp = Number(input.dpPercent ?? 0);
  if (!dp || dp <= 0 || dp >= 100) return ["DP saat kick-off project", "Sisa pembayaran setelah project selesai"];
  return [
    `${dp}% DP saat kick-off project`,
    `Sisa pembayaran ${100 - dp}% setelah project selesai`,
  ];
}


/* -------------------------------------------------------------------------
 * Timeline & deadline
 * ---------------------------------------------------------------------- */

/** Max duration in days from a free-text timeline ("1-2 minggu" -> 14). */
export function timelineToDays(text: string | null | undefined): number | null {
  const raw = (text ?? "").toLowerCase().replace(/–|—/g, "-");
  if (!raw.trim()) return null;
  const numbers = raw.match(/\d+(?:[.,]\d+)?/g);
  if (!numbers?.length) return null;
  const max = Math.max(...numbers.map((n) => Number(n.replace(",", "."))));
  if (!Number.isFinite(max) || max <= 0) return null;
  if (/bulan|month/.test(raw)) return Math.round(max * 30);
  if (/minggu|pekan|week/.test(raw)) return Math.round(max * 7);
  if (/hari|day/.test(raw)) return Math.round(max);
  return null;
}

const MONTHS_ID = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

export function formatDeadline(date: Date): string {
  return `${date.getDate()} ${MONTHS_ID[date.getMonth()]} ${date.getFullYear()}`;
}

/** Deadline = proposal creation date + max duration of the estimated timeline. */
export function computeDeadline(
  createdAt: string | Date,
  estimatedTimeline: string | null | undefined,
): string | null {
  const days = timelineToDays(estimatedTimeline);
  if (days === null) return null;
  const start = new Date(createdAt);
  if (Number.isNaN(start.getTime())) return null;
  const end = new Date(start.getTime());
  end.setDate(end.getDate() + days);
  return formatDeadline(end);
}

export type TimelineBlock = { heading: string; lines: string[] };

/**
 * Admin left "KERJAKU estimated timeline" empty -> show only the Order Brief
 * timeline. Filled -> show the KERJAKU estimate paragraph + production deadline.
 */
export function buildTimelineBlock(input: {
  briefTimeline?: string | null;
  estimatedTimeline?: string | null;
  createdAt: string | Date;
}): TimelineBlock | null {
  const estimated = (input.estimatedTimeline ?? "").trim();
  const brief = (input.briefTimeline ?? "").trim();

  if (!estimated) {
    if (!brief) return null;
    return { heading: "PROJECT TIMELINE", lines: [brief] };
  }

  const lines = [
    `Estimasi pengerjaan KERJAKU sekitar ${estimated} karena menyesuaikan antrean project aktif. Project dapat selesai lebih cepat apabila kapasitas tersedia.`,
  ];
  const deadline = computeDeadline(input.createdAt, estimated);
  if (deadline) lines.push("", "Deadline Produksi:", deadline);
  return { heading: "PROJECT TIMELINE", lines };
}

/* -------------------------------------------------------------------------
 * Feature Recommendation (AI business analysis, master library only)
 * ---------------------------------------------------------------------- */

/**
 * AI business analysis: recommends add-on features from the MASTER FEATURE
 * LIBRARY only. Features already chosen by the client (Order Brief / Client
 * Discovery) or already inside the Core Solution are removed first
 * (anti duplicate rule). Admin can edit, delete, add, or reprice afterwards.
 */
export function buildEnhancements(input: {
  features: string[];
  context: string;
  packageName?: string | null;
  limit?: number;
}): EnhancementItem[] {
  const selected = detectSelectedFeatures([...input.features, input.context]);
  const core = resolvePackage(input.packageName).coreFeatureIds;
  const picked = recommendFeatures({
    selected,
    excludeIds: core,
    context: `${input.features.join(" ")} ${input.context}`,
    limit: input.limit ?? 4,
  });
  return picked.map((feature, index) => ({
    name: feature.name,
    benefit: feature.description,
    amount: feature.price,
    recommended: index < 2,
  }));
}
