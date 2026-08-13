/**
 * BUSINESS FEATURE CONSULTANT LIBRARY (Team KERJAKU Consultant).
 *
 * This library is a CONSULTATION reference, not a checklist. Nothing here is
 * mandatory: features are only surfaced when the business type, the business
 * problem, the goal of the system, the number of users, or the operational
 * process in the Order Brief actually justifies them.
 *
 * FINAL PRINCIPLE: jangan menjual package — berikan konsultasi.
 */

import { detectBusinessFlowPattern } from "./business-flow-patterns";
import { buildProblemSolutionPlan } from "./problem-solution-map";

export type ConsultantTier = "basic" | "professional" | "business" | "enterprise";

export type ConsultantFeature = {
  id: string;
  name: string;
  /** Fungsi fitur (dipakai sebagai deskripsi pada dokumen). */
  fn: string;
  /** Manfaat bisnis konkret (dipakai sebagai alasan relevansi). */
  benefit: string;
  tier: ConsultantTier;
  /** Jenis bisnis yang cocok — dicocokkan dengan teks bisnis pada brief. */
  fits: string[];
  /** Sinyal kebutuhan pada brief (masalah, tujuan, proses operasional). */
  signals: string[];
  /** Kata kunci untuk deteksi duplikat terhadap fitur yang sudah diminta. */
  aliases: string[];
  /**
   * SCOPE LIMITATION RULE: hanya boleh muncul jika customer memintanya
   * secara langsung pada brief.
   */
  onRequestOnly?: boolean;
  /**
   * BUSINESS FEATURE VALIDATION RULE — kondisi bisnis yang wajib ada pada brief.
   * Tanpa salah satu kondisi ini, fitur dianggap tidak relevan dan dibuang
   * (contoh: Inventory tanpa pengelolaan stok, Multi User tanpa team,
   * Search tanpa jumlah produk yang besar).
   */
  requires?: string[];
  /**
   * Fitur lain yang lebih sederhana namun lebih berdampak untuk kebutuhan
   * serupa. Dipakai pada pengecekan poin 4.
   */
  simplerAlternativeId?: string;
};

/**
 * FEATURE RELATION MAP (Consultant Engine V7).
 * Hubungan antar fitur ditulis sebagai data, bukan tebakan teks:
 * - `enhances`     : memperkuat fitur yang sudah dipilih customer.
 * - `complements`  : lanjutan wajar pada alur bisnis setelah fitur tersebut.
 * Sebuah Potential Feature hanya boleh muncul jika punya salah satu relasi ini
 * terhadap Feature List customer. Tanpa relasi = UNRELATED = dibuang.
 */
export const FEATURE_RELATIONS: Record<string, { enhances?: string[]; complements?: string[] }> = {
  notification: { enhances: ["status-tracking", "order-management", "booking"] },
  "digital-nota": {
    complements: ["order-management", "status-tracking", "riwayat-transaksi", "booking"],
  },
  "customer-history": {
    complements: ["order-management", "database-customer", "digital-nota", "booking"],
  },
  "database-customer": { complements: ["order-management", "booking", "form-konsultasi"] },
  "form-konsultasi": { complements: ["portfolio", "katalog", "company-profile", "faq"] },
  testimonial: { enhances: ["portfolio", "company-profile", "katalog"] },
  "laporan-penjualan": {
    complements: ["order-management", "digital-nota", "riwayat-transaksi", "status-tracking"],
  },
  "riwayat-transaksi": { complements: ["order-management", "digital-nota"] },
  "schedule-management": { complements: ["order-management", "booking", "status-tracking"] },
  cms: { enhances: ["portfolio", "katalog", "company-profile"] },
  search: { enhances: ["katalog"] },
  whatsapp: { enhances: ["company-profile", "katalog", "portfolio", "faq"] },
  "social-media": { enhances: ["portfolio", "katalog"] },
  maps: { complements: ["company-profile", "katalog"] },
  membership: { complements: ["database-customer", "customer-history"] },
  automation: { enhances: ["notification", "status-tracking", "order-management"] },
  "dashboard-admin": { complements: ["order-management", "cms", "katalog", "status-tracking"] },
  faq: { complements: ["company-profile", "katalog", "portfolio"] },
  "order-management": { complements: ["katalog", "booking"] },
  "status-tracking": { enhances: ["order-management"] },
  booking: { complements: ["katalog", "company-profile"] },
  "multi-user": { enhances: ["dashboard-admin"] },
  crm: { complements: ["database-customer"] },
  "landing-page": { complements: ["company-profile", "katalog"] },
  portfolio: { complements: ["company-profile"] },
  katalog: { complements: ["company-profile"] },
  inventory: { complements: ["katalog", "order-management"] },
};

export type FeatureRelation = "enhancement" | "complementary";

/** Urutan penulisan Potential Feature: efisiensi → penjualan → visibilitas. */
export type GrowthCategory = "operational" | "sales" | "visibility";

const GROWTH_CATEGORY: Record<string, GrowthCategory> = {
  "order-management": "operational",
  "status-tracking": "operational",
  "digital-nota": "operational",
  notification: "operational",
  "schedule-management": "operational",
  inventory: "operational",
  automation: "operational",
  "riwayat-transaksi": "operational",
  "multi-user": "operational",
  "dashboard-admin": "operational",
  cms: "operational",
  "laporan-penjualan": "visibility",
};

export function growthCategoryOf(id: string): GrowthCategory {
  return GROWTH_CATEGORY[id] ?? "sales";
}

const CATEGORY_ORDER: Record<GrowthCategory, number> = {
  operational: 0,
  sales: 1,
  visibility: 2,
};

