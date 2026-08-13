// TEAM KERJAKU CONSULTANT block for the Order Brief PDF.
//
// TEAM KERJAKU CONSULTANT ENGINE V3
// - The Final Order Brief is the single source of truth. Customer needs and
//   consultant recommendations are never mixed.
// - Package recommendation follows the real complexity of the brief and is
//   never inflated (an admin dashboard alone does not upgrade a package).
// - Improvements only live inside TEAM KERJAKU CONSULTANT RECOMMENDATION +
//   POTENTIAL FEATURE RECOMMENDATION, each with a clear business reason.

import {
  briefCoveredFeatureIds,
  briefIncludedFeatures,
  resolvePackage,
  type PackageDefinition,
  type PackageKey,
} from "./admin/feature-library";
import {
  selectConsultantFeatures,
  type ConsultantPick,
  type ConsultantTier,
} from "./admin/consultant-library";
import type { OrderBriefData } from "./order-brief";


export type ConsultantOption = {
  packageName: string;
  intro: string[];
  items: { title: string; benefit: string; optional?: boolean }[];
  comparison: { name: string; points: string[] }[];
  /** PACKAGE UPGRADE PROTECTION: this option never replaces the brief package. */
  note: string;
};

/** Non-binding wording for every consultant development option. */
export const CONSULTANT_OPTION_NOTE =
  "Rekomendasi ini merupakan opsi pengembangan, bukan keharusan. Package pada Order Brief tetap mengikuti kebutuhan yang customer sampaikan. Opsi ini dapat dipertimbangkan apabila bisnis ingin berkembang atau jika membutuhkan pengelolaan yang lebih lanjut di kemudian hari.";

export type BriefInsight = {
  packageName: string;
  reason: string;
  included: string[];
  consultant: ConsultantOption | null;
  optional: { name: string; description: string; reason: string }[];
  disclaimer: string;
  nextSteps: string[];
};

export const OPTIONAL_DISCLAIMER =
  "Rekomendasi fitur tambahan merupakan hasil analisa kebutuhan bisnis Team KERJAKU dan dapat dikembangkan sesuai kebutuhan. Fitur ini bukan bagian dari scope utama sebelum dilakukan persetujuan lebih lanjut.";




const PACKAGE_RANK: Record<PackageKey, number> = {
  "Landing Page": 0,
  "Professional System": 1,
  "Digital Workflow Solution": 2,
  "Enterprise System": 3,
};

const PACKAGE_ORDER: PackageKey[] = [
  "Landing Page",
  "Professional System",
  "Digital Workflow Solution",
  "Enterprise System",
];

/** Customer-facing solution names used on the Order Brief document. */
const PACKAGE_LABEL: Record<PackageKey, string> = {
  "Landing Page": "Basic System",
  "Professional System": "Professional System",
  "Digital Workflow Solution": "Business System",
  "Enterprise System": "Enterprise System",
};

const PACKAGE_FIT: Record<PackageKey, string[]> = {
  "Landing Page": [
    "Website katalog / company profile",
    "Portfolio bisnis",
    "Komunikasi langsung via WhatsApp",
  ],
  "Professional System": [
    "Update konten mandiri",
    "Pengelolaan permintaan customer",
    "Pengembangan operasional bisnis",
    "Data bisnis lebih terstruktur",
  ],
  "Digital Workflow Solution": [
    "Digitalisasi proses operasional harian",
    "Transaksi dan pembayaran online",
    "Alur kerja team lebih rapi",
  ],
  "Enterprise System": [
    "Sistem terintegrasi antar divisi/cabang",
    "Kebutuhan data dan user berskala besar",
    "Integrasi dengan sistem lain",
  ],
};

function normalize(value: string) {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}

function hasAny(context: string, tokens: string[]) {
  return tokens.some((token) => context.includes(normalize(token)));
}

/**
 * PACKAGE LEVEL CONTROL RULE: Enterprise hanya dipertimbangkan jika skala bisnis
 * benar-benar besar (multi cabang, banyak divisi, banyak user, integrasi sistem).
 */
function enterpriseScaleJustified(brief: OrderBriefData, context: string): boolean {
  const scaleSignal = hasAny(context, [
    "multi cabang",
    "multi-cabang",
    "banyak cabang",
    "beberapa cabang",
    "multi lokasi",
    "banyak lokasi",
    "banyak divisi",
    "antar divisi",
    "franchise",
    "erp",
    "integrasi sistem",
    "api",
    "holding",
    "perusahaan besar",
  ]);
  const users = normalize(brief.usersScale ?? "");
  const bigUsers =
    /\b(50|100|200|500|1000)\b/.test(users) ||
    hasAny(users, ["lebih dari 100", "ratusan", "ribuan", "enterprise"]);
  return scaleSignal || bigUsers;
}

/**
 * Complexity ceiling derived only from the client's own brief.
 * Admin/dashboard needs alone never raise the ceiling.
 */
