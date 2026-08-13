/**
 * INDUSTRY CONTEXT LIBRARY (Team KERJAKU Consultant).
 *
 * Business Flow Pattern menjawab "bagaimana alur bisnis berjalan" (5 pola besar).
 * File ini menjawab "bisnis apa persisnya", sehingga kalimat pada Order Brief
 * memakai kosakata industri customer, bukan istilah generik seperti
 * "jasa / service / appointment business".
 *
 * Tiga lapisan yang disediakan:
 *   1. INDUSTRY CONTEXT     — kosakata + tahapan kerja nyata per industri.
 *   2. BUSINESS MODEL       — cara bisnis menghasilkan uang (custom project,
 *                             layanan berulang, penjualan produk, dst).
 *   3. FEATURE VOCABULARY   — nama fitur menyesuaikan industri.
 * Ditambah BUSINESS STAGE AWARENESS: kalimat dampak menyesuaikan tahap bisnis
 * (starter / growing / established).
 *
 * Semua kalimat dibentuk secara deterministik dari template + kosakata, tanpa
 * panggilan AI, sehingga seluruh lini bisnis mendapat perlakuan yang sama.
 */

export type BusinessModel =
  | "custom-project"
  | "recurring-service"
  | "product-sales"
  | "appointment"
  | "event"
  | "wholesale"
  | "rental"
  | "membership";

export type BusinessStage = "starter" | "growing" | "established";

export type IndustryContext = {
  id: string;
  /** Nama industri untuk judul/penjelasan. */
  name: string;
  /** Sebutan singkat di dalam kalimat, mis. "interior custom". */
  aka: string;
  model: BusinessModel;
  match: string[];
  /** Sebutan satuan pekerjaan: project, order, sesi, acara, unit. */
  jobTerm: string;
  /** Sebutan barang/jasa yang dijual. */
  productTerm: string;
  /** Sebutan customer pada industri tsb. */
  customerTerm: string;
  /** Sebutan bahan/stok (dipakai untuk fitur inventory). */
  materialTerm: string;
  /** Tahapan kerja nyata dari awal sampai selesai. */
  stages: string[];
  /** Aktivitas awal sebelum pekerjaan dimulai (survey, konsultasi, fitting). */
  intakeTerm: string;
  /** Alasan customer kembali lagi. */
  repeat: string;
  /** Karakter durasi pengerjaan. */
  duration: "short" | "medium" | "long";
  /** Nama fitur versi industri (Feature Vocabulary Mapping). */
  vocab?: Record<string, string>;
};

const PROJECT_VOCAB: Record<string, string> = {
  "order-management": "Manajemen Project",
  "status-tracking": "Tracking Progress Pengerjaan",
  "digital-nota": "Invoice & Nota Digital",
  "riwayat-transaksi": "Riwayat Project",
  "customer-history": "Riwayat Project Customer",
  notification: "Notifikasi Progress Otomatis",
  "laporan-penjualan": "Laporan Nilai Project",
  "schedule-management": "Penjadwalan Tim Pengerjaan",
};

const SERVICE_VOCAB: Record<string, string> = {
  "order-management": "Manajemen Order Layanan",
  "status-tracking": "Status Pengerjaan",
  "digital-nota": "Nota Digital",
  notification: "Notifikasi Status Otomatis",
  "customer-history": "Riwayat Layanan Pelanggan",
};

const RETAIL_VOCAB: Record<string, string> = {
  "order-management": "Manajemen Pesanan",
  "status-tracking": "Status Pesanan & Pengiriman",
  "digital-nota": "Nota Digital",
  "customer-history": "Riwayat Belanja Pelanggan",
  notification: "Notifikasi Pesanan Otomatis",
};

const APPOINTMENT_VOCAB: Record<string, string> = {
  booking: "Booking Jadwal Online",
  "order-management": "Manajemen Jadwal & Order",
  "status-tracking": "Status Kunjungan / Layanan",
  "customer-history": "Riwayat Kunjungan Pelanggan",
  notification: "Pengingat Jadwal Otomatis",
};