export function growthCategoryRank(id: string): number {
  return CATEGORY_ORDER[growthCategoryOf(id)];
}

/**
 * Relasi fitur terhadap scope yang sudah dipilih customer.
 * Mengembalikan null bila tidak berhubungan (UNRELATED).
 */
export function relationToScope(
  featureId: string,
  coveredIds: Iterable<string>,
): { relation: FeatureRelation; relatedTo: string } | null {
  const covered = new Set(coveredIds);
  const map = FEATURE_RELATIONS[featureId];
  if (!map) return null;
  const enhanced = (map.enhances ?? []).find((id) => covered.has(id));
  if (enhanced) return { relation: "enhancement", relatedTo: enhanced };
  const complemented = (map.complements ?? []).find((id) => covered.has(id));
  if (complemented) return { relation: "complementary", relatedTo: complemented };
  return null;
}

/**
 * BUSINESS MATURITY CONTEXT.
 * - starter     : belum ada proses operasional rutin (fokus citra & informasi).
 * - growing     : sudah ada order/produksi/transaksi yang perlu dirapikan.
 * - established : sudah punya team, cabang, atau volume besar.
 */
export type BusinessMaturity = "starter" | "growing" | "established";


export const CONSULTANT_LIBRARY: ConsultantFeature[] = [
  {
    id: "company-profile",
    name: "Website Company Profile",
    fn: "Website informasi bisnis berisi profil usaha, layanan, keunggulan, dan kontak perusahaan.",
    benefit: "Membangun kredibilitas bisnis saat calon customer mencari informasi secara online.",
    tier: "basic",
    fits: ["perusahaan", "pt ", "cv ", "jasa", "konsultan", "kontraktor", "agency", "supplier"],
    signals: ["profil perusahaan", "company profile", "kredibilitas", "informasi bisnis"],
    aliases: ["company profile", "website profil", "profil perusahaan"],
  },
  {
    id: "landing-page",
    name: "Landing Page Campaign",
    fn: "Halaman promosi khusus yang fokus mengarahkan pengunjung pada satu aksi tertentu.",
    benefit: "Membantu campaign iklan atau produk baru mendapatkan lebih banyak calon customer.",
    tier: "basic",
    fits: ["sales", "blog", "portofolio", "personal brand", "coach", "kursus"],
    signals: ["iklan", "ads", "campaign", "promo", "produk baru", "leads"],
    aliases: ["landing page", "halaman promosi"],
  },
  {
    id: "katalog",
    name: "Digital Catalog / Katalog Produk",
    fn: "Menampilkan daftar produk atau layanan secara terstruktur dan mudah dijelajahi.",
    benefit: "Memudahkan customer melihat pilihan produk tanpa harus bertanya satu per satu.",
    tier: "basic",
    fits: ["toko", "kuliner", "florist", "fashion", "distributor", "salesman", "retail", "bakery", "catering"],
    signals: ["produk", "layanan", "menu", "harga produk", "varian"],
    aliases: ["katalog", "catalog", "daftar produk", "menu produk"],
  },
  {
    id: "portfolio",
    name: "Galeri Portfolio",
    fn: "Menampilkan hasil pekerjaan atau dokumentasi bisnis secara visual.",
    benefit: "Membantu calon customer menilai kualitas hasil kerja sebelum menghubungi bisnis.",
    tier: "basic",
    fits: [
      "florist",
      "kontraktor",
      "fotografer",
      "dekorasi",
      "kreatif",
      "event organizer",
      "konten creator",
      "content creator",
      "model",
      "agency",
      "interior",
      "wedding",
    ],
    signals: ["portfolio", "portofolio", "dokumentasi", "hasil kerja", "galeri"],
    aliases: ["portfolio", "portofolio", "galeri", "gallery"],
  },
  {
    id: "whatsapp",
    name: "WhatsApp Integration",
    fn: "Customer dapat langsung menghubungi bisnis melalui WhatsApp dari website.",
    benefit: "Mempercepat respon dan memperbesar peluang customer melanjutkan ke pemesanan.",
    tier: "basic",
    fits: [],
    signals: ["hubungi", "kontak cepat", "chat"],
    aliases: ["whatsapp", "wa", "chat wa"],
  },
  {
    id: "social-media",
    name: "Social Media Integration",
    fn: "Menghubungkan website dengan akun sosial media bisnis.",
    benefit: "Menunjukkan aktivitas terbaru bisnis dan meningkatkan kepercayaan calon customer.",
    tier: "basic",
    fits: ["kuliner", "fashion", "florist", "lifestyle", "kreatif", "cafe", "beauty", "salon", "konten creator"],
    signals: ["instagram", "tiktok", "facebook", "sosial media", "social media"],
    aliases: ["social media", "sosial media", "instagram", "tiktok"],
  },
  {
    id: "dashboard-admin",
    name: "Dashboard Admin",
    fn: "Area pengelolaan internal untuk mengatur data website atau sistem.",
    benefit: "Owner dapat mengelola data dan konten sendiri tanpa bergantung pada developer.",
    tier: "professional",
    fits: [],
    signals: ["admin", "kelola data", "update sendiri", "karyawan", "team", "operasional"],
    aliases: ["dashboard", "admin panel", "backoffice"],
  },
  {
    id: "cms",
    name: "Content Management System",
    fn: "Mengubah dan mengelola konten website tanpa menyentuh kode.",
    benefit: "Konten promo, produk, dan portfolio bisa diperbarui kapan saja secara mandiri.",
    tier: "professional",
    fits: ["media", "blog", "sekolah", "komunitas", "kuliner", "florist", "fashion"],
    signals: ["update konten", "sering update", "artikel", "berita", "promo berkala"],
    aliases: ["cms", "content management", "kelola konten"],
  },
  {
    id: "booking",
    name: "Booking / Reservasi",
    fn: "Customer dapat memilih jadwal atau mengirim permintaan berdasarkan waktu.",
    benefit: "Merapikan antrian jadwal layanan dan mengurangi bentrok pemesanan manual.",
    tier: "professional",
    fits: [
      "salon",
      "klinik",
      "event",
      "wedding",
      "hotel",
      "resto",
      "restoran",
      "cafe",
      "rumah makan",
      "service",
      "servis",
      "barber",
      "spa",
      "studio",
      "dokter",
    ],
    signals: ["jadwal", "booking", "reservasi", "appointment", "antrian"],
    aliases: ["booking", "reservasi", "jadwal", "appointment"],
    requires: ["jadwal", "booking", "reservasi", "appointment", "antrian", "slot waktu"],
  },
  {
    id: "database-customer",
    name: "Database Customer",
    fn: "Menyimpan data customer untuk kebutuhan pelayanan dan follow up.",
    benefit: "Memudahkan follow up pelanggan lama dan menjaga repeat order tetap berjalan.",
    tier: "professional",
    fits: ["laundry", "salon", "klinik", "sales", "service", "servis", "membership", "gym", "bengkel"],
    signals: ["data pelanggan", "repeat order", "follow up", "pelanggan tetap", "member"],
    aliases: ["database customer", "data pelanggan", "data customer"],
  },
  {
    id: "riwayat-transaksi",
    name: "Riwayat Transaksi",
    fn: "Menyimpan catatan transaksi customer secara historis.",
    benefit: "Owner dapat menelusuri order sebelumnya tanpa membuka catatan manual.",
    tier: "business",
    fits: ["laundry", "retail", "toko", "bengkel", "service", "servis", "distributor"],
    signals: ["order", "transaksi", "pencatatan", "nota", "riwayat"],
    aliases: ["riwayat transaksi", "history transaksi", "catatan order"],
  },
  {
    id: "laporan-penjualan",
    name: "Laporan Penjualan Sederhana",
    fn: "Melihat data dasar seperti jumlah transaksi, pemasukan harian, dan jumlah order.",
    benefit: "Owner mengetahui performa harian bisnis tanpa membuat laporan manual.",
    tier: "business",
    fits: ["laundry", "retail", "toko", "kuliner", "distributor", "bengkel"],
    signals: ["laporan", "report", "omzet", "pemasukan", "rekap"],
    aliases: ["laporan penjualan", "report transaksi", "laporan"],
  },
  {
    id: "inventory",
    name: "Inventory / Stok",
    fn: "Mengelola persediaan barang beserta pergerakan stoknya.",
    benefit: "Menghindari kehabisan stok dan mempermudah pengecekan barang.",
    tier: "business",
    fits: ["toko", "retail", "gudang", "distributor", "grosir", "bengkel", "apotek"],
    signals: ["stok", "persediaan", "gudang", "barang masuk"],
    aliases: ["inventory", "stok", "persediaan"],
    // Tidak relevan bila bisnis tidak mengelola stok barang (contoh: laundry).
    requires: [
      "stok",
      "persediaan",
      "gudang",
      "barang masuk",
      "barang keluar",
      "restock",
      "inventaris",
      "sparepart",
      "jumlah barang",
    ],
  },
  {
    id: "form-konsultasi",
    name: "Form Konsultasi",
    fn: "Customer dapat mengirim kebutuhan sebelum membeli layanan.",
    benefit: "Kebutuhan customer masuk lebih lengkap sehingga penawaran bisa disiapkan lebih cepat.",
    tier: "basic",
    fits: ["jasa", "agency", "konsultan", "kontraktor", "service", "servis", "interior", "arsitek"],
    signals: ["konsultasi", "brief", "kebutuhan customer", "penawaran"],
    aliases: ["form konsultasi", "konsultasi", "form kebutuhan"],
  },
  {
    id: "maps",
    name: "Maps / Lokasi Bisnis",
    fn: "Menampilkan lokasi usaha melalui peta pada website.",
    benefit: "Membantu customer menemukan lokasi fisik bisnis dengan cepat.",
    tier: "basic",
    fits: [
      "toko",
      "restoran",
      "resto",
      "rumah makan",
      "cafe",
      "laundry",
      "salon",
      "showroom",
      "dealer",
      "bengkel",
      "klinik",
      "apotek",
    ],
    signals: ["lokasi", "alamat", "outlet", "cabang", "offline"],
    aliases: ["maps", "google maps", "lokasi", "alamat"],
  },
  {
    id: "membership",
    name: "Membership",
    fn: "Program pelanggan tetap atau paket berlangganan.",
    benefit: "Mendorong pelanggan kembali dan menjaga pemasukan berulang.",
    tier: "business",
    fits: ["gym", "laundry", "salon", "spa", "kursus", "komunitas", "klinik"],
    signals: ["member", "langganan", "subscription", "pelanggan tetap", "paket bulanan"],
    aliases: ["membership", "member", "langganan"],
    requires: [
      "member",
      "langganan",
      "subscription",
      "pelanggan tetap",
      "repeat order",
      "paket bulanan",
      "loyal",
    ],
    simplerAlternativeId: "database-customer",
  },
  {
    id: "api",
    name: "API Integration",
    fn: "Menghubungkan sistem dengan aplikasi atau layanan lain.",
    benefit: "Menyatukan data dengan sistem yang sudah berjalan di perusahaan.",
    tier: "enterprise",
    fits: [],
    signals: ["api", "integrasi sistem", "sistem existing", "sinkron"],
    aliases: ["api", "integrasi sistem"],
    onRequestOnly: true,
  },
  {
    id: "crm",
    name: "CRM",
    fn: "Pengelolaan hubungan customer secara lebih kompleks beserta proses follow up.",
    benefit: "Membantu team sales menjaga prospek agar tidak terlewat.",
    tier: "enterprise",
    fits: [],
    signals: ["crm", "sales team", "pipeline", "prospek", "lead management"],
    aliases: ["crm", "lead management"],
    onRequestOnly: true,
  },
  {
    id: "automation",
    name: "Automation",
    fn: "Mengurangi pekerjaan manual melalui otomatisasi notifikasi, reminder, dan workflow.",
    benefit: "Menghemat waktu operasional harian yang selama ini dikerjakan manual.",
    tier: "business",
    fits: [],
    signals: ["otomatis", "automation", "reminder", "workflow", "manual"],
    aliases: ["automation", "otomatisasi", "workflow"],
  },
  {
    id: "multi-user",
    name: "Multi User Management",
    fn: "Mengatur beberapa pengguna dengan hak akses berbeda.",
    benefit: "Owner dan karyawan bekerja pada satu sistem dengan batas akses yang jelas.",
    tier: "business",
    fits: [],
    signals: ["karyawan", "team", "multi user", "role", "akses", "kasir", "staff"],
    aliases: ["multi user", "user management", "role akses"],
    // Tidak relevan untuk bisnis personal tanpa team (contoh: florist personal).
    requires: [
      "karyawan",
      "pegawai",
      "staff",
      "staf",
      "team",
      "tim",
      "kasir",
      "divisi",
      "cabang",
      "admin",
      "role",
      "multi user",
      "beberapa user",
    ],
    simplerAlternativeId: "dashboard-admin",
  },
  {
    id: "notification",
    name: "Notification System",
    fn: "Mengirim pemberitahuan ketika ada perubahan data seperti status order atau booking masuk.",
    benefit: "Customer dan team langsung tahu perkembangan order tanpa perlu bertanya.",
    tier: "business",
    fits: ["laundry", "service", "servis", "bengkel", "resto", "hotel", "klinik"],
    signals: ["status", "notifikasi", "pemberitahuan", "update order", "reminder"],
    aliases: ["notifikasi", "notification", "pemberitahuan"],
  },
  {
    id: "search",
    name: "Search Feature",
    fn: "Memudahkan customer mencari produk atau layanan pada website.",
    benefit: "Mempercepat customer menemukan produk saat katalog sudah banyak.",
    tier: "professional",
    fits: ["distributor", "grosir", "toko", "retail", "apotek", "sparepart"],
    signals: ["banyak produk", "pencarian", "search", "katalog besar"],
    aliases: ["search", "pencarian", "cari produk"],
    // Tidak relevan bila jumlah produk masih sedikit (katalog kecil).
    requires: [
      "banyak produk",
      "banyak item",
      "banyak varian",
      "banyak layanan",
      "ratusan",
      "ribuan",
      "katalog besar",
      "pencarian",
      "search",
      "sku",
    ],
    simplerAlternativeId: "katalog",
  },
  {
    id: "faq",
    name: "FAQ / Knowledge Section",
    fn: "Menjawab pertanyaan umum customer langsung di website.",
    benefit: "Mengurangi pertanyaan berulang yang harus dijawab manual setiap hari.",
    tier: "basic",
    fits: ["jasa", "kursus", "klinik", "service", "servis", "travel", "agency"],
    signals: ["pertanyaan", "faq", "sering ditanya", "tanya jawab"],
    aliases: ["faq", "pertanyaan umum", "knowledge"],
  },
  {
    id: "testimonial",
    name: "Customer Review / Testimonial",
    fn: "Menampilkan pengalaman pelanggan sebelumnya secara rapi dan terpercaya.",
    benefit: "Meningkatkan kepercayaan calon customer melalui bukti pengalaman pelanggan.",
    tier: "basic",
    fits: ["jasa", "kuliner", "florist", "wedding", "klinik", "kursus", "travel", "toko"],
    signals: ["testimoni", "review", "ulasan", "kepercayaan", "rating"],
    aliases: ["testimoni", "review", "ulasan", "rating"],
  },
  // ==== BUSINESS OPERATION FEATURE LIBRARY (26-30) ====
  // Bukan fitur wajib. Hanya dipakai bila Business Problem, Business Flow,
  // skala bisnis, dan tujuan customer benar-benar membutuhkannya.
  {
    id: "order-management",
    name: "Order Management",
    fn: "Mengelola perjalanan pesanan customer dari order masuk sampai pesanan selesai.",
    benefit: "Pesanan tidak tertukar dan owner mudah melihat pekerjaan yang sedang berjalan.",
    tier: "professional",
    fits: [
      "laundry",
      "bakery",
      "pastry",
      "catering",
      "bengkel",
      "service",
      "servis",
      "florist",
      "percetakan",
      "konveksi",
      "produksi",
    ],
    signals: [
      "order",
      "pesanan",
      "order manual",
      "catat manual",
      "pencatatan",
      "pesanan tertukar",
      "antrian pekerjaan",
    ],
    aliases: [
      "order management",
      "manajemen order",
      "kelola pesanan",
      "manajemen pesanan",
      "pencatatan project",
      "pencatatan proyek",
      "pencatatan project / order",
      "pencatatan proyek / order",
    ],
    // Tidak relevan untuk company profile / portfolio tanpa transaksi.
    requires: [
      "order",
      "pesanan",
      "transaksi",
      "pembelian",
      "pekerjaan",
      "produksi",
      "jual",
      "customer order",
    ],
  },
  {
    id: "digital-nota",
    name: "Digital Nota / Digital Invoice",
    fn: "Membuat bukti transaksi digital yang dikirim ke customer setelah pembelian atau pekerjaan selesai.",
    benefit: "Bukti transaksi rapi, tidak mudah hilang, dan mudah ditelusuri kembali.",
    tier: "professional",
    fits: [
      "laundry",
      "retail",
      "toko",
      "kuliner",
      "bakery",
      "bengkel",
      "service",
      "servis",
      "catering",
      "jasa",
    ],
    signals: ["nota", "invoice", "kwitansi", "bukti transaksi", "struk", "pembayaran"],
    aliases: ["digital nota", "nota digital", "invoice", "nota", "struk digital"],
    requires: ["nota", "invoice", "struk", "kwitansi", "transaksi", "pembayaran", "order", "pesanan"],
  },
  {
    id: "status-tracking",
    name: "Status Tracking / Progress Tracking",
    fn: "Memberikan informasi perkembangan pekerjaan atau pesanan kepada customer.",
    benefit: "Customer tidak perlu bertanya progress karena status pekerjaan terlihat jelas.",
    tier: "professional",
    fits: ["laundry", "service", "servis", "bengkel", "produksi", "catering", "percetakan", "konveksi"],
    signals: [
      "status",
      "progress",
      "tahapan",
      "sedang dikerjakan",
      "sudah selesai",
      "bertanya progress",
      "update pekerjaan",
    ],
    aliases: ["status tracking", "progress tracking", "tracking status", "lacak status"],
    requires: ["status", "progress", "proses", "pengerjaan", "dikerjakan", "tahapan", "order", "pesanan"],
  },
  {
    id: "customer-history",
    name: "Customer History / Follow Up",
    fn: "Menyimpan riwayat customer dan transaksinya untuk pelayanan dan follow up berikutnya.",
    benefit: "Owner bisa follow up pelanggan lama dan mendorong repeat order tanpa catatan manual.",
    tier: "professional",
    // FEATURE RELATION RULE: berbeda dengan Multi User — dapat dipakai owner
    // sendiri tanpa membutuhkan team.
    fits: ["laundry", "salon", "bengkel", "florist", "catering", "jasa", "service", "servis", "klinik"],
    signals: [
      "repeat order",
      "pelanggan lama",
      "follow up",
      "riwayat pembelian",
      "promo pelanggan",
      "pelanggan kembali",
    ],
    aliases: ["customer history", "riwayat customer", "riwayat pelanggan", "follow up customer"],
    simplerAlternativeId: "database-customer",
  },
  {
    id: "schedule-management",
    name: "Schedule Management",
    fn: "Mengatur jadwal pekerjaan internal bisnis (berbeda dengan Booking yang dipilih customer).",
    benefit: "Jadwal pekerjaan harian tersusun rapi sehingga tidak ada bentrok atau job terlewat.",
    tier: "business",
    fits: ["fotografer", "bengkel", "service", "servis", "catering", "event", "wedding", "organizer"],
    signals: [
      "jadwal pekerjaan",
      "atur jadwal",
      "jadwal event",
      "penjadwalan",
      "jadwal harian",
      "bentrok jadwal",
    ],
    aliases: ["schedule management", "manajemen jadwal", "jadwal internal", "penjadwalan"],
    requires: ["jadwal", "event", "schedule", "penjadwalan", "agenda"],
    simplerAlternativeId: "booking",
  },
];

