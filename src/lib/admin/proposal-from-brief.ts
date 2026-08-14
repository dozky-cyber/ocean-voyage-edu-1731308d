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

  return dedupeEnhancements([...consultantCore, ...optional]).map((item, index) => ({
    ...item,
    priority: index + 1,
  }));
}

/** Kata isi (tanpa kata umum) untuk mengukur kemiripan manfaat antar fitur. */
const STOP_WORDS = new Set([
  "yang","untuk","dan","dengan","pada","dari","agar","bisa","dapat","tidak","ini","itu","ke","di",
  "customer","client","pelanggan","bisnis","usaha","sistem","fitur","setiap","saat","tanpa","lebih",
  "sudah","masih","akan","oleh","dalam","atau","juga","semua","satu","secara","harus",
]);

function contentWords(text: string) {
  return new Set(
    normalize(text)
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length > 3 && !STOP_WORDS.has(w)),
  );
}

function benefitOverlap(a: string, b: string) {
  const left = contentWords(a);
  const right = contentWords(b);
  if (!left.size || !right.size) return 0;
  let shared = 0;
  left.forEach((word) => {
    if (right.has(word)) shared += 1;
  });
  return shared / Math.min(left.size, right.size);
}

/**
 * ANTI-OVERLAP: dua rekomendasi dengan manfaat yang pada dasarnya sama
 * (mis. Riwayat Project vs Database Customer bila kalimatnya bertabrakan)
 * membingungkan customer. Yang berprioritas lebih tinggi dipertahankan.
 */
export function dedupeEnhancements(items: EnhancementItem[]): EnhancementItem[] {
  const kept: EnhancementItem[] = [];
  for (const item of items) {
    const key = normalize(item.name);
    const libId = consultantFeatureByText(item.name)?.id ?? null;
    const words = new Set(key.split(" "));
    const clash = kept.find((other) => {
      const otherKey = normalize(other.name);
      if (otherKey === key) return true;
      // Nama yang saling memuat (mis. "Riwayat Project" vs "Riwayat Project
      // Customer") adalah fitur yang sama di mata customer.
      const otherWords = new Set(otherKey.split(" "));
      const smaller = words.size <= otherWords.size ? words : otherWords;
      const larger = smaller === words ? otherWords : words;
      let shared = 0;
      smaller.forEach((w) => {
        if (larger.has(w)) shared += 1;
      });
      if (smaller.size && shared === smaller.size) return true;
      const otherId = consultantFeatureByText(other.name)?.id ?? null;
      if (libId && otherId && libId === otherId) return true;
      const textA = `${item.benefit} ${item.reason ?? ""} ${item.impact ?? ""}`;
      const textB = `${other.benefit} ${other.reason ?? ""} ${other.impact ?? ""}`;
      return benefitOverlap(textA, textB) >= 0.7;
    });
    if (!clash) kept.push(item);
  }
  return kept;
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

/** Nama fitur yang saling memuat dianggap satu item oleh customer. */
function dedupeNames(names: string[]): string[] {
  const kept: string[] = [];
  for (const name of names) {
    const words = new Set(normalize(name).split(" "));
    const clash = kept.some((other) => {
      const otherWords = new Set(normalize(other).split(" "));
      const smaller = words.size <= otherWords.size ? words : otherWords;
      const larger = smaller === words ? otherWords : words;
      let shared = 0;
      smaller.forEach((w) => {
        if (larger.has(w)) shared += 1;
      });
      return smaller.size > 0 && shared === smaller.size;
    });
    if (!clash) kept.push(name);
  }
  return kept;
}

/**
 * REKOMENDASI IMPLEMENTASI BERTAHAP — alasan utamanya hasil analisa kebutuhan
 * bisnis, bukan angka budget. Angka budget hanya disebut sebagai konteks.
 */
export function budgetAlignmentFromBrief(
  brief: OrderBriefData,
  insight: BriefInsight,
  basePrice?: number,
): string {
  void basePrice;
  const industry = detectIndustryContext(
    [brief.business, brief.project].filter(Boolean).join(" "),
    normalize(
      [brief.business, brief.project, brief.goal, ...brief.features, ...brief.problems]
        .filter(Boolean)
        .join(" | "),
    ),
  );
  const job = industry?.jobTerm || "pekerjaan";
  const customer = industry?.customerTerm || "customer";
  const business = brief.business?.trim() || "bisnis Anda";

  const early = dedupeNames(insight.included).slice(0, 4);
  const later = dedupeNames([
    ...dedupeNames(insight.included).slice(4),
    ...insight.optional.map((item) => item.name),
  ]).slice(0, 5);

  const body: string[] = [
    "Berdasarkan hasil analisa kebutuhan bisnis, KERJAKU menyarankan implementasi dilakukan secara bertahap agar sistem dapat dibangun sesuai prioritas utama dan kebutuhan operasional.",
  ];

  if (early.length) {
    body.push(
      "",
      "Tahap Awal",
      "Fokus pada fitur yang menjadi kebutuhan utama bisnis:",
      ...early.map((name) => `- ${solutionLabel(name)}`),
      "",
      "Tujuan:",
      `Membangun pondasi digital agar ${customer} lebih mudah mengenal ${business} dan owner dapat mengelola informasi ${job} dengan lebih rapi.`,
    );
  }

  if (later.length) {
    body.push(
      "",
      "Tahap Pengembangan",
      "Setelah sistem utama berjalan, beberapa pengembangan dapat dilanjutkan:",
      ...later.map((name) => `- ${solutionLabel(name)}`),
      "",
      "Tujuan:",
      `Meningkatkan pengalaman ${customer} dan efisiensi pengelolaan ${job} sehari-hari.`,
    );
  }

  const budget = brief.budget?.trim();
  if (budget) {
    body.push(
      "",
      `Sebagai konteks, range budget yang Anda sampaikan pada sesi konsultasi: ${budget}. Angka pada halaman Investment mengikuti kebutuhan yang tercatat pada Final Order Brief; bila perlu disesuaikan, yang diatur adalah urutan pengerjaan, bukan memangkas kebutuhan inti.`,
    );
  }

  return body.join("\n");
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
  const mapIndustry = detectIndustryContext(
    [brief.business, brief.project].filter(Boolean).join(" "),
    normalize(
      [brief.business, brief.project, brief.goal, ...brief.features, ...brief.problems]
        .filter(Boolean)
        .join(" | "),
    ),
  );
  // MAPPING NARATIF: setiap masalah ditulis sebagai kalimat kondisi bisnis,
  // lalu solusinya disebut dengan nama yang dipahami customer.
  const mapBlocks = insight.problemMap.map((row) => {
    const key = normalize(row.solution);
    const parts = row.solution.split(" + ").map((p) => p.trim());
    const inScope =
      scopeNames.has(key) || (parts.length > 1 && parts.every((p) => scopeNames.has(normalize(p))));
    const option = optionNames.get(key);

    let solution: string;
    if (inScope) {
      solution = parts.map((p) => solutionLabel(p)).join(" + ");
    } else if (option) {
      solution = `${solutionLabel(option)} — rekomendasi pengembangan, di luar scope utama`;
    } else {
      solution = "Dibahas bersama Anda sebelum pengerjaan dimulai";
    }

    return ["Kondisi:", conditionSentence(row.problem, mapIndustry), "", "Solusi:", solution].join("\n");
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
      // Bahasa customer-oriented, tanpa istilah internal.
      body: bullets([
        "Review proposal dan prioritas fitur",
        "Finalisasi scope pengerjaan",
        "Persetujuan penawaran",
        "Kick-off project",
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