export const INDUSTRY_CONTEXTS: IndustryContext[] = [
  {
    id: "furniture-interior",
    name: "Furniture & Interior Custom",
    aka: "interior custom",
    model: "custom-project",
    match: [
      "furniture",
      "furnitur",
      "interior",
      "mebel",
      "meubel",
      "kitchen set",
      "custom workshop",
      "woodworking",
    ],
    jobTerm: "project",
    productTerm: "desain dan hasil pengerjaan",
    customerTerm: "customer",
    materialTerm: "material kayu dan aksesoris",
    stages: ["survey", "desain", "produksi", "finishing", "instalasi"],
    intakeTerm: "survey dan konsultasi desain",
    repeat: "menambah unit atau mengerjakan ruangan lain",
    duration: "long",
    vocab: PROJECT_VOCAB,
  },
  {
    id: "kontraktor",
    name: "Kontraktor & Renovasi Bangunan",
    aka: "kontraktor bangunan",
    model: "custom-project",
    match: ["kontraktor", "renovasi", "bangun rumah", "konstruksi", "arsitek", "borongan"],
    jobTerm: "project",
    productTerm: "pekerjaan bangunan",
    customerTerm: "owner project",
    materialTerm: "material bangunan",
    stages: ["survey lokasi", "RAB", "pengerjaan struktur", "finishing", "serah terima"],
    intakeTerm: "survey lokasi dan penyusunan RAB",
    repeat: "melanjutkan tahap pembangunan berikutnya",
    duration: "long",
    vocab: PROJECT_VOCAB,
  },
  {
    id: "konveksi",
    name: "Konveksi & Garmen Custom",
    aka: "konveksi custom",
    model: "custom-project",
    match: ["konveksi", "garmen", "jahit", "sablon kaos", "seragam", "clothing", "penjahit"],
    jobTerm: "order produksi",
    productTerm: "pakaian dan seragam",
    customerTerm: "customer",
    materialTerm: "kain dan bahan produksi",
    stages: ["sampel", "cutting", "jahit", "sablon/bordir", "QC dan pengiriman"],
    intakeTerm: "pengambilan ukuran dan approval sampel",
    repeat: "melakukan repeat order untuk batch berikutnya",
    duration: "medium",
    vocab: PROJECT_VOCAB,
  },
  {
    id: "percetakan",
    name: "Percetakan & Advertising",
    aka: "percetakan",
    model: "custom-project",
    match: ["percetakan", "printing", "digital printing", "advertising", "neon box", "spanduk"],
    jobTerm: "order cetak",
    productTerm: "produk cetak",
    customerTerm: "customer",
    materialTerm: "bahan cetak",
    stages: ["desain", "approval file", "produksi cetak", "finishing", "pengiriman"],
    intakeTerm: "brief desain dan approval file",
    repeat: "mencetak ulang kebutuhan rutin",
    duration: "short",
    vocab: PROJECT_VOCAB,
  },
  {
    id: "otomotif",
    name: "Bengkel & Servis Otomotif",
    aka: "bengkel otomotif",
    model: "recurring-service",
    match: ["bengkel", "otomotif", "mobil", "motor", "variasi", "body repair", "cuci mobil"],
    jobTerm: "order servis",
    productTerm: "layanan servis",
    customerTerm: "pemilik kendaraan",
    materialTerm: "sparepart",
    stages: ["pengecekan awal", "estimasi biaya", "pengerjaan", "uji hasil", "serah terima"],
    intakeTerm: "pengecekan kendaraan",
    repeat: "servis berkala",
    duration: "medium",
    vocab: SERVICE_VOCAB,
  },
  {
    id: "laundry",
    name: "Laundry & Perawatan Barang",
    aka: "laundry",
    model: "recurring-service",
    match: ["laundry", "cuci", "kiloan", "cuci sepatu", "dry clean", "cleaning service"],
    jobTerm: "order",
    productTerm: "layanan cuci",
    customerTerm: "pelanggan",
    materialTerm: "stok deterjen dan perlengkapan",
    stages: ["penerimaan barang", "pencucian", "pengeringan", "setrika", "siap diambil"],
    intakeTerm: "penerimaan dan penimbangan barang",
    repeat: "mencuci kembali setiap minggu",
    duration: "short",
    vocab: SERVICE_VOCAB,
  },
  {
    id: "servis-elektronik",
    name: "Servis Elektronik & Gadget",
    aka: "servis elektronik",
    model: "recurring-service",
    match: ["servis hp", "service hp", "elektronik", "ac", "kulkas", "laptop", "komputer"],
    jobTerm: "order servis",
    productTerm: "layanan perbaikan",
    customerTerm: "pelanggan",
    materialTerm: "sparepart",
    stages: ["diagnosa", "estimasi biaya", "perbaikan", "pengetesan", "pengambilan"],
    intakeTerm: "diagnosa kerusakan",
    repeat: "kembali saat ada perangkat lain bermasalah",
    duration: "medium",
    vocab: SERVICE_VOCAB,
  },
  {
    id: "salon",
    name: "Salon, Barbershop & Perawatan",
    aka: "salon dan perawatan",
    model: "appointment",
    match: ["salon", "barber", "barbershop", "spa", "nail", "beauty", "make up", "mua"],
    jobTerm: "sesi layanan",
    productTerm: "paket perawatan",
    customerTerm: "pelanggan",
    materialTerm: "stok produk perawatan",
    stages: ["booking", "konsultasi kebutuhan", "pengerjaan", "hasil akhir"],
    intakeTerm: "booking jadwal",
    repeat: "perawatan rutin bulanan",
    duration: "short",
    vocab: APPOINTMENT_VOCAB,
  },
  {
    id: "klinik",
    name: "Klinik & Layanan Kesehatan",
    aka: "layanan kesehatan",
    model: "appointment",
    match: ["klinik", "dokter", "bidan", "terapi", "fisioterapi", "apotek", "praktik", "dental"],
    jobTerm: "kunjungan",
    productTerm: "layanan pemeriksaan",
    customerTerm: "pasien",
    materialTerm: "stok obat dan alat",
    stages: ["pendaftaran", "antrian", "pemeriksaan", "tindakan", "kontrol lanjutan"],
    intakeTerm: "pendaftaran dan penjadwalan",
    repeat: "kontrol lanjutan",
    duration: "short",
    vocab: APPOINTMENT_VOCAB,
  },
  {
    id: "fotografi",
    name: "Fotografi & Videografi",
    aka: "jasa dokumentasi",
    model: "custom-project",
    match: ["fotografer", "fotografi", "videografi", "photo", "video", "studio foto", "prewedding"],
    jobTerm: "project dokumentasi",
    productTerm: "paket foto dan video",
    customerTerm: "client",
    materialTerm: "perlengkapan produksi",
    stages: ["booking jadwal", "sesi pemotretan", "seleksi file", "editing", "penyerahan hasil"],
    intakeTerm: "penentuan konsep dan jadwal",
    repeat: "memesan sesi untuk momen berikutnya",
    duration: "medium",
    vocab: PROJECT_VOCAB,
  },
  {
    id: "event",
    name: "Event & Wedding Organizer",
    aka: "penyelenggaraan acara",
    model: "event",
    match: ["event organizer", "wedding", "eo", "dekorasi", "mc", "organizer", "pernikahan"],
    jobTerm: "acara",
    productTerm: "paket acara",
    customerTerm: "client",
    materialTerm: "perlengkapan dan vendor",
    stages: ["konsultasi konsep", "penyusunan rundown", "persiapan vendor", "hari H", "laporan akhir"],
    intakeTerm: "konsultasi konsep acara",
    repeat: "memakai jasa untuk acara berikutnya",
    duration: "long",
    vocab: PROJECT_VOCAB,
  },
  {
    id: "kuliner",
    name: "Kuliner, Restoran & Catering",
    aka: "kuliner dan catering",
    model: "product-sales",
    match: ["resto", "restoran", "rumah makan", "cafe", "kafe", "coffee", "catering", "kuliner", "kedai", "warung makan"],
    jobTerm: "pesanan",
    productTerm: "menu",
    customerTerm: "pelanggan",
    materialTerm: "stok bahan baku",
    stages: ["pemesanan", "penyiapan", "penyajian atau pengiriman", "pembayaran"],
    intakeTerm: "penerimaan pesanan",
    repeat: "memesan kembali menu favoritnya",
    duration: "short",
    vocab: RETAIL_VOCAB,
  },
  {
    id: "bakery",
    name: "Bakery & Pastry",
    aka: "bakery",
    model: "product-sales",
    match: ["bakery", "pastry", "kue", "roti", "cake", "dessert"],
    jobTerm: "pesanan",
    productTerm: "produk kue",
    customerTerm: "pelanggan",
    materialTerm: "stok bahan baku",
    stages: ["pemesanan", "produksi", "dekorasi", "pengambilan atau pengiriman"],
    intakeTerm: "penerimaan pesanan custom",
    repeat: "memesan untuk momen berikutnya",
    duration: "short",
    vocab: RETAIL_VOCAB,
  },
  {
    id: "retail",
    name: "Retail & Toko Online",
    aka: "toko retail",
    model: "product-sales",
    match: ["toko", "retail", "olshop", "online shop", "butik", "fashion", "minimarket", "konter", "kelontong"],
    jobTerm: "pesanan",
    productTerm: "produk",
    customerTerm: "pembeli",
    materialTerm: "stok barang",
    stages: ["melihat produk", "pemesanan", "pembayaran", "pengiriman"],
    intakeTerm: "pemesanan produk",
    repeat: "belanja ulang",
    duration: "short",
    vocab: RETAIL_VOCAB,
  },
  {
    id: "distributor",
    name: "Distributor, Grosir & Produksi",
    aka: "distribusi barang",
    model: "wholesale",
    match: ["distributor", "grosir", "supplier", "pabrik", "produksi", "sparepart", "keagenan"],
    jobTerm: "order pembelian",
    productTerm: "barang",
    customerTerm: "reseller dan pelanggan",
    materialTerm: "stok gudang",
    stages: ["pemesanan", "pengecekan stok", "penyiapan barang", "pengiriman", "penagihan"],
    intakeTerm: "penerimaan order",
    repeat: "melakukan repeat order rutin",
    duration: "medium",
    vocab: RETAIL_VOCAB,
  },
  {
    id: "properti",
    name: "Properti, Kos & Sewa",
    aka: "properti dan sewa",
    model: "rental",
    match: ["properti", "kos", "kontrakan", "sewa", "rental", "villa", "homestay", "apartemen"],
    jobTerm: "penyewaan",
    productTerm: "unit",
    customerTerm: "penyewa",
    materialTerm: "perlengkapan unit",
    stages: ["pencarian unit", "survey", "kesepakatan sewa", "pembayaran", "perpanjangan"],
    intakeTerm: "survey unit",
    repeat: "memperpanjang masa sewa",
    duration: "medium",
    vocab: RETAIL_VOCAB,
  },
  {
    id: "travel",
    name: "Travel, Tour & Wisata",
    aka: "travel dan wisata",
    model: "event",
    match: ["travel", "tour", "wisata", "open trip", "umroh", "haji", "rental mobil"],
    jobTerm: "trip",
    productTerm: "paket perjalanan",
    customerTerm: "peserta",
    materialTerm: "kuota dan armada",
    stages: ["pemilihan paket", "pendaftaran", "pembayaran", "keberangkatan", "kepulangan"],
    intakeTerm: "pendaftaran peserta",
    repeat: "mengikuti trip berikutnya",
    duration: "medium",
    vocab: APPOINTMENT_VOCAB,
  },
  {
    id: "edukasi",
    name: "Pendidikan, Kursus & Bimbel",
    aka: "lembaga pendidikan",
    model: "membership",
    match: ["kursus", "bimbel", "les", "sekolah", "pelatihan", "training", "akademi", "edukasi"],
    jobTerm: "kelas",
    productTerm: "program belajar",
    customerTerm: "siswa dan orang tua",
    materialTerm: "modul dan perlengkapan belajar",
    stages: ["pendaftaran", "penjadwalan kelas", "kegiatan belajar", "evaluasi", "perpanjangan program"],
    intakeTerm: "pendaftaran siswa",
    repeat: "melanjutkan ke program berikutnya",
    duration: "long",
    vocab: APPOINTMENT_VOCAB,
  },
  {
    id: "fitness",
    name: "Gym, Studio & Komunitas Latihan",
    aka: "tempat latihan",
    model: "membership",
    match: ["gym", "fitness", "yoga", "studio latihan", "muaythai", "futsal", "sport center"],
    jobTerm: "sesi latihan",
    productTerm: "paket keanggotaan",
    customerTerm: "member",
    materialTerm: "alat dan fasilitas",
    stages: ["pendaftaran member", "penjadwalan sesi", "latihan", "evaluasi progress", "perpanjangan"],
    intakeTerm: "pendaftaran member",
    repeat: "memperpanjang keanggotaan",
    duration: "medium",
    vocab: APPOINTMENT_VOCAB,
  },
  {
    id: "agrikultur",
    name: "Pertanian, Peternakan & Produksi UMKM",
    aka: "usaha produksi",
    model: "wholesale",
    match: ["tani", "pertanian", "ternak", "perikanan", "hidroponik", "umkm produksi", "kebun"],
    jobTerm: "order panen",
    productTerm: "hasil produksi",
    customerTerm: "pembeli",
    materialTerm: "stok hasil dan bahan",
    stages: ["perencanaan produksi", "produksi atau panen", "sortir", "pengemasan", "pengiriman"],
    intakeTerm: "penerimaan pesanan",
    repeat: "memesan kembali sesuai musim",
    duration: "medium",
    vocab: RETAIL_VOCAB,
  },
  {
    id: "agency",
    name: "Agency, Konsultan & Jasa Profesional",
    aka: "jasa profesional",
    model: "custom-project",
    match: ["agency", "konsultan", "digital marketing", "notaris", "akuntan", "legal", "software house"],
    jobTerm: "project",
    productTerm: "layanan profesional",
    customerTerm: "client",
    materialTerm: "sumber daya tim",
    stages: ["konsultasi awal", "penyusunan scope", "pengerjaan", "review client", "serah terima"],
    intakeTerm: "konsultasi awal",
    repeat: "melanjutkan ke project berikutnya",
    duration: "long",
    vocab: PROJECT_VOCAB,
  },
];