const TIER_RANK: Record<ConsultantTier, number> = {
  basic: 0,
  professional: 1,
  business: 2,
  enterprise: 3,
};

function normalize(value: string) {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}

function includesAny(haystack: string, tokens: string[]) {
  return tokens.some((token) => token && haystack.includes(normalize(token)));
}

/** Kata negasi pada brief: "tidak ada team", "tanpa admin", "belum punya stok". */
const NEGATION_WORDS = [
  "tidak",
  "tdk",
  "tanpa",
  "belum",
  "bukan",
  "nggak",
  "gak",
  "ga ",
  "no team",
  "none",
];

/** Pecah konteks brief menjadi klausa agar negasi bisa dibaca per kalimat. */
function clauses(haystack: string): string[] {
  return haystack
    .split(/[.;|\n]|,| - |\(|\)|\bdan\b/g)
    .map((part) => part.trim())
    .filter(Boolean);
}

/**
 * BRIEF NEGATION RULE.
 * Kata kunci fitur hanya dihitung bila TIDAK berada pada kalimat yang
 * dinegasikan. Contoh: "Kebutuhan admin/team: Tidak (dikelola personal)"
 * tidak boleh dibaca sebagai kebutuhan admin/team.
 */
function includesAnyPositive(haystack: string, tokens: string[]) {
  const parts = clauses(haystack);
  return tokens.some((token) => {
    const t = normalize(token);
    if (!t) return false;
    return parts.some((part) => part.includes(t) && !includesAny(part, NEGATION_WORDS));
  });
}

