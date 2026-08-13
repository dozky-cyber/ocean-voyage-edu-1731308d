/**
 * KERJAKU MASTER FEATURE LIBRARY (Proposal Generator V5).
 *
 * The AI recommendation engine may ONLY recommend features from this list.
 * It can never invent a new feature name. Admin remains the final decision
 * maker: every recommended row can be edited, removed, repriced, or added.
 */

export type FeatureCategoryKey =
  | "kontak"
  | "informasi"
  | "customer"
  | "produk"
  | "system";

export const FEATURE_CATEGORIES: Record<FeatureCategoryKey, string> = {
  kontak: "Kontak & Komunikasi",
  informasi: "Informasi Bisnis",
  customer: "Customer & Sales",
  produk: "Produk & Transaksi",
  system: "System & Automation",
};

export type LibraryFeature = {
  id: string;
  no: number;
  name: string;
  description: string;
  category: FeatureCategoryKey;
  /** Indicative price used as an editable starting point (IDR). */
  price: number;
  /** Recommendation priority: 1 = paling penting, 2 = pendukung, 3 = tambahan. */
  priority: 1 | 2 | 3;
  /** Keywords used to detect the feature inside brief / discovery text. */
  keywords: string[];
};

export const FEATURE_LIBRARY: LibraryFeature[] = [
  {
    id: "whatsapp",
    no: 1,
    name: "WhatsApp",
    description: "Customer dapat langsung menghubungi bisnis melalui WhatsApp.",
    category: "kontak",
    price: 500_000,
    priority: 1,
    keywords: ["whatsapp", "wa", "chat wa"],
  },
  {
    id: "email",
    no: 2,
    name: "Email / Gmail",
    description: "Customer dapat mengirim pesan melalui email.",
    category: "kontak",
    price: 500_000,
    priority: 2,
    keywords: ["email", "gmail", "surel"],
  },
  {
    id: "contact-form",
    no: 3,
    name: "Contact Form",
    description: "Customer dapat mengisi form kontak atau konsultasi melalui website.",
    category: "kontak",
    price: 750_000,
    priority: 1,
    keywords: ["contact form", "form kontak", "formulir kontak", "hubungi kami"],
  },
  {
    id: "live-chat",
    no: 4,
    name: "Live Chat",
    description: "Customer dapat berkomunikasi langsung melalui website.",
    category: "kontak",
    price: 1_500_000,
    priority: 3,
    keywords: ["live chat", "chat langsung", "chatbox"],
  },
  {
    id: "maps",
    no: 5,
    name: "Google Maps / Lokasi Bisnis",
    description: "Menampilkan lokasi kantor, toko, showroom, atau tempat usaha.",
    category: "informasi",
    price: 750_000,
    priority: 2,
    keywords: ["maps", "google maps", "lokasi", "alamat", "showroom"],
  },
  {
    id: "social-media",
    no: 6,
    name: "Social Media Integration",
    description:
      "Menghubungkan website dengan Instagram, Facebook, TikTok, dan YouTube.",
    category: "informasi",
    price: 750_000,
    priority: 2,
    keywords: ["social media", "sosial media", "instagram", "facebook", "tiktok", "youtube"],
  },
  {
    id: "download-dokumen",
    no: 7,
    name: "Download Dokumen",
    description:
      "Customer dapat mengunduh company profile, katalog, brosur, dan dokumen pendukung.",
    category: "informasi",
    price: 1_000_000,
    priority: 3,
    keywords: ["download", "unduh", "company profile", "brosur", "katalog pdf"],
  },
  {
    id: "form-konsultasi",
    no: 8,
    name: "Form Konsultasi",
    description: "Customer dapat mengirim kebutuhan atau brief project.",
    category: "customer",
    price: 1_500_000,
    priority: 1,
    keywords: ["form konsultasi", "konsultasi", "brief project"],
  },
  {
    id: "request-quotation",
    no: 9,
    name: "Request Quotation / Penawaran Harga",
    description: "Customer dapat meminta penawaran harga bisnis.",
    category: "customer",
    price: 1_800_000,
    priority: 2,
    keywords: ["quotation", "penawaran", "rab", "request harga"],
  },
  {
    id: "booking",
    no: 10,
    name: "Booking / Reservasi",
    description: "Customer dapat melakukan pemesanan jadwal atau layanan.",
    category: "customer",
    price: 3_500_000,
    priority: 1,
    keywords: ["booking", "reservasi", "jadwal", "appointment"],
  },
  {
    id: "database-customer",
    no: 11,
    name: "Database Customer",
    description: "Data customer dapat disimpan dan dikelola.",
    category: "customer",
    price: 2_500_000,
    priority: 2,
    keywords: ["database customer", "data pelanggan", "data customer"],
  },
  {
    id: "crm",
    no: 12,
    name: "CRM / Lead Management",
    description: "Membantu mengelola calon customer dan proses follow up.",
    category: "customer",
    price: 4_500_000,
    priority: 1,
    keywords: ["crm", "lead", "follow up", "prospek"],
  },
  {
    id: "katalog",
    no: 13,
    name: "Katalog Produk",
    description: "Menampilkan daftar produk atau layanan.",
    category: "produk",
    price: 2_500_000,
    priority: 1,
    keywords: ["katalog", "produk", "layanan", "menu produk"],
  },
  {
    id: "order-online",
    no: 14,
    name: "Order Online",
    description: "Customer dapat melakukan pemesanan melalui website.",
    category: "produk",
    price: 4_500_000,
    priority: 1,
    keywords: ["order", "pemesanan", "checkout", "keranjang"],
  },
  {
    id: "payment-gateway",
    no: 15,
    name: "Payment Gateway",
    description: "Menerima pembayaran online.",
    category: "produk",
    price: 3_500_000,
    priority: 2,
    keywords: ["payment gateway", "pembayaran online", "midtrans", "xendit"],
  },
  {
    id: "invoice-system",
    no: 16,
    name: "Invoice / Payment System",
    description: "Mengelola tagihan dan pembayaran.",
    category: "produk",
    price: 3_500_000,
    priority: 2,
    keywords: ["invoice", "tagihan", "billing", "kasir", "pos"],
  },
  {
    id: "login-user",
    no: 17,
    name: "Login User",
    description: "Pengguna memiliki akun untuk masuk ke sistem.",
    category: "system",
    price: 2_500_000,
    priority: 1,
    keywords: ["login", "akun", "user account", "register"],
  },
  {
    id: "dashboard-admin",
    no: 18,
    name: "Dashboard Admin",
    description: "Admin dapat mengelola data melalui dashboard.",
    category: "system",
    price: 4_500_000,
    priority: 1,
    keywords: ["dashboard", "admin panel", "backoffice", "kelola data"],
  },
  {
    id: "notification",
    no: 19,
    name: "Notification / Automation",
    description: "Sistem dapat mengirim notifikasi otomatis.",
    category: "system",
    price: 2_500_000,
    priority: 2,
    keywords: ["notifikasi", "notification", "otomatis", "automation", "reminder"],
  },
  {
    id: "api",
    no: 20,
    name: "API / Integrasi Sistem Lain",
    description: "Terhubung dengan sistem eksternal.",
    category: "system",
    price: 5_000_000,
    priority: 3,
    keywords: ["api", "integrasi", "integration", "sinkron"],
  },
  {
    id: "custom",
    no: 21,
    name: "Custom Requirement",
    description: "Kebutuhan tambahan di luar daftar fitur.",
    category: "system",
    price: 0,
    priority: 3,
    keywords: ["custom"],
  },
];