/** Buang keterangan dalam kurung dan potong nama bisnis yang terlalu panjang. */
export function shortBusinessName(value: string): string {
  const cleaned = value.replace(/\s*\([^)]*\)\s*/g, " ").replace(/\s+/g, " ").trim();
  const base = cleaned || value.trim();
  if (base.length <= 42) return base;
  const cut = base.slice(0, 42);
  return cut.slice(0, cut.lastIndexOf(" ") > 12 ? cut.lastIndexOf(" ") : 42).trim();
}

function normalize(value: string) {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}

/** Deteksi industri dari teks jenis bisnis + konteks brief. */
export function detectIndustryContext(
  businessText: string,
  context = "",
): IndustryContext | null {
  const business = normalize(businessText);
  const full = normalize(`${businessText} ${context}`);
  let best: { ctx: IndustryContext; score: number } | null = null;
  for (const ctx of INDUSTRY_CONTEXTS) {
    let score = 0;
    for (const token of ctx.match) {
      const t = normalize(token);
      if (!t) continue;
      if (business.includes(t)) score += 3;
      else if (full.includes(t)) score += 1;
    }
    if (score > 0 && (!best || score > best.score)) best = { ctx, score };
  }
  return best?.ctx ?? null;
}

/** "desain, produksi, finishing, hingga instalasi" */
export function stagePhrase(ctx: IndustryContext, max = 4): string {
  const stages = ctx.stages.slice(0, max);
  if (stages.length === 1) return stages[0]!;
  return `${stages.slice(0, -1).join(", ")}, hingga ${stages[stages.length - 1]}`;
}