/**
 * PACKAGE LEVEL / SCALE RULE.
 * Brief yang menyatakan bisnis dikelola personal (tanpa admin/team) tidak boleh
 * mendapat rekomendasi fitur bertim.
 */
export function isPersonalScale(scaleText: string, context = ""): boolean {
  const scale = normalize(scaleText);
  const full = normalize(`${scaleText} ${context}`);
  if (!scale && !full) return false;
  const personalSignal = includesAny(scale, [
    "personal",
    "perorangan",
    "pribadi",
    "sendiri",
    "1 user",
    "satu user",
    "owner saja",
    "single user",
  ]);
  const noTeam = clauses(full).some(
    (part) =>
      includesAny(part, ["admin", "team", "tim", "karyawan", "pegawai", "staff", "staf"]) &&
      includesAny(part, NEGATION_WORDS),
  );
  const hasTeam = includesAnyPositive(full, [
    "karyawan",
    "pegawai",
    "staff",
    "staf",
    "divisi",
    "cabang",
    "kasir",
    "beberapa user",
    "multi user",
  ]);
  if (hasTeam) return false;
  return personalSignal || noTeam;
}

/**
 * BUSINESS OPERATION PRIORITY RULE.
 * Jika Business Problem menyebut masalah operasional tertentu, fitur operasional
 * yang menyelesaikan masalah itu diprioritaskan (bukan diwajibkan).
 */