export function findFeature(id: string): LibraryFeature | undefined {
  return FEATURE_LIBRARY.find((f) => f.id === id);
}

function normalize(value: string) {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}

/** Detects which library features are already covered by the given texts. */
export function detectSelectedFeatures(inputs: (string | null | undefined)[]): LibraryFeature[] {
  const haystack = normalize(inputs.filter(Boolean).join(" | "));
  if (!haystack) return [];
  return FEATURE_LIBRARY.filter(
    (feature) =>
      feature.id !== "custom" &&
      [feature.name, ...feature.keywords].some((token) => haystack.includes(normalize(token))),
  );
}

/* -------------------------------------------------------------------------
 * Packages / Core Solution
 * ---------------------------------------------------------------------- */

export type PackageKey =
  | "Landing Page"
  | "Professional System"
  | "Digital Workflow Solution"
  | "Enterprise System";

export type PackageDefinition = {
  key: PackageKey;
  basePrice: number;
  /** Features included in the package scope by default. */
  coreFeatureIds: string[];
  benefits: string[];
};

export const PACKAGES: PackageDefinition[] = [
  {
    key: "Landing Page",
    basePrice: 4_500_000,
    coreFeatureIds: ["whatsapp", "contact-form", "social-media", "maps"],
    benefits: [
      "Memperkenalkan bisnis secara profesional",
      "Membantu customer mendapatkan informasi utama",
    ],
  },
  {
    key: "Professional System",
    basePrice: 12_000_000,
    coreFeatureIds: ["whatsapp", "contact-form", "katalog", "crm"],
    benefits: [
      "Membantu bisnis mengelola data lebih baik",
      "Meningkatkan proses customer management",
    ],
  },
  {
    key: "Digital Workflow Solution",
    basePrice: 28_000_000,
    coreFeatureIds: ["login-user", "dashboard-admin", "database-customer", "notification"],
    benefits: ["Membantu digitalisasi proses operasional"],
  },
  {
    key: "Enterprise System",
    basePrice: 65_000_000,
    coreFeatureIds: ["login-user", "dashboard-admin", "api", "notification", "invoice-system"],
    benefits: ["Mendukung sistem kompleks dan otomatisasi bisnis"],
  },
];