/** BUSINESS MODEL CONTEXT: karakter cara bisnis menghasilkan pendapatan. */
export const BUSINESS_MODEL_NOTE: Record<BusinessModel, string> = {
  "custom-project": "setiap pekerjaan bersifat custom dengan nilai dan durasi yang berbeda",
  "recurring-service": "pekerjaan berulang dengan volume harian yang cukup padat",
  "product-sales": "pendapatan datang dari banyak transaksi bernilai kecil",
  appointment: "pendapatan bergantung pada jadwal dan kapasitas layanan harian",
  event: "pekerjaan terikat tanggal acara sehingga persiapan tidak boleh meleset",
  wholesale: "transaksi berjumlah besar dan berulang dengan pelanggan tetap",
  rental: "pendapatan berbasis masa sewa yang harus dipantau agar tidak terlewat",
  membership: "pendapatan berbasis keanggotaan yang perlu dijaga agar terus diperpanjang",
};

/** FEATURE VOCABULARY MAPPING: nama fitur menyesuaikan industri. */
export function featureNameForIndustry(
  featureId: string,
  fallback: string,
  ctx: IndustryContext | null,
): string {
  if (!ctx?.vocab) return fallback;
  return ctx.vocab[featureId] ?? fallback;
}

/** BUSINESS STAGE AWARENESS: penutup kalimat dampak sesuai tahap bisnis. */
const STAGE_NOTE: Record<BusinessStage, string> = {
  starter: "Pada tahap bisnis sekarang, dampaknya paling terasa untuk membangun kepercayaan dan merapikan pekerjaan sejak awal.",
  growing: "Pada tahap pertumbuhan sekarang, ini menahan beban kerja manual agar tidak ikut membesar bersama jumlah order.",
  established: "Dengan volume yang sudah berjalan, ini menjaga kontrol data dan visibilitas owner tetap terjaga.",
};

