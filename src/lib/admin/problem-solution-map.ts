/**
 * KERJAKU PROBLEM → SOLUTION MAP (Consultant Engine V4).
 *
 * Prinsip:
 *   CORE SOLUTION     = fitur yang LANGSUNG menyelesaikan masalah yang customer sebut.
 *   POTENTIAL FEATURE = fitur pengembangan SETELAH masalah utama selesai.
 *
 * Peta ini hanya membaca teks Order Brief (business problem, tujuan, proses
 * operasional). Tidak ada fitur yang otomatis wajib: sebuah fitur menjadi core
 * hanya bila sinyal masalahnya benar-benar muncul pada brief.
 */

import { detectBusinessFlowPattern } from "./business-flow-patterns";

export type ProblemRule = {
  /** Label masalah yang dipakai pada dokumen ("Menyelesaikan: ..."). */
  problem: string;
  /** Sinyal teks pada brief. */
  tokens: string[];
  /** Fitur yang langsung menyelesaikan masalah ini. */
  core: string[];
  /** Pengembangan lanjutan setelah masalah ini selesai. */
  growth?: string[];
};

export const PROBLEM_RULES: ProblemRule[] = [
  {
    problem: "Pencatatan order masih manual",
    tokens: [
      "catat manual",
      "catat penjualan",
      "catat transaksi",
      "dicatat manual",
      "tulis manual",
      "ditulis manual",
      "pencatatan manual",
      "pencatatan penjualan",
      "pencatatan transaksi",
      "manual buku",
      "manual di buku",
      "buku tulis",
      "masih dicatat",
      "pesanan tertukar",
      "order tertukar",
      "order manual",
      "pesanan manual",
      "pencatatan order",
      "data order",
      "excel manual",
    ],
    core: ["order-management"],
    growth: ["laporan-penjualan", "riwayat-transaksi"],
  },
  {
    problem: "Status pekerjaan sulit dipantau",
    tokens: [
      "status cucian",
      "status pesanan",
      "status order",
      "status pekerjaan",
      "progress",
      "pelacakan status",
      "tracking",
      "tanya status",
      "bertanya terus",
      "sudah selesai belum",
    ],
    core: ["status-tracking"],
    growth: ["notification"],
  },
  {
    problem: "Bukti transaksi belum rapi",
    tokens: ["nota", "invoice", "struk", "kwitansi", "bukti transaksi", "bukti pembayaran", "tagihan"],
    core: ["digital-nota"],
    growth: ["riwayat-transaksi"],
  },
  {
    problem: "Customer sulit melakukan pemesanan",
    tokens: [
      "mudah memesan",
      "mudah melakukan pemesanan",
      "sulit memesan",
      "pesan online",
      "pemesanan online",
      "order online",
      "booking",
      "reservasi",
      "jadwal pickup",
      "antar jemput",
    ],
    core: ["booking"],
    growth: ["notification"],
  },
  {
    problem: "Operasional harian belum terpantau",
    tokens: [
      "operasional lebih rapi",
      "operasional tidak efisien",
      "operasional berantakan",
      "merapikan operasional",
      "memantau pekerjaan",
      "pantau order",
      "kontrol pekerjaan",
      "kelola operasional",
      "monitoring harian",
    ],
    core: ["dashboard-admin"],
    growth: ["laporan-penjualan"],
  },
  {
    problem: "Informasi produk/layanan sulit disampaikan",
    tokens: [
      "katalog",
      "daftar produk",
      "daftar layanan",
      "menu",
      "harga layanan",
      "belum ada website",
      "informasi produk",
    ],
    core: ["katalog"],
    growth: ["search"],
  },
  {
    problem: "Data pelanggan belum tersimpan",
    tokens: [
      "data pelanggan",
      "database pelanggan",
      "data customer",
      "pelanggan tidak tercatat",
      "kehilangan data pelanggan",
    ],
    core: ["database-customer"],
    growth: ["customer-history", "membership"],
  },
  {
    problem: "Pelanggan lama sulit di-follow up",
    tokens: ["repeat order", "pelanggan lama", "follow up", "pelanggan kembali", "retensi", "loyalitas"],
    core: ["customer-history"],
    growth: ["notification", "membership"],
  },
  {
    problem: "Laporan bisnis masih manual",
    tokens: ["laporan manual", "laporan penjualan", "rekap", "omzet", "pemasukan", "laporan bulanan"],
    core: ["laporan-penjualan"],
    growth: [],
  },
  {
    problem: "Jadwal pekerjaan sering bentrok",
    tokens: [
      "bentrok",
      "jadwal bentrok",
      "bentrok jadwal",
      "atur jadwal",
      "penjadwalan",
      "jadwal pekerjaan",
      "jadwal team",
      "jadwal pasien",
      "jadwal servis",
    ],
    core: ["schedule-management"],
    growth: ["notification"],
  },
  {
    problem: "Stok barang sulit dikontrol",
    tokens: ["stok", "persediaan", "gudang", "restock", "kehabisan barang"],
    core: ["inventory"],
    growth: ["laporan-penjualan"],
  },
  {
    problem: "Konten website sulit diperbarui",
    tokens: ["update konten", "ubah konten sendiri", "cms", "kelola konten", "update harga sendiri"],
    core: ["cms"],
    growth: [],
  },
  {
    problem: "Hak akses karyawan perlu dibedakan",
    tokens: [
      "hak akses",
      "akses berbeda",
      "role",
      "level user",
      "pembagian akses",
      "akses karyawan",
      "multi user",
    ],
    core: ["multi-user"],
    growth: [],
  },
];

