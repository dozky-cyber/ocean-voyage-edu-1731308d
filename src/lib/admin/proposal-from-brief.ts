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
      // CLOSING QUALITY: deskripsi menjual hasil bisnis dengan bahasa industri
      // customer (alur kerja nyata), bukan kalimat fitur generik.
      const flow = voice?.reason?.trim() ?? "";
      const outcome = voice?.impact?.trim() || consultant.benefit || consultant.fn;
      description = flow ? `${outcome} ${flow}`.replace(/\s+/g, " ").trim() : outcome;
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
  // MIRROR RULE: Core Solution hasil analisa Team KERJAKU pada Order Brief
  // tidak boleh hilang di proposal. Fitur ini bukan bagian scope utama
  // (customer tidak memintanya), jadi tampil sebagai rekomendasi prioritas.
  const consultantCore: EnhancementItem[] = insight.coreSolutions
    .filter((item) => item.solves)
    .map((item) => ({
      name: item.name,
      benefit: item.benefit,
      amount: indicativePrice(item.name),
      recommended: true,
      reason: item.benefit,
      impact: `Menjawab langsung masalah: ${item.solves}`,
      relation: "Melengkapi scope utama pada Final Order Brief.",
      priority: 1,
      phase: 1 as const,
    }));

  const seen = new Set(consultantCore.map((item) => normalize(item.name)));
  const optional = insight.optional
    .filter((item) => !seen.has(normalize(item.name)))
    .map((item) => ({
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

  return [...consultantCore, ...optional].map((item, index) => ({
    ...item,
    priority: index + 1,
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

/** Angka maksimum pada teks budget ("15-20 juta" -> 20.000.000). */
export function budgetCeiling(text: string | null | undefined): number | null {
  const raw = (text ?? "").toLowerCase().replace(/[–—]/g, "-");
  const numbers = raw.match(/\d+(?:[.,]\d+)?/g);
  if (!numbers?.length) return null;
  const max = Math.max(...numbers.map((n) => Number(n.replace(/\./g, "").replace(",", "."))));
  if (!Number.isFinite(max) || max <= 0) return null;
  if (/miliar|milyar/.test(raw)) return Math.round(max * 1_000_000_000);
  if (/juta|jt/.test(raw)) return Math.round(max * 1_000_000);
  if (/ribu|rb/.test(raw)) return Math.round(max * 1_000);
  return Math.round(max);
}

/** Budget Alignment — bahasa konsultatif, bukan penawaran ulang. */
export function budgetAlignmentFromBrief(
  brief: OrderBriefData,
  insight: BriefInsight,
  basePrice?: number,
): string {
  const budget = brief.budget?.trim();
  const lines = [
    `Prioritas pertama adalah scope utama (${insight.packageName}) agar sistem bisa langsung dipakai pada operasional harian.`,
  ];
  if (budget) {
    lines.push(`Range budget yang Anda sampaikan pada sesi konsultasi: ${budget}.`);
    const ceiling = budgetCeiling(budget);
    if (ceiling && basePrice && basePrice > ceiling * 1.05) {
      lines.push(
        "Angka pada halaman Investment berada di atas range tersebut karena mencakup seluruh kebutuhan yang Anda sampaikan. Bila ingin tetap berada di dalam range, pengerjaan dapat dibagi bertahap: kebutuhan paling mendesak dikerjakan lebih dulu, sisanya menyusul tanpa membangun ulang sistem.",
      );
    } else {
      lines.push(
        "Angka pada halaman Investment sudah menyesuaikan range tersebut. Bila ada penyesuaian, yang diatur adalah urutan pengerjaan, bukan memangkas kebutuhan inti.",
      );
    }
  }
  lines.push(
    insight.optional.length
      ? "Rekomendasi pengembangan tidak harus diambil sekaligus. Tahap 1 dapat menyusul setelah sistem utama berjalan, dan Tahap 2 dikerjakan ketika kebutuhannya sudah terlihat dari pemakaian sehari-hari."
      : "Pengembangan lanjutan dapat ditambahkan bertahap setelah sistem utama berjalan.",
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
  basePrice?: number;
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

  // GUARD SALES: solusi yang ditampilkan hanya boleh menyebut fitur yang benar
  // benar ada di dokumen ini (scope utama atau rekomendasi pengembangan).
  // Tanpa guard ini customer bisa membaca nama fitur yang tidak pernah muncul
  // di halaman manapun — terlihat seperti fitur yang muncul tiba-tiba.
  const scopeNames = new Set(insight.included.map((n) => normalize(n)));
  const optionNames = new Map(
    enhancementsFromBrief(insight).map((o) => [normalize(o.name), o.name] as const),
  );
  const mapLines = insight.problemMap.map((row) => {
    const key = normalize(row.solution);
    if (scopeNames.has(key)) return `${row.problem} -> ${row.solution} (termasuk scope utama)`;
    const parts = row.solution.split(" + ").map((p) => p.trim());
    if (parts.length > 1 && parts.every((p) => scopeNames.has(normalize(p)))) {
      return `${row.problem} -> ${row.solution} (termasuk scope utama)`;
    }
    const option = optionNames.get(key);
    if (option) return `${row.problem} -> ${option} (rekomendasi pengembangan, di luar scope utama)`;
    return `${row.problem} -> Dibahas bersama Anda sebelum pengerjaan dimulai`;
  });

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
      body: budgetAlignmentFromBrief(brief, insight, input.basePrice),
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
      basePrice,
    }),
    coreFeatures: coreFeaturesFromBrief(input.brief, insight),
    enhancements: enhancementsFromBrief(insight),
    pricing: pricingFromBrief(insight, basePrice),
    investmentNote: investmentNoteFromBrief(input.brief, insight),
  };
}
