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
  consultantCoveredFeatureIds,
  selectConsultantFeatures,
  type ConsultantPick,
  type ConsultantTier,
} from "./admin/consultant-library";
import {
  decidePackageLevel,
  type PackageLevel,
} from "./admin/package-decision-sop";
import type { OrderBriefData } from "./order-brief";

function normalize(value: string) {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}



export type ConsultantOption = {
  packageName: string;
  intro: string[];
  items: { title: string; benefit: string; optional?: boolean; solves?: string | null }[];
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

/** Customer-facing solution names used on the Order Brief document. */
const PACKAGE_LABEL: Record<PackageKey, string> = {
  "Landing Page": "Basic System",
  "Professional System": "Professional System",
  "Digital Workflow Solution": "Business System",
  "Enterprise System": "Enterprise System",
};

/**
 * KERJAKU PACKAGE DECISION SOP.
 * Level package berasal dari `decidePackageLevel` (satu sumber aturan), bukan
 * dari jumlah fitur pada brief.
 */
const LEVEL_TO_PACKAGE: Record<PackageLevel, PackageKey> = {
  basic: "Landing Page",
  professional: "Professional System",
  business: "Digital Workflow Solution",
  enterprise: "Enterprise System",
};

const LEVEL_TO_TIER: Record<PackageLevel, ConsultantTier> = {
  basic: "basic",
  professional: "professional",
  business: "business",
  enterprise: "enterprise",
};



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

function buildReason(brief: OrderBriefData, pkg: PackageDefinition, rationale: string) {
  const business = brief.business?.trim() || "bisnis Anda";
  const goal = brief.goal?.trim();
  const project = brief.project?.trim();
  const focus = (goal || project || "memperkenalkan bisnis dan memudahkan calon customer terhubung")
    .replace(/[.!?]+$/, "");
  const parts = [
    `Berdasarkan kebutuhan ${business}, website difokuskan untuk ${focus}.`,
    `Rekomendasi solusi ${PACKAGE_LABEL[pkg.key]} dipilih karena ${complexityLabel(pkg)}.`,
    // KERJAKU PACKAGE DECISION SOP: alasan berbasis kompleksitas bisnis.
    rationale,
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
): { option: ConsultantOption; ids: string[] } | null {
  if (!picks.length) return null;
  // CORE / GROWTH SPLIT RULE: bahasa berbeda saat fitur menyelesaikan masalah.
  const hasCore = picks.some((item) => item.role === "core");
  // PACKAGE INDEPENDENCE RULE: consultant ideas refine scope; they never
  // increase the package. Package level is decided only by business scale and
  // operational complexity.
  const upgradeKey = base;
  const sameLevel = true;


  const name = brief.customerName?.trim() ? `Kak ${brief.customerName.trim()}` : "customer";
  const business = brief.business?.trim() || "bisnis Anda";

  return {
    ids: picks.map((item) => item.id),
    option: {
      packageName: PACKAGE_LABEL[upgradeKey],
      intro: hasCore
        ? [
            `Dari masalah yang ${name} sampaikan, Team KERJAKU melihat ada beberapa bagian operasional ${business} yang paling terasa dampaknya bila dibantu sistem.`,
            `Fitur berikut dipilih karena langsung menjawab masalah tersebut, bukan sekadar menambah fitur.`,
            sameLevel
              ? `${PACKAGE_LABEL[base]} pada Order Brief sudah cukup untuk menjalankan fitur-fitur ini, jadi tidak perlu menaikkan level solusi.`
              : `${PACKAGE_LABEL[base]} tetap menjadi acuan Order Brief; pengerjaan fitur di bawah ini dapat menyesuaikan ke ${PACKAGE_LABEL[upgradeKey]} apabila dibutuhkan.`,
          ]
        : [
            `Feature List ${name} sudah mencakup solusi utama untuk masalah pencatatan project, portfolio, FAQ, dan update progress yang disampaikan.`,
            `Karena kebutuhan inti sudah ter-cover, Team KERJAKU tidak menambahkan Core Solution baru dan tidak mengulang fitur yang sama.`,
            `Pengembangan berikut hanya berupa penyempurnaan alur ${business} di dalam ${PACKAGE_LABEL[base]} yang sama.`,
          ],
      items: picks.map((item) => ({
        title: item.name,
        benefit: item.benefit,
        solves: item.solves,
      })),
      comparison: [],
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
  if (upgrade && normalize(upgrade) !== normalize(base)) {
    lines.push(
      "",
      `2. ${upgrade}`,
      "Sebagai opsi pengembangan dengan fitur tambahan yang direkomendasikan Team KERJAKU.",
    );
  } else if (upgrade) {
    lines.push(
      "Fitur yang disepakati akan dirapikan sebagai penyesuaian scope pada solusi yang sama, tanpa membuat opsi package kedua.",
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

  // KERJAKU PACKAGE DECISION SOP: level ditentukan oleh kompleksitas bisnis.
  const decision = decidePackageLevel(brief, context);
  const allowEnterprise = decision.allowEnterprise;
  const requested = resolvePackage(brief.recommendation);
  const ceilingKey: PackageKey = LEVEL_TO_PACKAGE[decision.level];
  // Tanpa rekomendasi eksplisit pada brief, level SOP yang dipakai. Bila ada,
  // package tidak boleh melebihi level SOP.
  const pkg = !brief.recommendation?.trim()
    ? resolvePackage(ceilingKey)
    : PACKAGE_RANK[requested.key] > PACKAGE_RANK[ceilingKey]
      ? resolvePackage(ceilingKey)
      : requested;


  // ORDER BRIEF FEATURE PROTECTION: included scope = the client's own feature
  // list, verbatim. Package defaults never enter the scope.
  const included = briefIncludedFeatures(brief.features);
  const coreIds = new Set<string>([
    ...briefCoveredFeatureIds(brief.features),
    ...consultantCoveredFeatureIds(brief.features.join(" | ")),
  ]);

  // BUSINESS FEATURE CONSULTANT LIBRARY: analisa jenis bisnis, masalah, tujuan,
  // jumlah user, dan proses operasional — bukan generator fitur.
  const businessText = [brief.business, brief.project].filter(Boolean).join(" ");
  const maxTier: ConsultantTier = LEVEL_TO_TIER[decision.level];



  const picks = selectConsultantFeatures({
    businessText,
    context,
    // CORE / GROWTH SPLIT RULE: tujuan sistem ikut dibaca sebagai masalah.
    goalText: brief.goal ?? "",
    // BUSINESS FEATURE VALIDATION RULE poin 3: fitur harus mengurangi masalah.
    problemText: normalize(brief.problems.join(" | ")),
    // SCALE RULE: skala pengguna + kebutuhan admin/team menentukan fitur bertim.
    scaleText: [brief.usersScale, brief.adminNeeds].filter(Boolean).join(" | "),
    maxTier,
    // PACKAGE LEVEL CONTROL RULE: fitur enterprise hanya bila skala organisasi
    // benar-benar kompleks (multi cabang, struktur berjenjang, user besar).
    allowEnterprise,

    // DUPLICATE PREVENTION RULE: fitur pada brief tidak direkomendasikan ulang.
    briefFeatureText: brief.features.join(" | "),
    excludeIds: [...coreIds],
    excludeTitles: included,
    limit: 7,

  });


  // CORE / GROWTH SPLIT RULE:
  // - Consultant Recommendation = fitur yang menyelesaikan masalah customer.
  // - Potential Feature = pengembangan setelah masalah utama selesai.
  const corePicks = picks.filter((p) => p.role === "core").slice(0, 4);
  const growthPicks = picks.filter((p) => p.role === "growth");
  const consultantPicks = corePicks.length ? corePicks : growthPicks.slice(0, 2);
  const leftover = corePicks.length ? growthPicks.slice(0, 3) : growthPicks.slice(2, 5);

  // FEATURE PLACEMENT RULE: consultant recommendation is built first, so its
  // features are never repeated inside Potential Feature Recommendation.
  const built = buildConsultantOption(brief, pkg.key, consultantPicks);
  const consultant = built?.option ?? null;
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
    reason: buildReason(brief, pkg, decision.rationale),
    included,
    consultant,
    optional,
    disclaimer: OPTIONAL_DISCLAIMER,
    nextSteps: buildNextSteps(PACKAGE_LABEL[pkg.key], consultant?.packageName ?? null),
  };
}