/** Pengembangan default per pola alur bisnis (dipakai bila core sudah ada). */
const PATTERN_GROWTH: Record<string, string[]> = {
  retail: ["notification", "database-customer", "laporan-penjualan"],
  "process-status": ["notification", "database-customer", "laporan-penjualan"],
  "service-appointment": ["notification", "customer-history", "laporan-penjualan"],
  distribution: ["laporan-penjualan", "database-customer", "riwayat-transaksi"],
  culinary: ["notification", "database-customer", "laporan-penjualan"],
};

export type ProblemSolutionPlan = {
  /** featureId -> label masalah yang diselesaikan. */
  core: Map<string, string>;
  /** featureId -> core feature yang menjadi prasyarat pengembangannya. */
  growth: Map<string, string | null>;
};

function matches(haystack: string, tokens: string[]) {
  return tokens.some((token) => token && haystack.includes(token));
}

/**
 * Membaca masalah pada brief dan memisahkan fitur menjadi core (penyelesai
 * masalah) dan growth (pengembangan lanjutan).
 */
export function buildProblemSolutionPlan(input: {
  businessText: string;
  problemText: string;
  goalText?: string;
  context: string;
}): ProblemSolutionPlan {
  const norm = (v: string) => v.toLowerCase().replace(/\s+/g, " ").trim();
  const problemScope = norm(`${input.problemText} ${input.goalText ?? ""}`);
  const full = norm(`${input.businessText} ${input.problemText} ${input.goalText ?? ""} ${input.context}`);

  const core = new Map<string, string>();
  const growth = new Map<string, string | null>();

  for (const rule of PROBLEM_RULES) {
    // Core hanya boleh berasal dari masalah/tujuan yang customer sebut sendiri.
    if (!matches(problemScope, rule.tokens) && !matches(full, rule.tokens)) continue;
    const fromProblem = matches(problemScope, rule.tokens);
    if (!fromProblem) continue;
    for (const id of rule.core) if (!core.has(id)) core.set(id, rule.problem);
    for (const id of rule.growth ?? []) if (!growth.has(id)) growth.set(id, rule.core[0] ?? null);
  }

  // Fallback pengembangan berdasarkan pola alur bisnis, hanya bila ada core.
  const pattern = detectBusinessFlowPattern(input.businessText, input.context);
  if (core.size && pattern) {
    for (const id of PATTERN_GROWTH[pattern.id] ?? []) {
      if (!core.has(id) && !growth.has(id)) growth.set(id, null);
    }
  }

  // Sebuah fitur tidak boleh berada di dua kategori sekaligus.
  for (const id of core.keys()) growth.delete(id);

  return { core, growth };
}
