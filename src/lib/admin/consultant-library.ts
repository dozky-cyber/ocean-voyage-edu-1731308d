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

export function consultantFeature(id: string): ConsultantFeature | undefined {
  return CONSULTANT_LIBRARY.find((f) => f.id === id);
}

/** True when the brief already covers this feature (anti duplicate rule). */
export function isCoveredByBrief(feature: ConsultantFeature, briefText: string) {
  const text = normalize(briefText);
  if (!text) return false;
  return includesAny(text, [feature.name, ...feature.aliases]);
}

export type ConsultantPick = ConsultantFeature & { score: number; reasons: string[] };

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
  input: { business: string; context: string; problemText?: string },
): { valid: boolean; reasons: string[] } {
  const business = normalize(input.business);
  const context = normalize(`${input.business} ${input.context}`);
  const problem = normalize(input.problemText ?? "");
  const tokens = [feature.name, ...feature.aliases, ...feature.signals];

  // Hard condition: kondisi bisnis wajib.
  if (feature.requires?.length && !includesAny(context, feature.requires)) {
    return { valid: false, reasons: [] };
  }

  const reasons: string[] = [];

  // 1. Proses bisnis utama.
  if (includesAny(business, feature.fits) || includesAny(context, feature.fits)) {
    reasons.push("Digunakan pada proses bisnis utama customer.");
  }
  // 2. Kondisi bisnis membutuhkan fitur ini.
  if (includesAny(context, feature.signals) || includesAny(context, feature.requires ?? [])) {
    reasons.push("Kondisi bisnis pada brief membutuhkan fitur ini.");
  }
  // 3. Mengurangi masalah pada Business Problem.
  if (problem && includesAny(problem, tokens)) {
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
  limit?: number;
}): ConsultantPick[] {
  const business = normalize(input.businessText);
  const context = normalize(`${input.businessText} ${input.context}`);
  const maxRank = TIER_RANK[input.maxTier ?? "business"];
  const excluded = new Set(input.excludeIds ?? []);
  const excludedTitles = (input.excludeTitles ?? []).map(normalize);

  const picks: ConsultantPick[] = [];
  for (const feature of CONSULTANT_LIBRARY) {
    if (excluded.has(feature.id)) continue;
    if (isCoveredByBrief(feature, context)) continue;

    const key = normalize(feature.name);
    if (excludedTitles.some((title) => title.includes(key) || key.includes(title))) continue;

    const asked = includesAny(context, [feature.name, ...feature.aliases]);
    if (feature.onRequestOnly && !asked) continue;

    const fitsBusiness = includesAny(business, feature.fits) || includesAny(context, feature.fits);
    const hasSignal = includesAny(context, feature.signals);

    // Tanpa kecocokan bisnis maupun sinyal kebutuhan: bukan konsultasi, skip.
    if (!fitsBusiness && !hasSignal) continue;
    if (TIER_RANK[feature.tier] > maxRank && !hasSignal) continue;

    // BUSINESS FEATURE VALIDATION RULE: minimal 2 alasan, jika tidak: dibuang.
    const validation = validateConsultantFeature(feature, {
      business: input.businessText,
      context: input.context,
      problemText: input.problemText,
    });
    if (!validation.valid) continue;

    const score =
      (fitsBusiness ? 2 : 0) +
      (hasSignal ? 2 : 0) +
      validation.reasons.length -
      TIER_RANK[feature.tier] * 0.25;
    picks.push({ ...feature, score, reasons: validation.reasons });
  }

  picks.sort((a, b) => b.score - a.score || TIER_RANK[a.tier] - TIER_RANK[b.tier]);
  return picks.slice(0, input.limit ?? 6);
}