const OPERATION_PRIORITY: { tokens: string[]; ids: string[] }[] = [
  {
    tokens: ["order manual", "catat manual", "pencatatan manual", "pesanan tertukar", "order masih", "pesanan manual"],
    ids: ["order-management"],
  },
  {
    tokens: ["nota", "invoice", "struk", "kwitansi", "bukti transaksi", "bukti pembayaran"],
    ids: ["digital-nota"],
  },
  {
    tokens: ["bertanya status", "bertanya progress", "tanya progress", "update status", "status pekerjaan"],
    ids: ["status-tracking", "notification"],
  },
  { tokens: ["repeat order", "pelanggan lama", "follow up", "pelanggan kembali"], ids: ["customer-history"] },
  { tokens: ["jadwal pekerjaan", "atur jadwal", "bentrok jadwal", "jadwal event", "penjadwalan"], ids: ["schedule-management"] },
];

function operationPriorityIds(problem: string, context: string): Set<string> {
  const ids = new Set<string>();
  for (const rule of OPERATION_PRIORITY) {
    if (includesAnyPositive(problem, rule.tokens) || includesAnyPositive(context, rule.tokens)) {
      rule.ids.forEach((id) => ids.add(id));
    }
  }
  return ids;
}

/** Fitur yang hanya masuk akal jika bisnis dikelola lebih dari satu orang. */
const TEAM_ONLY_FEATURES = new Set(["multi-user", "dashboard-admin", "automation", "crm", "api"]);