function complexityCeiling(context: string): PackageKey {
  const enterprise = hasAny(context, [
    "api",
    "integrasi sistem",
    "integration",
    "multi cabang",
    "multi-cabang",
    "erp",
    "enterprise",
  ]);
  if (enterprise) return "Enterprise System";


  const workflow = hasAny(context, [
    "payment gateway",
    "pembayaran online",
    "midtrans",
    "xendit",
    "order online",
    "checkout",
    "keranjang",
    "invoice",
    "tagihan",
    "billing",
    "kasir",
    "pos",
    "automation",
    "otomatis",
    "workflow",
    "login user",
    "akun user",
    "role",
  ]);
  if (workflow) return "Digital Workflow Solution";

  const professional = hasAny(context, [
    "crm",
    "lead",
    "follow up",
    "database customer",
    "data pelanggan",
    "booking",
    "reservasi",
    "member",
    "transaksi",
  ]);
  if (professional) return "Professional System";

  return "Landing Page";
}

function complexityLabel(pkg: PackageDefinition) {
  switch (pkg.key) {
    case "Landing Page":
      return "kebutuhan sistem yang masih sederhana dan fokus pada informasi bisnis";
    case "Professional System":
      return "kebutuhan pengelolaan data dan customer yang mulai berkembang";
    case "Digital Workflow Solution":
      return "kebutuhan digitalisasi proses operasional harian";
    default:
      return "kebutuhan sistem yang kompleks dan terintegrasi";
  }
}

function buildReason(brief: OrderBriefData, pkg: PackageDefinition) {
  const business = brief.business?.trim() || "bisnis Anda";
  const goal = brief.goal?.trim();
  const project = brief.project?.trim();
  const parts = [
    `Berdasarkan kebutuhan ${business}, website difokuskan untuk ${
      goal || project || "memperkenalkan bisnis dan memudahkan calon customer terhubung"
    }.`,
    `Rekomendasi solusi ${PACKAGE_LABEL[pkg.key]} dipilih karena ${complexityLabel(pkg)}${
      brief.usersScale?.trim() ? ` dengan cakupan pengguna ${brief.usersScale.trim()}` : ""
    }.`,
    "Rekomendasi ini mengikuti kebutuhan yang tertulis pada Order Brief tanpa menambah kompleksitas baru.",
  ];
  return parts.join(" ");
}




/**
 * TEAM KERJAKU CONSULTANT RECOMMENDATION.
 * Business insight + development option. Never changes the customer's own scope.
 */
function buildConsultantOption(
  brief: OrderBriefData,
  base: PackageKey,
  picks: ConsultantPick[],
  allowEnterprise: boolean,
): { option: ConsultantOption; ids: string[] } | null {
  if (!picks.length) return null;
  // PACKAGE LEVEL CONTROL RULE: opsi pengembangan maksimal satu tingkat, dan
  // tidak pernah menyentuh Enterprise untuk bisnis satu lokasi/skala kecil.
  const maxRank = allowEnterprise
    ? PACKAGE_ORDER.length - 1
    : PACKAGE_RANK["Digital Workflow Solution"];
  const upgradeIndex = Math.min(PACKAGE_RANK[base] + 1, maxRank);
  const upgradeKey = PACKAGE_ORDER[upgradeIndex]!;
  if (upgradeKey === base) return null;


  const name = brief.customerName?.trim() ? `Kak ${brief.customerName.trim()}` : "customer";
  const business = brief.business?.trim() || "bisnis Anda";

  return {
    ids: picks.map((item) => item.id),
    option: {
      packageName: PACKAGE_LABEL[upgradeKey],
      intro: [
        `Setelah melakukan analisa kebutuhan bisnis, Team KERJAKU melihat bahwa website ${business} masih dapat dikembangkan menjadi platform yang lebih mendukung operasional bisnis.`,
        `${PACKAGE_LABEL[base]} sudah memenuhi kebutuhan awal ${name}.`,
        `Namun apabila ${name} ingin website tidak hanya menjadi media informasi/katalog, tetapi juga membantu pengelolaan bisnis sehari-hari, Team KERJAKU memberikan opsi pengembangan ke ${PACKAGE_LABEL[upgradeKey]}.`,
      ],
      items: picks.map((item) => ({ title: item.name, benefit: item.benefit })),
      comparison: [
        { name: PACKAGE_LABEL[base], points: PACKAGE_FIT[base] },
        { name: PACKAGE_LABEL[upgradeKey], points: PACKAGE_FIT[upgradeKey] },
      ],
      note: CONSULTANT_OPTION_NOTE,
    },
  };
}



