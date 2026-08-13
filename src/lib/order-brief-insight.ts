// AI Business Recommendation block for the Order Brief PDF.
//
// ORDER BRIEF PROTECTION RULE V1
// - The Final Order Brief is the single source of truth. The AI never adds,
//   renames, or enlarges the client's own requirements.
// - Package recommendation follows the real complexity of the brief and is
//   never inflated (an admin dashboard alone does not upgrade a package).
// - Improvements only live inside AI Business Recommendation + Optional
//   Feature Recommendation, and every optional item must have a business
//   reason tied to the client's brief.

import {
  FEATURE_LIBRARY,
  coreSolutionFeatures,
  detectSelectedFeatures,
  resolvePackage,
  type LibraryFeature,
  type PackageDefinition,
  type PackageKey,
} from "./admin/feature-library";
import type { OrderBriefData } from "./order-brief";

export type BriefInsight = {
  packageName: string;
  reason: string;
  included: string[];
  optional: { name: string; description: string; reason: string }[];
  disclaimer: string;
};

export const OPTIONAL_DISCLAIMER =
  "Rekomendasi fitur tambahan merupakan hasil analisa kebutuhan bisnis dan dapat dikembangkan sesuai kebutuhan. Fitur ini bukan bagian dari scope utama sebelum dilakukan persetujuan lebih lanjut.";

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
    "katalog",
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
    `Rekomendasi paket ${pkg.key} dipilih karena ${complexityLabel(pkg)}${
      brief.usersScale?.trim() ? ` dengan cakupan pengguna ${brief.usersScale.trim()}` : ""
    }.`,
    "Rekomendasi ini mengikuti kebutuhan yang tertulis pada Order Brief tanpa menambah kompleksitas baru.",
  ];
  if (pkg.benefits.length) parts.push(`${pkg.benefits.join(", ")}.`);
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

  // Included scope = package core + client selections, minus advanced features
  // the client never asked for.
  const core = coreSolutionFeatures(pkg.key, selected).filter(
    (feature) =>
      !RESTRICTED_FEATURE_IDS.has(feature.id) ||
      selected.some((s) => s.id === feature.id) ||
      hasAny(context, [feature.name, ...feature.keywords]),
  );
  const coreIds = new Set(core.map((f) => f.id));

  // Optional recommendations: relevant, non-duplicate, never package-inflating.
  const optional = FEATURE_LIBRARY.filter((feature) => {
    if (coreIds.has(feature.id)) return false;
    if (selected.some((s) => s.id === feature.id)) return false;
    if (feature.id === "custom") return false;
    const explicitlyAsked = hasAny(context, [feature.name, ...feature.keywords]);
    if (RESTRICTED_FEATURE_IDS.has(feature.id)) return explicitlyAsked;
    return explicitlyAsked || SAFE_OPTIONAL_IDS.includes(feature.id);
  })
    .sort((a, b) => {
      const aSafe = SAFE_OPTIONAL_IDS.indexOf(a.id);
      const bSafe = SAFE_OPTIONAL_IDS.indexOf(b.id);
      return a.priority - b.priority || aSafe - bSafe || a.no - b.no;
    })
    .slice(0, 3);

  return {
    packageName: pkg.key,
    reason: buildReason(brief, pkg),
    included: core.map((f) => f.name),
    optional: optional.map((f) => ({
      name: f.name,
      description: describeFeature(f, brief),
      reason: optionalReason(f, brief),
    })),
    disclaimer: OPTIONAL_DISCLAIMER,
  };
}