export function consultantFeature(id: string): ConsultantFeature | undefined {
  return CONSULTANT_LIBRARY.find((f) => f.id === id);
}

/** True when the brief already covers this feature (anti duplicate rule). */
export function isCoveredByBrief(feature: ConsultantFeature, briefText: string) {
  const text = normalize(briefText);
  if (!text) return false;
  return includesAny(text, [feature.name, ...feature.aliases]);
}

/** Canonical Consultant Library ids already selected in the customer's scope. */
export function consultantCoveredFeatureIds(briefText: string): string[] {
  return CONSULTANT_LIBRARY.filter((feature) => isCoveredByBrief(feature, briefText)).map(
    (feature) => feature.id,
  );
}

/**
 * CORE = menyelesaikan masalah yang customer sebut pada brief.
 * GROWTH = pengembangan lanjutan setelah masalah utama selesai.
 */
export type ConsultantRole = "core" | "growth";

export type ConsultantPick = ConsultantFeature & {
  score: number;
  reasons: string[];
  role: ConsultantRole;
  /** Label masalah customer yang diselesaikan (khusus core). */
  solves: string | null;
  /** Core prasyarat untuk fitur growth (null jika berdiri sendiri). */
  requiresCoreId: string | null;
};

/**
 * BUSINESS FEATURE VALIDATION RULE.
 * Sebelum sebuah fitur boleh masuk rekomendasi, minimal 2 dari 4 pengecekan
 * berikut harus terpenuhi:
 *   1. Dipakai pada proses bisnis utama customer.
 *   2. Kondisi bisnis customer memang membutuhkan fitur tersebut.
 *   3. Fitur mengurangi masalah yang disebutkan pada Business Problem.
 *   4. Tidak ada fitur lain yang lebih sederhana tetapi lebih berdampak.
 * Selain itu, `requires` bersifat wajib: tanpa kondisi bisnis tersebut fitur
 * langsung dibuang (Inventory pada laundry, Multi User pada bisnis personal,
 * Search pada katalog kecil).
 */
export function validateConsultantFeature(
  feature: ConsultantFeature,
  input: { business: string; context: string; problemText?: string; scaleText?: string },
): { valid: boolean; reasons: string[] } {
  const business = normalize(input.business);
  const context = normalize(`${input.business} ${input.context}`);
  const problem = normalize(input.problemText ?? "");
  const tokens = [feature.name, ...feature.aliases, ...feature.signals];

  // SCALE RULE: bisnis personal tanpa team tidak mendapat fitur bertim.
  const personal = isPersonalScale(input.scaleText ?? "", context);
  if (personal && (TEAM_ONLY_FEATURES.has(feature.id) || feature.tier === "enterprise")) {
    const askedDirectly = includesAnyPositive(context, [feature.name, ...feature.aliases]);
    if (!askedDirectly) return { valid: false, reasons: [] };
  }

  // Hard condition: kondisi bisnis wajib (negasi pada brief tidak dihitung).
  if (feature.requires?.length && !includesAnyPositive(context, feature.requires)) {
    return { valid: false, reasons: [] };
  }

  const reasons: string[] = [];

  // 1. Proses bisnis utama.
  if (includesAny(business, feature.fits) || includesAnyPositive(context, feature.fits)) {
    reasons.push("Digunakan pada proses bisnis utama customer.");
  }
  // 2. Kondisi bisnis membutuhkan fitur ini.
  if (
    includesAnyPositive(context, feature.signals) ||
    includesAnyPositive(context, feature.requires ?? [])
  ) {
    reasons.push("Kondisi bisnis pada brief membutuhkan fitur ini.");
  }
  // 3. Mengurangi masalah pada Business Problem.
  if (problem && includesAnyPositive(problem, tokens)) {
    reasons.push("Mengurangi masalah yang disebutkan customer.");
  }

  // 4. Tidak ada fitur lain yang lebih sederhana namun lebih berdampak.
  const simpler = feature.simplerAlternativeId
    ? consultantFeature(feature.simplerAlternativeId)
    : undefined;
  const simplerStillBetter =
    !!simpler &&
    !includesAny(context, [feature.name, ...feature.aliases]) &&
    !isCoveredByBrief(simpler, context);
  if (!simplerStillBetter) {
    reasons.push("Tidak ada fitur lain yang lebih sederhana dengan dampak lebih besar.");
  }

  return { valid: reasons.length >= 2, reasons };
}