function buildNextSteps(base: string, upgrade: string | null) {
  const lines = [
    "Berdasarkan hasil konsultasi ini, Team KERJAKU akan menyiapkan penawaran berdasarkan opsi solusi berikut:",
    "",
    `1. ${base}`,
    "Sesuai dengan kebutuhan awal yang disampaikan customer.",
  ];
  if (upgrade) {
    lines.push(
      "",
      `2. ${upgrade}`,
      "Sebagai opsi pengembangan dengan fitur tambahan yang direkomendasikan Team KERJAKU.",
    );
  }
  lines.push(
    "",
    "Customer dapat memilih solusi yang paling sesuai dengan kebutuhan dan kesiapan bisnis saat ini.",
    "Penawaran harga akan disesuaikan dengan fitur yang dipilih, prioritas kebutuhan, serta budget yang telah disiapkan agar mendapatkan solusi digital yang paling optimal.",
    "Apabila ada fitur yang ingin ditambahkan, dikurangi, atau disesuaikan, customer dapat memberikan feedback melalui WhatsApp atau email.",
    "Terima kasih sudah mempercayakan pengembangan digital bisnis kepada Team KERJAKU.",
  );
  return lines;
}

export function buildBriefInsight(brief: OrderBriefData): BriefInsight {
  const context = normalize(
    [
      brief.business,
      brief.project,
      brief.goal,
      brief.adminNeeds,
      brief.usersScale,
      ...brief.features,
      ...brief.problems,
    ]
      .filter(Boolean)
      .join(" | "),
  );

  // Package: never above the complexity the brief actually justifies, and never
  // Enterprise unless the business scale itself justifies it.
  const allowEnterprise = enterpriseScaleJustified(brief, context);
  const requested = resolvePackage(brief.recommendation);
  const rawCeiling = complexityCeiling(context);
  const ceilingKey: PackageKey =
    rawCeiling === "Enterprise System" && !allowEnterprise
      ? "Digital Workflow Solution"
      : rawCeiling;
  const pkg =
    PACKAGE_RANK[requested.key] > PACKAGE_RANK[ceilingKey]
      ? resolvePackage(ceilingKey)
      : requested;


  // ORDER BRIEF FEATURE PROTECTION: included scope = the client's own feature
  // list, verbatim. Package defaults never enter the scope.
  const included = briefIncludedFeatures(brief.features);
  const coreIds = new Set<string>(briefCoveredFeatureIds(brief.features));

  // BUSINESS FEATURE CONSULTANT LIBRARY: analisa jenis bisnis, masalah, tujuan,
  // jumlah user, dan proses operasional — bukan generator fitur.
  const businessText = [brief.business, brief.project].filter(Boolean).join(" ");
  const maxTier: ConsultantTier =
    pkg.key === "Enterprise System"
      ? "enterprise"
      : pkg.key === "Digital Workflow Solution"
        ? "business"
        : pkg.key === "Professional System"
          ? "business"
          : "professional";

  const picks = selectConsultantFeatures({
    businessText,
    context,
    // BUSINESS FEATURE VALIDATION RULE poin 3: fitur harus mengurangi masalah.
    problemText: normalize(brief.problems.join(" | ")),
    // SCALE RULE: skala pengguna + kebutuhan admin/team menentukan fitur bertim.
    scaleText: [brief.usersScale, brief.adminNeeds].filter(Boolean).join(" | "),
    maxTier,
    excludeIds: [...coreIds],
    excludeTitles: included,
    limit: 7,
  });


  // CONSULTANT / POTENTIAL SPLIT RULE: 1-2 ide relevan cukup masuk ke
  // Consultant Recommendation; sisanya baru menjadi Potential Feature.
  const consultantPicks = picks.length <= 2 ? picks : picks.slice(0, 4);
  const leftover = picks.length <= 2 ? [] : picks.slice(4, 7);

  // FEATURE PLACEMENT RULE: consultant recommendation is built first, so its
  // features are never repeated inside Potential Feature Recommendation.
  const built = buildConsultantOption(brief, pkg.key, consultantPicks, allowEnterprise);
  const consultant = built?.option ?? null;
  const consultantTitles = (consultant?.items ?? []).map((item) => normalize(item.title));

  let optional = (consultant ? leftover : picks.slice(0, 3)).map((f) => ({
    name: f.name,
    description: f.fn,
    reason: f.benefit,
  }));

  // POTENTIAL FEATURE LIMIT RULE: a single leftover idea is folded into the
  // consultant option instead of creating a nearly empty section.
  if (optional.length === 1 && consultant) {
    consultant.items.push({
      title: optional[0]!.name,
      benefit: optional[0]!.reason,
      optional: true,
    });
    optional = [];
  }


  return {
    packageName: PACKAGE_LABEL[pkg.key],
    reason: buildReason(brief, pkg),
    included,
    consultant,
    optional,
    disclaimer: OPTIONAL_DISCLAIMER,
    nextSteps: buildNextSteps(PACKAGE_LABEL[pkg.key], consultant?.packageName ?? null),
  };
}

