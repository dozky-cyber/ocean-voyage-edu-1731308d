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

function toCoreItem(feature: LibraryFeature): CoreFeatureItem {
  return { name: feature.name, description: feature.description };
}

/** Core Solution = package scope + features the client already selected. */
export function buildCoreFeatures(input: {
  packageName: string | null | undefined;
  briefFeatures: string[];
  context?: string;
}): CoreFeatureItem[] {
  const selected = detectSelectedFeatures([...input.briefFeatures, input.context ?? ""]);
  return coreSolutionFeatures(input.packageName, selected).map(toCoreItem);
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
 * Recommended enhancement (AI business analysis, rule based)
 * ---------------------------------------------------------------------- */

type EnhancementRule = {
  match: RegExp;
  items: EnhancementItem[];
};

const RULES: EnhancementRule[] = [
  {
    match: /landing|website|company profile|sales|jual|toko|produk/,
    items: [
      {
        name: "Form Konsultasi Customer",
        benefit: "Memudahkan calon customer melakukan konsultasi sebelum pembelian.",
        amount: 1_500_000,
      },
      {
        name: "Google Maps Integration",
        benefit: "Membantu customer menemukan lokasi kantor atau showroom Anda.",
        amount: 750_000,
      },
      {
        name: "Lead Analytics Dashboard",
        benefit: "Monitoring performa lead masuk dan sumber traffic terbaik.",
        amount: 2_500_000,
      },
    ],
  },
  {
    match: /stok|inventory|gudang|barang|material/,
    items: [
      {
        name: "Notifikasi Stok Minimum",
        benefit: "Mencegah kehabisan stok karena sistem mengingatkan otomatis.",
        amount: 2_000_000,
      },
      {
        name: "Barcode / QR Scanner",
        benefit: "Mempercepat proses input dan pengecekan barang di lapangan.",
        amount: 3_500_000,
      },
    ],
  },
  {
    match: /keuangan|invoice|pembayaran|payment|kasir|pos/,
    items: [
      {
        name: "Payment Gateway Integration",
        benefit: "Customer bisa membayar online dan pembayaran tercatat otomatis.",
        amount: 3_500_000,
      },
      {
        name: "Laporan Keuangan Otomatis",
        benefit: "Rekap pemasukan dan pengeluaran tanpa input manual.",
        amount: 2_500_000,
      },
    ],
  },
  {
    match: /pelanggan|customer|crm|reservasi|booking|order/,
    items: [
      {
        name: "WhatsApp Notification Otomatis",
        benefit: "Customer menerima konfirmasi dan pengingat tanpa dibalas manual.",
        amount: 2_500_000,
      },
      {
        name: "Customer Database & Riwayat Transaksi",
        benefit: "Memudahkan follow up dan program loyalitas pelanggan.",
        amount: 3_000_000,
      },
    ],
  },
];

const DEFAULT_ENHANCEMENTS: EnhancementItem[] = [
  {
    name: "Dashboard Analitik Operasional",
    benefit: "Memantau performa bisnis harian dalam satu layar.",
    amount: 2_500_000,
  },
  {
    name: "Multi User & Hak Akses",
    benefit: "Tim bisa bekerja bersama dengan pembatasan akses yang aman.",
    amount: 2_000_000,
  },
  {
    name: "Backup & Maintenance 6 Bulan",
    benefit: "Sistem tetap aman, terpantau, dan siap dikembangkan lanjutan.",
    amount: 1_800_000,
  },
];

/**
 * AI business analysis: suggests add-on features that are NOT already part of
 * the client's Order Brief feature list. Admin can edit/add manually later.
 */
export function buildEnhancements(input: {
  features: string[];
  context: string;
}): EnhancementItem[] {
  const context = input.context.toLowerCase();
  const existing = input.features.map((f) => f.toLowerCase());
  const pool: EnhancementItem[] = [];
  for (const rule of RULES) {
    if (rule.match.test(context)) pool.push(...rule.items);
  }
  const candidates = pool.length ? pool : DEFAULT_ENHANCEMENTS;
  const picked: EnhancementItem[] = [];
  for (const item of candidates) {
    const key = item.name.toLowerCase();
    const duplicate =
      picked.some((p) => p.name === item.name) ||
      existing.some((f) => f.includes(key) || key.includes(f));
    if (!duplicate) picked.push(item);
    if (picked.length >= 3) break;
  }
  return picked.length ? picked : DEFAULT_ENHANCEMENTS.slice(0, 3);
}