const LEGACY_PACKAGE_ALIASES: Record<string, PackageKey> = {
  "basic digital presence": "Landing Page",
  "landing page": "Landing Page",
  basic: "Landing Page",
  "professional system": "Professional System",
  professional: "Professional System",
  "business system": "Digital Workflow Solution",
  "digital workflow solution": "Digital Workflow Solution",
  business: "Digital Workflow Solution",
  "enterprise system": "Enterprise System",
  enterprise: "Enterprise System",
  sultan: "Enterprise System",
};

export function resolvePackage(name: string | null | undefined): PackageDefinition {
  const key = LEGACY_PACKAGE_ALIASES[normalize(name ?? "")];
  return PACKAGES.find((p) => p.key === key) ?? PACKAGES[1];
}

/**
 * ORDER BRIEF FEATURE PROTECTION RULE.
 * Included scope = the client's own feature list, verbatim. Package defaults
 * are NEVER injected; the package only defines the solution level and price.
 */
export function briefIncludedFeatures(briefFeatures: (string | null | undefined)[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of briefFeatures) {
    const value = (raw ?? "").trim();
    if (!value) continue;
    const key = normalize(value);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(value);
  }
  return out;
}

/** Library ids already covered by the client's brief (anti duplicate rule). */
export function briefCoveredFeatureIds(briefFeatures: (string | null | undefined)[]): string[] {
  return detectSelectedFeatures(briefFeatures).map((f) => f.id);
}

/** Closest library match for a single brief line (used for descriptions only). */
export function matchLibraryFeature(text: string): LibraryFeature | null {
  const value = normalize(text);
  if (!value) return null;
  return (
    FEATURE_LIBRARY.find(
      (feature) =>
        feature.id !== "custom" &&
        [feature.name, ...feature.keywords].some((token) => value.includes(normalize(token))),
    ) ?? null
  );
}

// PACKAGE FEATURE ISOLATION RULE:
// package feature ids are pricing/positioning metadata only. There is no
// exported helper that turns them into scope — an Included Feature can only
// come from briefIncludedFeatures(). Package-only features may appear solely
// in Team KERJAKU Consultant Recommendation or Potential Feature Recommendation.



/**
 * FEATURE RECOMMENDATION LOGIC.
 * 1. Identify features already chosen by the client (Order Brief + Discovery).
 * 2. Remove them from the recommendation pool (anti duplicate rule).
 * 3. Recommend only unused features, ordered: penting → pendukung → tambahan.
 */
export function recommendFeatures(input: {
  selected: LibraryFeature[];
  /** Additional ids already inside Core Solution (also excluded). */
  excludeIds?: string[];
  context?: string;
  limit?: number;
}): LibraryFeature[] {
  const excluded = new Set<string>([
    "custom",
    ...input.selected.map((f) => f.id),
    ...(input.excludeIds ?? []),
  ]);
  const context = normalize(input.context ?? "");
  const pool = FEATURE_LIBRARY.filter((f) => !excluded.has(f.id));
  const scored = pool.map((feature) => {
    const relevance = feature.keywords.some((k) => context.includes(normalize(k))) ? 1 : 0;
    return { feature, score: feature.priority - relevance * 0.5 };
  });
  scored.sort((a, b) => a.score - b.score || a.feature.no - b.feature.no);
  return scored.slice(0, input.limit ?? 5).map((s) => s.feature);
}
