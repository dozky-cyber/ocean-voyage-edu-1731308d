/**
 * KERJAKU PROPOSAL MIRROR ENGINE (Consultant Engine V8).
 *
 * ORDER BRIEF (source of truth) -> buildBriefInsight() -> PROPOSAL.
 *
 * The proposal is a FORMATTER, never a second consultation engine:
 * - Package        = package hasil Order Brief (tidak boleh diganti nama lain).
 * - Core Solution  = Feature List Order Brief, verbatim (tidak tambah/kurang).
 * - Feature Recom. = Potential Feature Order Brief, 1:1 (nama, alasan, dampak,
 *                    kaitan alur bisnis, prioritas, fase).
 * Harga adalah angka indikatif yang tetap bisa diedit admin.
 */

import type { OrderBriefData } from "@/lib/order-brief";
import { buildBriefInsight, resolveAdminNeeds, type BriefInsight } from "@/lib/order-brief-insight";
import {
  CONSULTANT_LIBRARY,
  detectBusinessMaturity,
  type ConsultantFeature,
} from "./consultant-library";
import { matchLibraryFeature, resolvePackage } from "./feature-library";
import {
  describeFeatureForIndustry,
  detectIndustryContext,
} from "./industry-context";
import type { CoreFeatureItem, EnhancementItem } from "./proposal-logic";
import type { ProposalSection, PricingItem } from "./sales-ai";

function normalize(value: string) {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}

/** Cari fitur consultant library dari teks fitur brief (alias / nama). */
export function consultantFeatureByText(text: string): ConsultantFeature | undefined {
  const norm = normalize(text);
  if (!norm) return undefined;
  return CONSULTANT_LIBRARY.find((feature) => {
    if (normalize(feature.name) === norm) return true;
    return [feature.name, ...feature.aliases].some((alias) => {
      const a = normalize(alias);
      return a.length > 3 && (norm.includes(a) || a.includes(norm));
    });
  });
}

/** Harga indikatif: master library dulu, lalu default per tier. */
const TIER_PRICE: Record<ConsultantFeature["tier"], number> = {
  basic: 750_000,
  professional: 1_500_000,
  business: 2_500_000,
  enterprise: 5_000_000,
};

export function indicativePrice(name: string): number {
  const master = matchLibraryFeature(name);
  if (master) return master.price;
  const consultant = consultantFeatureByText(name);
  if (consultant) return TIER_PRICE[consultant.tier];
  return 1_500_000;
}

/* -------------------------------------------------------------------------
 * Core Solution — Feature List brief verbatim + deskripsi berbasis industri
 * ---------------------------------------------------------------------- */

export function coreFeaturesFromBrief(
  brief: OrderBriefData,
  insight: BriefInsight,
): CoreFeatureItem[] {
  const context = normalize(
    [brief.business, brief.project, brief.goal, ...brief.features, ...brief.problems]
      .filter(Boolean)
      .join(" | "),
  );
  const industry = detectIndustryContext(
    [brief.business, brief.project].filter(Boolean).join(" "),
    context,
  );
  const stage = detectBusinessMaturity({
    context,
    problemText: normalize(brief.problems.join(" | ")),
    scaleText: [brief.usersScale, brief.adminNeeds].filter(Boolean).join(" | "),
  });
  const business = brief.business?.trim() || "bisnis Anda";

  return insight.included.map((name) => {
    const solved = insight.problemMap.find(
      (row) => normalize(row.solution).includes(normalize(name)) || normalize(name).includes(normalize(row.solution)),
    );
    const consultant = consultantFeatureByText(name);
    const master = matchLibraryFeature(name);

    let description = "";
    if (consultant) {
      const voice = describeFeatureForIndustry({
        featureId: consultant.id,
        featureName: name,
        featureFn: consultant.fn,
        benefit: consultant.benefit,
        business,
        ctx: industry,
        stage,
      });
      description = voice?.impact?.trim() || consultant.fn;
    } else if (master) {
      description = master.description;
    } else {
      description = `Bagian dari kebutuhan ${business} yang dikerjakan pada scope utama.`;
    }

    return {
      name,
      description: description.replace(/\s*$/, ""),
      solves: solved && solved.source !== "open" ? solved.problem : null,
    };
  });
}