/**
 * CONSULTANT DECISION RULE.
 * Pilih hanya fitur yang memberi dampak nyata pada bisnis ini. Skor dihitung
 * dari kecocokan jenis bisnis + sinyal masalah/proses operasional pada brief.
 */
export function selectConsultantFeatures(input: {
  /** Teks jenis bisnis (business/project). */
  businessText: string;
  /** Seluruh konteks brief: tujuan, masalah, fitur, jumlah user, dsb. */
  context: string;
  /** Batas kompleksitas solusi berdasarkan brief. */
  maxTier?: ConsultantTier;
  /** Fitur yang sudah dipakai di tempat lain. */
  excludeIds?: string[];
  /** Judul yang sudah tampil (duplicate protection lintas section). */
  excludeTitles?: string[];
  /** Business Problem pada brief (dipakai pengecekan validasi poin 3). */
  problemText?: string;
  /** Skala pengguna + kebutuhan admin/team pada brief. */
  scaleText?: string;
  /**
   * PACKAGE LEVEL CONTROL RULE: false berarti skala organisasi belum kompleks,
   * sehingga fitur bertier enterprise tidak boleh direkomendasikan.
   */
  allowEnterprise?: boolean;
  limit?: number;

  /** Tujuan sistem pada brief (dipakai peta problem → solution). */
  goalText?: string;
  /** Feature List pada brief (DUPLICATE PREVENTION RULE). */
  briefFeatureText?: string;
}): ConsultantPick[] {
  const business = normalize(input.businessText);
  const context = normalize(`${input.businessText} ${input.context}`);
  const problem = normalize(input.problemText ?? "");
  const maxRank = TIER_RANK[input.maxTier ?? "business"];
  const excluded = new Set(input.excludeIds ?? []);
  const excludedTitles = (input.excludeTitles ?? []).map(normalize);
  const personal = isPersonalScale(input.scaleText ?? "", context);
  const briefFeatures = normalize(input.briefFeatureText ?? "");

  // STEP 6 — ATURAN KHUSUS FITUR (Consultant Engine V5).
  // Masalah/tujuan yang customer sebut sendiri, bukan tebakan dari jenis bisnis.
  const problemScope = normalize(`${input.problemText ?? ""} ${input.goalText ?? ""}`);
  const stockProblem = includesAnyPositive(problemScope, [
    "stok",
    "persediaan",
    "gudang",
    "restock",
    "kehabisan barang",
    "barang habis",
    "inventory",
  ]);
  const receiptProblem = includesAnyPositive(problemScope, [
    "nota",
    "invoice",
    "struk",
    "kwitansi",
    "bukti transaksi",
    "bukti pembayaran",
    "tagihan manual",
    "pembayaran manual",
  ]);
  const accessProblem = includesAnyPositive(context, [
    "hak akses",
    "akses berbeda",
    "level user",
    "pembagian akses",
    "role akses",
    "multi user",
    "user management",
  ]);
  const automationAsked = includesAnyPositive(context, [
    "otomatis",
    "otomatisasi",
    "automation",
    "workflow otomatis",
    "reminder otomatis",
  ]);
  const crmComplex = includesAnyPositive(context, [
    "crm",
    "sales team",
    "tim sales",
    "pipeline",
    "prospek",
    "lead management",
    "banyak pelanggan",
    "manajemen customer",
  ]);

  // BUSINESS FLOW PATTERN LIBRARY: pahami alur bisnis dulu, baru pilih fitur.
  const pattern = detectBusinessFlowPattern(input.businessText, input.context);
  const priority = new Set(pattern?.priority ?? []);
  const opPriority = operationPriorityIds(problem, context);
  opPriority.forEach((id) => priority.add(id));
  const conditional = new Set(pattern?.conditional ?? []);
  const notPriority = new Set(pattern?.notPriority ?? []);

  // CORE / GROWTH SPLIT RULE: masalah customer menentukan core solution.
  const plan = buildProblemSolutionPlan({
    businessText: input.businessText,
    problemText: input.problemText ?? "",
    goalText: input.goalText,
    context: input.context,
  });

  const picks: ConsultantPick[] = [];
  for (const feature of CONSULTANT_LIBRARY) {
    if (excluded.has(feature.id)) continue;

    const solvesStated = plan.core.get(feature.id);
    const isCore = Boolean(solvesStated);

    // Penyebutan pada Business Problem bukan berarti fitur sudah ada di brief.
    if (!isCore && isCoveredByBrief(feature, context)) continue;

    // CUSTOMER SCOPE PRIORITY RULE: once a feature is selected in the Order
    // Brief it is already the customer's solution. Never re-evaluate it as a
    // new Core or Potential Feature, even when its problem is still mentioned.
    if (briefFeatures && isCoveredByBrief(feature, briefFeatures)) continue;

    const key = normalize(feature.name);
    if (excludedTitles.some((title) => title.includes(key) || key.includes(title))) continue;

    const asked = includesAnyPositive(context, [feature.name, ...feature.aliases]);
    if (feature.onRequestOnly && !asked) continue;

    // ATURAN KHUSUS — hard block, berlaku juga untuk core.
    // INVENTORY: hanya bila stok memang masalah/tujuan customer.
    if (feature.id === "inventory" && !stockProblem && !asked) continue;
    // DIGITAL NOTA: transaksi/order saja bukan alasan. Harus ada masalah bukti
    // transaksi, nota, tagihan, atau pembayaran manual yang disebut customer.
    if (feature.id === "digital-nota" && !receiptProblem && !asked) continue;
    // MULTI USER: bukan karena ada karyawan, tapi karena butuh hak akses beda.
    if (feature.id === "multi-user" && !accessProblem) continue;
    // AUTOMATION: selalu potential kecuali customer memintanya.
    if (feature.id === "automation" && !automationAsked) continue;
    // CRM: hanya untuk kebutuhan pengelolaan customer yang kompleks.
    if (feature.id === "crm" && !crmComplex) continue;

    // SCALE RULE (hard block, tidak bisa dilewati oleh business flow priority):
    // bisnis personal tanpa team tidak boleh mendapat fitur bertim/enterprise.
    if (personal && !asked && (TEAM_ONLY_FEATURES.has(feature.id) || feature.tier === "enterprise"))
      continue;

    // PACKAGE LEVEL CONTROL RULE: tanpa kompleksitas organisasi (multi cabang,
    // struktur berjenjang, user besar), fitur enterprise tidak direkomendasikan.
    if (input.allowEnterprise === false && !asked && feature.tier === "enterprise") continue;



    const fitsBusiness =
      includesAny(business, feature.fits) || includesAnyPositive(context, feature.fits);
    const hasSignal = includesAnyPositive(context, feature.signals);
    const solvesProblem =
      !!problem &&
      includesAnyPositive(problem, [feature.name, ...feature.aliases, ...feature.signals]);

    if (!isCore) {
      // Bukan prioritas pada alur bisnis ini -> hanya boleh jika customer minta.
      if (notPriority.has(feature.id) && !asked) continue;
      // Fitur kondisional (mis. Inventory/Search) butuh sinyal kebutuhan nyata.
      if (conditional.has(feature.id) && !asked && !hasSignal) continue;

      // Tanpa kecocokan bisnis maupun sinyal kebutuhan: bukan konsultasi, skip.
      if (!fitsBusiness && !hasSignal && !priority.has(feature.id) && !plan.growth.has(feature.id))
        continue;
      // Bila masalah customer sudah punya core solution, potential feature
      // dibatasi pada pengembangan lanjutan yang relevan dengan alur bisnis.
      if (plan.core.size && !plan.growth.has(feature.id) && !priority.has(feature.id) && !asked)
        continue;
      if (TIER_RANK[feature.tier] > maxRank && !hasSignal) continue;
    }

    // BUSINESS FEATURE VALIDATION RULE: minimal 2 alasan, jika tidak: dibuang.
    const validation = validateConsultantFeature(feature, {
      business: input.businessText,
      context: input.context,
      problemText: input.problemText,
      scaleText: input.scaleText,
    });
    const onFlow = priority.has(feature.id);
    // A business-flow pattern only affects ranking. It must never bypass the
    // four-question validation or turn the library into a feature generator.
    if (!validation.valid && !isCore) continue;

    const reasons = isCore
      ? [`Menyelesaikan masalah customer: ${solvesStated}.`, ...validation.reasons]
      : onFlow
        ? [
            pattern
              ? `Memperbaiki alur bisnis ${pattern.name}.`
              : "Memperbaiki proses operasional utama pada brief.",
            ...validation.reasons,
          ]
        : validation.reasons;

    const score =
      (isCore ? 12 : 0) +
      (fitsBusiness ? 2 : 0) +
      (hasSignal ? 2 : 0) +
      (onFlow ? 3 : 0) +
      (opPriority.has(feature.id) ? 2 : 0) +
      (solvesProblem ? 2 : 0) +
      validation.reasons.length -
      TIER_RANK[feature.tier] * 0.25;
    picks.push({
      ...feature,
      score,
      reasons,
      role: isCore ? "core" : "growth",
      solves: solvesStated ?? null,
      requiresCoreId: isCore ? null : (plan.growth.get(feature.id) ?? null),
    });
  }


  picks.sort((a, b) => b.score - a.score || TIER_RANK[a.tier] - TIER_RANK[b.tier]);

  // Growth yang merupakan lanjutan dari core yang tidak terpilih ikut gugur.
  const coreIds = new Set([
    ...picks.filter((p) => p.role === "core").map((p) => p.id),
    // ENHANCEMENT RULE: a Core feature already selected by the customer still
    // satisfies the prerequisite for a non-duplicate enhancement.
    ...consultantCoveredFeatureIds(input.briefFeatureText ?? ""),
  ]);
  const filtered = picks.filter(
    (p) => p.role === "core" || !p.requiresCoreId || coreIds.has(p.requiresCoreId),
  );

  return filtered.slice(0, input.limit ?? 6);
}

