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
  FEATURE_LIBRARY,
  briefCoveredFeatureIds,
  briefIncludedFeatures,
  detectSelectedFeatures,
  resolvePackage,
  type LibraryFeature,
  type PackageDefinition,
  type PackageKey,
} from "./admin/feature-library";
import type { OrderBriefData } from "./order-brief";

export type ConsultantOption = {
  packageName: string;
  intro: string[];
  items: { title: string; benefit: string; optional?: boolean }[];
  comparison: { name: string; points: string[] }[];
};

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

/** Features that may only appear when the brief explicitly asks for them. */
const RESTRICTED_FEATURE_IDS = new Set([
  "api",
  "payment-gateway",
  "order-online",
  "invoice-system",
  "crm",
  "notification",
  "login-user",
  "dashboard-admin",
  "custom",
]);

/** Low-complexity features that are safe to suggest for most businesses. */
const SAFE_OPTIONAL_IDS = [
  "social-media",
  "maps",
  "download-dokumen",
  "form-konsultasi",
  "database-customer",
  "request-quotation",
  "booking",
  "katalog",
  "live-chat",
  "email",
  "whatsapp",
  "contact-form",
];

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

function describeFeature(feature: LibraryFeature, brief: OrderBriefData) {
  const business = brief.business?.trim() || "bisnis Anda";
  return `${feature.description} Membantu ${business} mengembangkan proses ini secara lebih terstruktur.`;
}

function optionalReason(feature: LibraryFeature, brief: OrderBriefData) {
  const business = brief.business?.trim() || "bisnis Anda";
  switch (feature.id) {
    case "social-media":
      return `Membantu calon client melihat aktivitas dan kredibilitas ${business} melalui sosial media.`;
    case "database-customer":
      return "Membantu pengelolaan data customer/kontak agar pencarian dan follow up lebih mudah.";
    case "booking":
      return "Memudahkan customer mengirim kebutuhan atau memesan jadwal secara lebih terstruktur.";
    case "form-konsultasi":
      return "Memudahkan calon customer mengirim kebutuhan awal secara lebih rapi.";
    case "request-quotation":
      return "Memudahkan calon customer meminta penawaran tanpa proses manual bolak-balik.";
    case "download-dokumen":
      return "Membantu calon customer mendapatkan company profile atau katalog secara mandiri.";
    case "maps":
      return "Membantu customer menemukan lokasi bisnis dengan cepat.";
    case "katalog":
      return "Membantu menampilkan produk atau layanan secara lebih lengkap dan rapi.";
    case "live-chat":
      return "Membantu merespon pertanyaan calon customer lebih cepat langsung dari website.";
    default:
      return `Relevan dengan kebutuhan ${business} pada Order Brief dan dapat dikembangkan bertahap.`;
  }
}

/**
 * TEAM KERJAKU CONSULTANT RECOMMENDATION.
 * Business insight + development option. Never changes the customer's own scope.
 */