/* -------------------------------------------------------------------------
 * Feature Recommendation — mirror Potential Feature Order Brief
 * ---------------------------------------------------------------------- */

export function enhancementsFromBrief(insight: BriefInsight): EnhancementItem[] {
  return insight.optional.map((item) => ({
    name: item.name,
    benefit: item.description,
    amount: indicativePrice(item.name),
    recommended: item.phase === 1,
    reason: item.reason,
    impact: item.impact ?? null,
    relation: item.relation ?? null,
    priority: item.priority,
    phase: item.phase,
  }));
}

/* -------------------------------------------------------------------------
 * Pricing — Core Solution satu baris, angka tetap bisa diedit admin
 * ---------------------------------------------------------------------- */

export function pricingFromBrief(
  insight: BriefInsight,
  basePrice: number,
): PricingItem[] {
  return [
    {
      item: `Core Solution — ${insight.packageName}`,
      detail: insight.included.length
        ? `Termasuk: ${insight.included.join(", ")}`
        : "Scope utama sesuai Final Order Brief",
      amount: basePrice,
    },
  ];
}

/* -------------------------------------------------------------------------
 * Sections
 * ---------------------------------------------------------------------- */

function bullets(items: string[]) {
  return items.map((i) => `\u2022 ${i}`).join("\n");
}

function numbered(items: string[]) {
  return items.map((item, index) => `${index + 1}. ${item}`).join("\n");
}

/** Investment = angka dan item saja. Penjelasan value ada di Recommendation. */
export function investmentNoteFromBrief(_brief: OrderBriefData, insight: BriefInsight): string {
  return `Seluruh angka mengikuti scope ${insight.packageName} pada Final Order Brief. Harga bersifat indikatif dan dikonfirmasi ulang sebelum kesepakatan kerja.`;
}

/** Budget Alignment — bahasa konsultatif, bukan penawaran ulang. */
export function budgetAlignmentFromBrief(brief: OrderBriefData, insight: BriefInsight): string {
  const budget = brief.budget?.trim();
  const lines = [
    `Prioritas pertama adalah scope utama (${insight.packageName}) agar sistem bisa langsung dipakai pada operasional harian.`,
  ];
  if (budget) {
    lines.push(
      `Range budget yang disampaikan pada Order Brief: ${budget}. Bila angka scope utama perlu disesuaikan, penyesuaian dilakukan pada urutan pengerjaan, bukan dengan memangkas kebutuhan inti.`,
    );
  }
  lines.push(
    insight.optional.length
      ? "Fitur tambahan tidak harus diambil sekaligus. Fase 1 dapat menyusul setelah scope utama berjalan, dan Fase 2 dikerjakan ketika kebutuhan bisnis sudah terlihat dari data pemakaian."
      : "Pengembangan lanjutan dapat ditambahkan bertahap setelah scope utama berjalan.",
  );
  return lines.join(" ");
}

/**
 * Section teks proposal. Core Solution, Feature Recommendation, Timeline,
 * Investment, dan Payment Terms dirender dari data terstruktur pada PDF,
 * sehingga tidak ada isi yang tampil dua kali.
 */