type Narrative = { situation: (c: IndustryContext) => string; solution: (c: IndustryContext) => string };

const NARRATIVES: Record<string, Narrative> = {
  notification: {
    situation: (c) =>
      `satu ${c.jobTerm} melewati tahap ${stagePhrase(c)}, sehingga ${c.customerTerm} sering menanyakan perkembangan pekerjaan`,
    solution: (c) =>
      `Notifikasi otomatis mengabari setiap kali ${c.jobTerm} berpindah tahap, jadi owner tidak perlu membalas pertanyaan progress satu per satu`,
  },
  "status-tracking": {
    situation: (c) =>
      `pengerjaan tidak selesai dalam sekali proses dan harus melewati ${stagePhrase(c)}`,
    solution: (c) =>
      `Status pengerjaan yang terbuka membuat ${c.customerTerm} dapat melihat sendiri posisi ${c.jobTerm} miliknya tanpa perlu bertanya`,
  },
  "digital-nota": {
    situation: (c) =>
      `pembayaran sering berjalan bertahap dan bukti transaksi ${c.jobTerm} masih ditulis manual`,
    solution: () =>
      `Nota dan invoice digital membuat setiap pembayaran tercatat rapi, mudah dikirim ulang, dan tidak mudah hilang`,
  },
  "order-management": {
    situation: (c) =>
      `${c.jobTerm} masuk dari beberapa jalur sekaligus sehingga mudah tercecer saat ${c.intakeTerm}`,
    solution: (c) =>
      `Pencatatan ${c.jobTerm} dalam satu sistem membuat pekerjaan yang berjalan, tertunda, dan selesai selalu terlihat jelas`,
  },
  "customer-history": {
    situation: (c) => `${c.customerTerm} lama biasanya kembali untuk ${c.repeat}`,
    solution: (c) =>
      `Riwayat pekerjaan per ${c.customerTerm} memudahkan owner menawarkan kelanjutan tanpa membuka catatan lama`,
  },
  "database-customer": {
    situation: (c) => `data ${c.customerTerm} masih tersebar di chat dan catatan pribadi`,
    solution: (c) =>
      `Database pelanggan menyimpan kebutuhan dan kontak ${c.customerTerm} di satu tempat sehingga follow up jauh lebih mudah`,
  },
  "riwayat-transaksi": {
    situation: (c) => `nilai tiap ${c.jobTerm} berbeda-beda dan tercatat terpisah`,
    solution: (c) =>
      `Riwayat ${c.jobTerm} yang tersimpan membuat owner bisa menelusuri kembali pekerjaan dan pembayaran kapan pun dibutuhkan`,
  },
  "laporan-penjualan": {
    situation: (c) => `owner perlu tahu berapa ${c.jobTerm} yang masuk dan selesai setiap bulan`,
    solution: () =>
      `Laporan otomatis merangkum angka tersebut tanpa harus merekap manual di akhir bulan`,
  },
  "dashboard-admin": {
    situation: (c) => `beberapa ${c.jobTerm} berjalan bersamaan pada tahap yang berbeda`,
    solution: (c) =>
      `Dashboard menampilkan seluruh ${c.jobTerm} beserta posisinya dalam satu layar, sehingga owner tidak kehilangan kendali`,
  },
  katalog: {
    situation: (c) => `${c.customerTerm} ingin melihat pilihan ${c.productTerm} sebelum menghubungi bisnis`,
    solution: () =>
      `Katalog online membuat pilihan tersusun rapi dan mengurangi pertanyaan berulang di chat`,
  },
  portfolio: {
    situation: (c) => `keputusan ${c.customerTerm} sangat dipengaruhi bukti hasil kerja sebelumnya`,
    solution: () =>
      `Portfolio yang tertata membuat calon customer menilai kualitas lebih dulu sebelum bertanya harga`,
  },
  testimonial: {
    situation: (c) => `${c.customerTerm} baru biasanya mencari keyakinan sebelum memutuskan`,
    solution: () => `Testimoni pelanggan sebelumnya mempersingkat proses meyakinkan calon customer`,
  },
  faq: {
    situation: () => `pertanyaan awal yang masuk hampir selalu berulang`,
    solution: () => `Halaman FAQ menjawab pertanyaan tersebut lebih dulu sehingga chat masuk lebih berkualitas`,
  },
  booking: {
    situation: (c) => `${c.intakeTerm} masih diatur manual lewat chat`,
    solution: (c) =>
      `Booking online membuat jadwal ${c.jobTerm} tersusun otomatis dan mengurangi bentrok`,
  },
  "schedule-management": {
    situation: (c) => `beberapa ${c.jobTerm} berjalan bersamaan dan membutuhkan pembagian jadwal tim`,
    solution: () => `Penjadwalan internal membuat pekerjaan harian tersusun dan tidak ada yang terlewat`,
  },
  inventory: {
    situation: (c) => `ketersediaan ${c.materialTerm} menentukan pekerjaan bisa jalan atau tertunda`,
    solution: () => `Pencatatan stok membantu menghindari kekurangan bahan di tengah pengerjaan`,
  },
  cms: {
    situation: (c) => `informasi ${c.productTerm} berubah seiring waktu`,
    solution: () => `Panel konten membuat owner bisa memperbarui sendiri tanpa bergantung pada developer`,
  },
  "form-konsultasi": {
    situation: (c) => `kebutuhan ${c.customerTerm} sering baru lengkap setelah bolak-balik bertanya`,
    solution: () => `Form kebutuhan terstruktur membuat informasi masuk lengkap sejak awal`,
  },
  maps: {
    situation: () => `sebagian customer tetap ingin datang langsung ke lokasi`,
    solution: () => `Peta lokasi memudahkan mereka menemukan tempat tanpa perlu bertanya arah`,
  },
  whatsapp: {
    situation: (c) => `${c.customerTerm} ingin langsung terhubung saat tertarik`,
    solution: () => `Tombol WhatsApp langsung memperpendek jarak dari melihat menjadi bertanya`,
  },
  "social-media": {
    situation: () => `aktivitas terbaru bisnis lebih sering terlihat di media sosial`,
    solution: () => `Integrasi konten sosial membuat website ikut terlihat aktif dan terpercaya`,
  },
  search: {
    situation: (c) => `jumlah ${c.productTerm} terus bertambah`,
    solution: () => `Fitur pencarian mempercepat customer menemukan yang dicari`,
  },
  membership: {
    situation: (c) => `${c.customerTerm} yang puas berpotensi ${c.repeat}`,
    solution: () => `Program membership menjaga hubungan tersebut tetap berjalan dan terukur`,
  },
  "multi-user": {
    situation: () => `pekerjaan tidak lagi ditangani satu orang saja`,
    solution: () => `Hak akses terpisah menjaga data tetap aman meski dikerjakan bersama tim`,
  },
  crm: {
    situation: (c) => `prospek ${c.customerTerm} masuk lebih banyak daripada yang bisa diingat`,
    solution: () => `Pengelolaan prospek memastikan tidak ada calon customer yang terlewat difollow up`,
  },
  automation: {
    situation: () => `beberapa pekerjaan administratif dilakukan berulang setiap hari`,
    solution: () => `Otomatisasi memangkas pekerjaan berulang tersebut agar waktu owner lebih efektif`,
  },
  api: {
    situation: () => `sudah ada sistem lain yang berjalan di sisi bisnis`,
    solution: () => `Integrasi membuat data tidak perlu diinput dua kali pada sistem berbeda`,
  },
  "company-profile": {
    situation: (c) => `${c.customerTerm} mencari informasi bisnis secara online sebelum menghubungi`,
    solution: () => `Profil bisnis yang lengkap membuat kesan pertama terlihat profesional`,
  },
  "landing-page": {
    situation: () => `promosi membutuhkan halaman tujuan yang fokus`,
    solution: () => `Landing page mengarahkan pengunjung iklan langsung ke satu aksi yang jelas`,
  },
};