function buildConsultantOption(
  brief: OrderBriefData,
  base: PackageKey,
  coveredIds: Set<string>,
): { option: ConsultantOption; ids: string[] } | null {
  const upgradeKey = PACKAGE_ORDER[Math.min(PACKAGE_RANK[base] + 1, PACKAGE_ORDER.length - 1)]!;
  if (upgradeKey === base) return null;

  const name = brief.customerName?.trim() ? `Kak ${brief.customerName.trim()}` : "customer";
  const business = brief.business?.trim() || "bisnis Anda";

  const pool: { id: string; title: string; benefit: string; optional?: boolean }[] = [
    {
      id: "dashboard-admin",
      title: "Dashboard Admin / Content Management",
      benefit: `Dapat memperbarui konten, foto, dan portfolio terbaru ${business} secara mandiri tanpa perlu meminta perubahan setiap kali ada update.`,
    },
    {
      id: "booking",
      title: "Booking / Reservasi",
      benefit:
        "Membantu customer mengirim kebutuhan berdasarkan tanggal atau jadwal acara secara lebih terstruktur.",
    },
    {
      id: "social-media",
      title: "Social Media Integration",
      benefit:
        "Membantu calon customer melihat aktivitas terbaru dan meningkatkan kepercayaan sebelum melakukan pemesanan.",
    },
    {
      id: "database-customer",
      title: "Database Customer / Riwayat Pesanan",
      benefit:
        "Membantu menyimpan data customer dan riwayat pemesanan untuk kebutuhan follow up dan pelayanan pelanggan.",
      optional: true,
    },
    {
      id: "reporting",
      title: "Laporan Penjualan Sederhana",
      benefit:
        "Membantu owner mengetahui jumlah transaksi dan pemasukan harian tanpa membuat sistem laporan yang kompleks.",
      optional: true,
    },
  ];

  const picked = pool.filter((item) => !coveredIds.has(item.id)).slice(0, 5);
  if (!picked.length) return null;

  return {
    ids: picked.map((item) => item.id),
    option: {
      packageName: PACKAGE_LABEL[upgradeKey],
      intro: [
        `Setelah melakukan analisa kebutuhan bisnis, Team KERJAKU melihat bahwa website ${business} masih dapat dikembangkan menjadi platform yang lebih mendukung operasional bisnis.`,
        `${PACKAGE_LABEL[base]} sudah memenuhi kebutuhan awal ${name}.`,
        `Namun apabila ${name} ingin website tidak hanya menjadi media informasi/katalog, tetapi juga membantu pengelolaan bisnis sehari-hari, Team KERJAKU memberikan opsi pengembangan ke ${PACKAGE_LABEL[upgradeKey]}.`,
      ],
      items: picked.map(({ id: _id, ...rest }) => rest),
      comparison: [
        { name: PACKAGE_LABEL[base], points: PACKAGE_FIT[base] },
        { name: PACKAGE_LABEL[upgradeKey], points: PACKAGE_FIT[upgradeKey] },
      ],
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

  // Package: never above the complexity the brief actually justifies.
  const requested = resolvePackage(brief.recommendation);
  const ceilingKey = complexityCeiling(context);
  const pkg =
    PACKAGE_RANK[requested.key] > PACKAGE_RANK[ceilingKey]
      ? resolvePackage(ceilingKey)
      : requested;

  const selected = detectSelectedFeatures([context]);

  // ORDER BRIEF FEATURE PROTECTION: included scope = the client's own feature
  // list, verbatim. Package defaults never enter the scope.
  const included = briefIncludedFeatures(brief.features);
  const coreIds = new Set<string>(briefCoveredFeatureIds(brief.features));

  // FEATURE PLACEMENT RULE: consultant recommendation is built first, so its
  // features are never repeated inside Potential Feature Recommendation.
  const built = buildConsultantOption(brief, pkg.key, coreIds);
  const consultant = built?.option ?? null;
  const consultantIds = new Set(built?.ids ?? []);
  const consultantTitles = (consultant?.items ?? []).map((item) => normalize(item.title));

  // DUPLICATE PROTECTION: skip anything already covered by the brief, by the
  // detected features, or by the consultant development option.
  const isDuplicate = (feature: LibraryFeature) => {
    if (coreIds.has(feature.id) || consultantIds.has(feature.id)) return true;
    if (selected.some((s) => s.id === feature.id)) return true;
    const key = normalize(feature.name);
    return consultantTitles.some((title) => title.includes(key) || key.includes(title));
  };

  // Optional recommendations: relevant, non-duplicate, never package-inflating.
  let optional: { name: string; description: string; reason: string }[] = FEATURE_LIBRARY.filter(
    (feature) => {
      if (feature.id === "custom") return false;
      if (isDuplicate(feature)) return false;
      const explicitlyAsked = hasAny(context, [feature.name, ...feature.keywords]);
      if (RESTRICTED_FEATURE_IDS.has(feature.id)) return explicitlyAsked;
      return explicitlyAsked || SAFE_OPTIONAL_IDS.includes(feature.id);
    },
  )
    .sort((a, b) => {
      const aSafe = SAFE_OPTIONAL_IDS.indexOf(a.id);
      const bSafe = SAFE_OPTIONAL_IDS.indexOf(b.id);
      return a.priority - b.priority || aSafe - bSafe || a.no - b.no;
    })
    .slice(0, 3)
    .map((f) => ({
      name: f.name,
      description: describeFeature(f, brief),
      reason: optionalReason(f, brief),
    }));

  // FLEXIBLE RECOMMENDATION RULE: light, business-safe ideas (no enterprise
  // features) to complete the section when the library has little to offer.
  for (const idea of GENERIC_IDEAS) {
    if (optional.length >= 3) break;
    const key = normalize(idea.name);
    if (context.includes(key) || hasAny(context, idea.keywords)) continue;
    if (consultantTitles.some((title) => title.includes(key) || key.includes(title))) continue;
    if (optional.some((item) => normalize(item.name).includes(key))) continue;
    optional.push({ name: idea.name, description: idea.description, reason: idea.reason });
  }

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