export function proposalSectionsFromBrief(input: {
  brief: OrderBriefData;
  insight: BriefInsight;
  contactName: string;
  createdAt?: string;
}): ProposalSection[] {
  const { brief, insight } = input;
  const client = brief.business?.trim() || input.contactName || "Klien";
  const today = new Date(input.createdAt ?? Date.now()).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const requirement = [
    `${client} menyampaikan kebutuhan berikut pada sesi konsultasi bersama KERJAKU:`,
    "",
    brief.project?.trim() || "Sistem digital untuk mendukung operasional bisnis.",
  ];
  if (brief.goal?.trim()) requirement.push("", brief.goal.trim());
  requirement.push(
    "",
    `Pengguna sistem: ${brief.usersScale?.trim() || "Belum disampaikan"}`,
    `Kebutuhan admin/team: ${resolveAdminNeeds(brief)}`,
  );
  if (brief.timeline?.trim()) requirement.push(`Target waktu: ${brief.timeline.trim()}`);
  if (brief.budget?.trim()) requirement.push(`Range budget: ${brief.budget.trim()}`);

  const mapLines = insight.problemMap.map((row) => `${row.problem} -> ${row.solution}`);

  const recommended = [
    `KERJAKU merekomendasikan ${insight.packageName} sebagai solusi utama (Core Solution) untuk ${client}.`,
    "",
    insight.reason,
    "",
    "Kesiapan bisnis saat ini:",
    `${insight.readiness.level}`,
    ...insight.readiness.lines,
  ];

  return [
    {
      heading: "Cover",
      body: [
        `Proposal Solusi Digital untuk ${client}`,
        `Disiapkan untuk: ${input.contactName || brief.customerName}`,
        brief.project?.trim() ? `Kebutuhan: ${brief.project.trim().split("\n")[0]}` : null,
        `Rekomendasi solusi: ${insight.packageName}`,
        `Tanggal: ${today}`,
        "Disiapkan oleh: KERJAKU — Team KERJAKU Consultant",
      ]
        .filter(Boolean)
        .join("\n"),
    },
    {
      heading: "About KERJAKU",
      body: [
        "KERJAKU membangun produk digital yang benar-benar dipakai setiap hari: website, aplikasi bisnis, otomatisasi alur kerja, dan integrasi AI.",
        "Pendekatan kami sederhana — pahami proses bisnisnya dulu, baru bangun sistemnya. Setiap project dikerjakan bertahap agar hasilnya terukur dan risikonya terkendali.",
      ].join("\n\n"),
    },
    { heading: "Client Requirement", body: requirement.join("\n") },
    {
      heading: "Business Problem",
      body: brief.problems.length
        ? ["Masalah yang customer sampaikan pada Order Brief:", "", bullets(brief.problems)].join("\n")
        : "Belum ada masalah spesifik yang disampaikan pada Order Brief.",
    },
    {
      heading: "Feature List (Order Brief)",
      body: [
        "Daftar fitur berikut diambil langsung dari Final Order Brief dan menjadi acuan scope pengerjaan:",
        "",
        numbered(insight.included.length ? insight.included : brief.features),
      ].join("\n"),
    },
    { heading: "Recommended Solution", body: recommended.join("\n") },
    ...(mapLines.length
      ? [
          {
            heading: "Problem & Solution Mapping",
            body: [
              "Setiap masalah yang customer sampaikan dipetakan langsung ke solusinya:",
              "",
              bullets(mapLines),
            ].join("\n"),
          },
        ]
      : []),
    {
      heading: "Budget Alignment",
      body: budgetAlignmentFromBrief(brief, insight),
    },
    {
      heading: "Next Steps",
      body: bullets([
        `Konfirmasi scope ${insight.packageName} bersama Team KERJAKU`,
        "Pengecekan kebutuhan final dan prioritas pengerjaan",
        "Penandatanganan kesepakatan kerja",
        "Kick-off pengembangan sesuai timeline yang disepakati",
      ]),
    },
  ];
}

/** Satu pintu: seluruh isi proposal diturunkan dari Final Order Brief. */
export function buildProposalFromBrief(input: {
  brief: OrderBriefData;
  contactName: string;
  /** Harga dasar indikatif; default = harga package hasil Order Brief. */
  basePrice?: number;
  createdAt?: string;
}) {
  const insight = buildBriefInsight(input.brief);
  const basePrice = input.basePrice ?? resolvePackage(insight.packageName).basePrice;
  return {
    insight,
    packageName: insight.packageName,
    sections: proposalSectionsFromBrief({
      brief: input.brief,
      insight,
      contactName: input.contactName,
      createdAt: input.createdAt,
    }),
    coreFeatures: coreFeaturesFromBrief(input.brief, insight),
    enhancements: enhancementsFromBrief(insight),
    pricing: pricingFromBrief(insight, basePrice),
    investmentNote: investmentNoteFromBrief(input.brief, insight),
  };
}