export type IndustryVoice = {
  reason: string;
  impact: string;
  relation: string | null;
};

/**
 * Menulis penjelasan Potential Feature / Core Solution memakai kosakata
 * industri customer. Bila industri tidak dikenali, pemanggil memakai kalimat
 * lama sebagai fallback (fungsi ini mengembalikan null).
 */
export function describeFeatureForIndustry(input: {
  featureId: string;
  featureName: string;
  featureFn: string;
  benefit: string;
  business: string;
  ctx: IndustryContext | null;
  stage: BusinessStage;
  relation?: "enhancement" | "complementary" | null;
  /** BUSINESS STAGE AWARENESS: kalimat tahap bisnis hanya untuk item pertama. */
  withStageNote?: boolean;
  relatedTo?: string | null;
}): IndustryVoice | null {
  const { ctx } = input;
  if (!ctx) return null;
  const rawBusiness = input.business?.trim() || `bisnis ${ctx.aka}`;
  // Nama bisnis dipendekkan agar kalimat tidak berulang panjang di tiap item.
  const business = shortBusinessName(rawBusiness);
  const narrative = NARRATIVES[input.featureId];
  const situation = narrative
    ? narrative.situation(ctx)
    : `${BUSINESS_MODEL_NOTE[ctx.model]} dan setiap ${ctx.jobTerm} melewati ${stagePhrase(ctx)}`;
  const solution = narrative
    ? narrative.solution(ctx)
    : `${input.featureName} membantu bagian tersebut agar tidak lagi dikerjakan manual`;

  const akaPhrase = /^(bisnis|usaha) /i.test(ctx.aka) ? ctx.aka : `bisnis ${ctx.aka}`;
  const reason = `Pada ${akaPhrase} seperti ${business}, ${situation}. ${solution}.`;
  const impact = input.withStageNote
    ? `${input.benefit} ${STAGE_NOTE[input.stage]}`
    : input.benefit;

  let relation: string | null = null;
  if (input.relatedTo) {
    relation =
      input.relation === "enhancement"
        ? `Memperkuat ${input.relatedTo} yang sudah ada pada scope, terutama saat ${ctx.jobTerm} memasuki tahap ${ctx.stages[Math.min(2, ctx.stages.length - 1)]}.`
        : `Kelanjutan wajar setelah ${input.relatedTo}, mengikuti alur ${stagePhrase(ctx, 5)} yang dijalankan ${business}.`;
  }

  return { reason, impact, relation };
}
