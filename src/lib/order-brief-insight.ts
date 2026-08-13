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
  consultantFeature,
  detectBusinessMaturity,
  selectConsultantFeatures,
  type BusinessMaturity,
  type ConsultantPick,
  type ConsultantTier,
} from "./admin/consultant-library";
import { buildProblemSolutionPlan } from "./admin/problem-solution-map";
import {
  decidePackageLevel,
  type PackageLevel,
} from "./admin/package-decision-sop";
import type { OrderBriefData } from "./order-brief";

function normalize(value: string) {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}

/** DATA INTEGRITY: kebutuhan admin/team kadang hanya tertulis di narasi brief. */
export function resolveAdminNeeds(brief: OrderBriefData): string {
  const direct = brief.adminNeeds?.trim();
  if (direct && direct !== "-") return direct;
  const source = [brief.project, brief.goal].filter(Boolean).join("\n");
  const match = source.match(/kebutuhan\s+admin(?:\s*\/\s*team)?\s*:\s*([^\n]+)/i);
  if (match?.[1]?.trim()) return match[1].trim();
  return "Belum disampaikan saat konsultasi awal";
}

/** Rapikan kalimat tujuan agar ALASAN tidak menyalin ulang Project Summary. */
function focusPhrase(brief: OrderBriefData): string {
  const raw = (brief.goal?.trim() || brief.project?.trim() || "").replace(/\s+/g, " ");
  if (!raw) return "merapikan kebutuhan digital bisnis";
  let text = raw
    .replace(/^tujuan\s*:\s*/i, "")
    .replace(/kebutuhan\s+admin.*$/i, "")
    .trim();
  // Buang klausa pembuka "Kak X pemilik Y membutuhkan ..." agar langsung ke inti.
  const after = text.match(/\b(?:membutuhkan|memerlukan|ingin|butuh)\s+(.+)$/i);
  if (after?.[1]) text = after[1];
  text = text.split(/\.\s+/)[0]!.replace(/[.!?]+$/, "").trim();
  if (text.length > 150) {
    const cut = text.slice(0, 150);
    text = `${cut.slice(0, cut.lastIndexOf(" "))}`;
  }
  if (!text) return "merapikan kebutuhan digital bisnis";
  return text.charAt(0).toLowerCase() + text.slice(1);
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

export type ProblemMapRow = {
  problem: string;
  solution: string;
  /** Dari mana solusi berasal: scope customer, core solution, atau opsional. */
  source: "scope" | "core" | "optional" | "open";
};

export type BriefInsight = {
  packageName: string;
  reason: string;
  included: string[];
  consultant: ConsultantOption | null;
  /** PROBLEM -> SOLUTION MAP: bukti setiap masalah customer ada jawabannya. */
  problemMap: ProblemMapRow[];
  /** Ringkasan kesiapan bisnis (maturity + catatan singkat). */
  readiness: { level: string; lines: string[] };
  optional: {
    name: string;
    description: string;
    reason: string;
    impact?: string;
    relation?: string | null;
    /** Urutan prioritas pengembangan (1 = paling berdampak). */
    priority: number;
    /** Fase 1 = dapat dikerjakan bersamaan, Fase 2 = pengembangan lanjutan. */
    phase: 1 | 2;
  }[];

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
  // ALASAN PACKAGE: tiga kalimat saja — kebutuhan bisnis, karakter proses, dan
  // skala pengguna. Project Summary tidak disalin ulang di sini.
  const focus = focusPhrase(brief);
  const scale = brief.usersScale?.trim();
  const parts = [
    `Kebutuhan ${business} difokuskan untuk ${focus}.`,
    `Solusi ${PACKAGE_LABEL[pkg.key]} dipilih karena ${complexityLabel(pkg)}.`,
    scale ? `Cakupan pengguna sistem: ${scale}.` : rationale,
  ];
  return parts.join("\n\n");
}

const MATURITY_LABEL: Record<BusinessMaturity, string> = {
  starter: "Tahap Awal (Starter)",
  growing: "Tahap Berkembang (Growing)",
  established: "Tahap Mapan (Established)",
};

/** BUSINESS READINESS: ringkas, 2-3 kalimat, tanpa menambah halaman baru. */
function buildReadiness(
  brief: OrderBriefData,
  maturity: BusinessMaturity,
  packageName: string,
): { level: string; lines: string[] } {
  const business = brief.business?.trim() || "Bisnis Anda";
  const scale = brief.usersScale?.trim();
  const lines = [
    maturity === "starter"
      ? `${business} berada pada tahap membangun fondasi digital, sehingga prioritasnya adalah kejelasan informasi dan kemudahan customer menghubungi bisnis.`
      : maturity === "growing"
        ? `${business} sudah memiliki alur kerja berjalan, sehingga prioritasnya adalah merapikan pencatatan dan komunikasi progress agar tidak lagi manual.`
        : `${business} sudah berjalan dengan volume dan tim yang cukup besar, sehingga prioritasnya adalah kontrol data dan visibilitas owner.`,
    `Dengan kondisi tersebut, ${packageName} sudah cukup untuk menopang kebutuhan saat ini tanpa membebani biaya di awal.`,
  ];
  if (scale) lines.push(`Skala pengguna yang disampaikan: ${scale}.`);
  return { level: MATURITY_LABEL[maturity], lines };
}

/**
 * PROBLEM -> SOLUTION MAP: setiap masalah pada brief dipasangkan dengan solusi
 * yang sudah ada di scope customer, Core Solution, atau ide opsional.
 */
function buildProblemMap(input: {
  brief: OrderBriefData;
  scopeIds: Set<string>;
  corePicks: ConsultantPick[];
  growthPicks: ConsultantPick[];
}): ProblemMapRow[] {
  const { brief, scopeIds, corePicks, growthPicks } = input;
  const coreById = new Map(corePicks.map((p) => [p.id, p.name] as const));
  const growthById = new Map(growthPicks.map((p) => [p.id, p.name] as const));

  return brief.problems
    .map((problem) => {
      const plan = buildProblemSolutionPlan({
        businessText: [brief.business, brief.project].filter(Boolean).join(" "),
        problemText: normalize(problem),
        goalText: "",
        context: normalize(problem),
      });
      const ids = [...plan.core.keys()];
      const scoped = ids.filter((id) => scopeIds.has(id));
      if (scoped.length) {
        return {
          problem,
          solution: scoped
            .map((id) => consultantFeature(id)?.name ?? id)
            .slice(0, 2)
            .join(" + "),
          source: "scope" as const,
        };
      }
      const core = ids.find((id) => coreById.has(id));
      if (core) {
        return { problem, solution: coreById.get(core)!, source: "core" as const };
      }
      const growth = ids.find((id) => growthById.has(id));
      if (growth) {
        return { problem, solution: growthById.get(growth)!, source: "optional" as const };
      }
      // Fallback kata kunci: masalah yang sudah dijawab langsung oleh fitur
      // pilihan customer (mis. "belum punya website portfolio" -> Portfolio).
      const words = new Set(
        normalize(problem)
          .split(/[^a-z0-9]+/)
          .filter((w) => w.length > 4),
      );
      const matched = brief.features.find((feature) =>
        normalize(feature)
          .split(/[^a-z0-9]+/)
          .some((w) => w.length > 4 && words.has(w)),
      );
      if (matched) return { problem, solution: matched, source: "scope" as const };
      return {
        problem,
        solution: "Dibahas pada tahap pengecekan kebutuhan bersama Team KERJAKU",
        source: "open" as const,
      };
    })
    .slice(0, 8);
}

/** Kalimat relevansi ditulis ulang agar spesifik ke bisnis customer. */
function humanizeRelevance(raw: string, business: string): string {
  const text = raw.trim();
  const flow = text.match(/^memperbaiki alur bisnis\s+(.+?)\.?$/i);
  if (flow?.[1]) {
    return `Sesuai karakter alur bisnis ${flow[1].toLowerCase()} yang dijalankan ${business}.`;
  }
  if (/kondisi bisnis pada brief/i.test(text)) {
    return `Kebutuhan ini muncul dari cara kerja ${business} yang dijelaskan pada brief.`;
  }
  if (/proses operasional utama pada brief/i.test(text)) {
    return `Menyentuh proses operasional harian ${business} yang disebut pada brief.`;
  }
  return text;
}








/**
 * TEAM KERJAKU CONSULTANT RECOMMENDATION.
 * Business insight + development option. Never changes the customer's own scope.
 */
function buildConsultantOption(
  brief: OrderBriefData,
  base: PackageKey,
  picks: ConsultantPick[],
  hasPotential = false,
): { option: ConsultantOption; ids: string[] } | null {
  // Tanpa Core Solution, blok ini hanya berisi validasi scope — dan hanya
  // ditampilkan bila ada Potential Feature yang menyusul.
  if (!picks.length && !hasPotential) return null;
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
            `Feature List ${name} sudah mencakup solusi utama untuk masalah bisnis yang disampaikan.`,
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
    `Solusi yang menjadi acuan penawaran: ${base}, sesuai kebutuhan yang customer sampaikan.`,
    "",
    "1. Konfirmasi Order Brief (customer)",
    "Cek kembali daftar masalah dan fitur di atas, lalu informasikan bila ada yang perlu ditambah, dikurangi, atau disesuaikan.",
    "",
    "2. Pengecekan kebutuhan (Team KERJAKU)",
    "Tim kami mengunci scope final, prioritas pengerjaan, dan estimasi waktu berdasarkan brief yang sudah dikonfirmasi.",
    "",
    "3. Penawaran harga (Team KERJAKU)",
    "Penawaran disusun mengikuti scope final dan budget yang sudah disiapkan, terpisah antara kebutuhan utama dan fitur opsional.",
  ];
  if (upgrade && normalize(upgrade) !== normalize(base)) {
    lines.push(
      "",
      `Opsi pengembangan ${upgrade} dapat dipertimbangkan bila customer ingin cakupan yang lebih luas.`,
    );
  }
  lines.push(
    "",
    "Konfirmasi dan pertanyaan dapat disampaikan melalui WhatsApp atau email.",
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
  const maturity = detectBusinessMaturity({
    context,
    problemText: normalize(brief.problems.join(" | ")),
    scaleText: [brief.usersScale, brief.adminNeeds].filter(Boolean).join(" | "),
  });




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
    limit: 12,

  });


  // CORE / GROWTH SPLIT RULE:
  // - Consultant Recommendation = fitur yang menyelesaikan masalah customer.
  // - Potential Feature = pengembangan setelah masalah utama selesai.
  const corePicks = picks.filter((p) => p.role === "core").slice(0, 4);
  const growthPicks = picks.filter((p) => p.role === "growth");

  // POTENTIAL FEATURE QUOTA: maksimal 5 untuk Business System ke atas,
  // maksimal 3 untuk level di bawahnya. Tidak ada pengisian paksa.
  const potentialLimit = PACKAGE_RANK[pkg.key] >= 2 ? 5 : 3;

  // FEATURE PLACEMENT RULE: consultant recommendation is built first, so its
  // features are never repeated inside Potential Feature Recommendation.
  const built = buildConsultantOption(brief, pkg.key, corePicks, growthPicks.length > 0);
  const consultant = built?.option ?? null;
  const businessLabel = brief.business?.trim() || "bisnis Anda";
  const optional = growthPicks.slice(0, potentialLimit).map((f, index) => {
    const relation = f.relatedTo
      ? f.relation === "enhancement"
        ? `Memperkuat ${f.relatedTo} pada scope customer.`
        : `Kelanjutan alur bisnis setelah ${f.relatedTo}.`
      : null;
    // ANTI-DUPLIKASI KALIMAT: alasan relevansi tidak boleh mengulang Kaitan.
    const raw =
      f.reasons.find(
        (line) => !/^memperkuat |^melanjutkan alur/i.test(line) && line !== relation,
      ) ??
      f.reasons[0] ??
      f.benefit;
    return {
      name: f.name,
      description: f.fn,
      reason: humanizeRelevance(raw, businessLabel),
      impact: f.benefit,
      relation,
      priority: index + 1,
      phase: (index < 2 ? 1 : 2) as 1 | 2,
    };
  });


  const readiness = buildReadiness(brief, maturity, PACKAGE_LABEL[pkg.key]);
  const problemMap = buildProblemMap({
    brief,
    scopeIds: new Set(consultantCoveredFeatureIds(brief.features.join(" | "))),
    corePicks,
    growthPicks: growthPicks.slice(0, potentialLimit),
  });

  return {
    packageName: PACKAGE_LABEL[pkg.key],
    reason: buildReason(brief, pkg, decision.rationale),
    included,
    consultant,
    problemMap,
    readiness,
    optional,
    disclaimer: OPTIONAL_DISCLAIMER,
    nextSteps: buildNextSteps(PACKAGE_LABEL[pkg.key], consultant?.packageName ?? null),
  };
}


