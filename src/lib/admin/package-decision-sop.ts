// KERJAKU PACKAGE DECISION SOP
// =============================
// Keputusan package TIDAK ditentukan oleh banyaknya fitur, melainkan oleh
// tingkat kompleksitas bisnis. File ini adalah satu-satunya sumber aturan
// package untuk PDF Order Brief, engine rekomendasi fitur, dan chatbot.
//
// LEVEL 1 — BASIC SYSTEM
//   Bisnis butuh kehadiran digital. Owner sendiri, tanpa proses operasional,
//   tanpa pengelolaan data transaksi.
//   Contoh: florist sederhana, portfolio fotografer, jasa desain, company profile.
//   Cocok: company profile, landing page, katalog sederhana, gallery, WhatsApp,
//   sosial media, Maps. Tidak cocok: dashboard operasional, multi user, transaksi.
//
// LEVEL 2 — PROFESSIONAL SYSTEM
//   Bisnis berjalan dan butuh pengelolaan konten atau customer. Owner masih
//   mengelola sendiri, customer bisa berulang, belum butuh sistem operasional berat.
//   Cocok: CMS, database customer, portfolio, testimonial, form konsultasi,
//   booking sederhana. Tidak otomatis multi user.
//
// LEVEL 3 — BUSINESS SYSTEM
//   Bisnis punya proses operasional harian: order masuk, dikerjakan, dibayar.
//   Boleh punya karyawan, tetapi tetap SATU unit bisnis.
//   Cocok: order management, status tracking, digital nota, dashboard operasional,
//   customer history, report sederhana, multi user sederhana bila ada team.
//   PENTING: owner + beberapa karyawan BUKAN Enterprise.
//
// LEVEL 4 — ENTERPRISE SYSTEM
//   Sistem untuk organisasi kompleks. Butuh minimal DUA kondisi organisasi:
//     1. Multi lokasi / banyak cabang dengan kontrol pusat.
//     2. Struktur berjenjang (manager, supervisor, admin cabang) + approval.
//     3. User besar (>= 50) atau banyak divisi.
//     4. Integrasi sistem perusahaan nyata (ERP, accounting, warehouse, API).
//   HARD BLOCK: 1 outlet/cabang/lokasi, user <= 25 tanpa struktur berjenjang,
//   atau skala personal. Punya dashboard/database/laporan/5 karyawan/automation
//   sederhana TIDAK PERNAH menjadi alasan Enterprise.

import type { OrderBriefData } from "../order-brief";

export type PackageLevel = "basic" | "professional" | "business" | "enterprise";

export const LEVEL_RANK: Record<PackageLevel, number> = {
  basic: 0,
  professional: 1,
  business: 2,
  enterprise: 3,
};

export type PackageDecision = {
  level: PackageLevel;
  /** Sinyal yang membuat level naik (untuk penjelasan pada PDF). */
  signals: string[];
  /** Alasan Enterprise dikunci (kosong bila Enterprise lolos). */
  blockedReasons: string[];
  /** Kalimat alasan siap pakai untuk PDF Order Brief. */
  rationale: string;
  /** Enterprise boleh dipakai (package maupun fitur bertier enterprise). */
  allowEnterprise: boolean;
};

function normalize(value: string) {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}

function hasAny(context: string, tokens: string[]) {
  return tokens.some((token) => context.includes(normalize(token)));
}

const PROFESSIONAL_SIGNALS = [
  "cms",
  "update konten",
  "kelola konten",
  "ubah konten sendiri",
  "database customer",
  "data pelanggan",
  "data customer",
  "crm",
  "lead",
  "follow up",
  "booking",
  "reservasi",
  "jadwal konsultasi",
  "member",
  "testimoni",
  "form konsultasi",
  "customer berulang",
  "repeat order",
  "portfolio",
];

const BUSINESS_SIGNALS = [
  "order masuk",
  "pesanan masuk",
  "order management",
  "manajemen order",
  "pesanan",
  "transaksi",
  "kasir",
  "pos",
  "invoice",
  "nota",
  "tagihan",
  "billing",
  "pembayaran",
  "payment gateway",
  "checkout",
  "keranjang",
  "status pengerjaan",
  "status pesanan",
  "tracking",
  "antrian",
  "progress",
  "laporan harian",
  "laporan penjualan",
  "riwayat transaksi",
  "stok",
  "inventory",
  "karyawan",
  "staff",
  "team",
  "admin",
  "shift",
  "operasional harian",
  "workflow",
  "dashboard",
];

const MULTI_BRANCH = [
  "multi cabang",
  "multi-cabang",
  "banyak cabang",
  "beberapa cabang",
  "multi lokasi",
  "multi-lokasi",
  "banyak lokasi",
  "beberapa lokasi",
  "antar cabang",
  "per cabang",
  "cabang jakarta",
  "franchise",
  "holding",
  "kantor pusat",
];

const COMPLEX_ORG = [
  "banyak divisi",
  "antar divisi",
  "supervisor",
  "manager pusat",
  "manajer pusat",
  "admin cabang",
  "approval",
  "persetujuan berjenjang",
  "hak akses berbeda",
  "banyak role",
  "multi role",
  "struktur organisasi",
  "struktur berjenjang",
];

const REAL_INTEGRATION = [
  "integrasi api",
  "api eksternal",
  "integrasi sistem",
  "integrasi dengan sistem",
  "sinkron dengan sistem",
  "sinkronisasi data",
  "erp",
  "sap",
  "middleware",
  "accounting system",
  "software akuntansi",
  "warehouse system",
];

const SINGLE_LOCATION = [
  "1 outlet",
  "satu outlet",
  "1 cabang",
  "satu cabang",
  "1 lokasi",
  "satu lokasi",
  "1 toko",
  "satu toko",
  "tanpa cabang",
  "belum ada cabang",
];

const PERSONAL_SCALE = [
  "personal",
  "perorangan",
  "dikelola sendiri",
  "dikelola personal",
  "owner sendiri",
  "1 user",
  "satu user",
  "tanpa karyawan",
  "tidak ada karyawan",
  "tidak ada admin",
];

/** Ambil jumlah user terbesar yang tersirat pada brief. */
function maxUserCount(text: string) {
  const numbers = (text.match(/\b\d{1,4}\b/g) ?? []).map(Number).filter((n) => n <= 5000);
  return numbers.length ? Math.max(...numbers) : 0;
}

/**
 * Decision engine SOP: tentukan level package dari karakter bisnis pada brief.
 */
export function decidePackageLevel(brief: OrderBriefData, contextText?: string): PackageDecision {
  const context = normalize(
    contextText ??
      [
        brief.business,
        brief.project,
        brief.goal,
        brief.adminNeeds,
        brief.usersScale,
        ...(brief.features ?? []),
        ...(brief.problems ?? []),
      ]
        .filter(Boolean)
        .join(" | "),
  );
  const scale = normalize(`${brief.usersScale ?? ""} | ${brief.adminNeeds ?? ""}`);
  const all = `${context} | ${scale}`;

  const signals: string[] = [];
  let level: PackageLevel = "basic";

  // LEVEL 2 — pengelolaan konten / customer.
  if (hasAny(all, PROFESSIONAL_SIGNALS)) {
    level = "professional";
    signals.push("kebutuhan pengelolaan konten atau data customer");
  }

  // LEVEL 3 — proses operasional harian.
  if (hasAny(all, BUSINESS_SIGNALS)) {
    level = "business";
    signals.push("adanya proses operasional harian (order, pengerjaan, atau transaksi)");
  }

  // LEVEL 4 — kompleksitas organisasi.
  const multiBranch = hasAny(all, MULTI_BRANCH);
  const complexOrg = hasAny(all, COMPLEX_ORG);
  const users = maxUserCount(all);
  const bigUsers =
    users >= 50 || hasAny(all, ["lebih dari 100", "ratusan", "ribuan", "puluhan user"]);
  const realIntegration = hasAny(all, REAL_INTEGRATION);
  const personal = hasAny(all, PERSONAL_SCALE);
  const singleLocation = hasAny(all, SINGLE_LOCATION) && !multiBranch;
  const smallUsers = !bigUsers && users > 0 && users <= 25;

  const blockedReasons: string[] = [];
  if (personal) blockedReasons.push("bisnis dikelola secara personal tanpa struktur team");
  if (singleLocation) blockedReasons.push("operasional masih pada satu lokasi/outlet");
  if (smallUsers && !multiBranch && !complexOrg)
    blockedReasons.push("jumlah pengguna sistem masih kecil dengan role sederhana");

  const orgSignals = [multiBranch, complexOrg, bigUsers, realIntegration].filter(Boolean).length;
  const allowEnterprise = blockedReasons.length === 0 && orgSignals >= 2;

  if (allowEnterprise) {
    level = "enterprise";
    if (multiBranch) signals.push("operasional multi lokasi/cabang");
    if (complexOrg) signals.push("struktur organisasi berjenjang dengan hak akses berbeda");
    if (bigUsers) signals.push("jumlah pengguna sistem berskala besar");
    if (realIntegration) signals.push("kebutuhan integrasi dengan sistem perusahaan lain");
  } else if (orgSignals < 2 && blockedReasons.length === 0) {
    blockedReasons.push(
      "kompleksitas organisasi belum terpenuhi (belum multi cabang, belum berjenjang, dan belum berskala besar)",
    );
  }

  const rationale = buildRationale(brief, level, signals, blockedReasons);
  return { level, signals, blockedReasons, rationale, allowEnterprise };
}

function levelCharacter(level: PackageLevel) {
  switch (level) {
    case "basic":
      return "kebutuhan utama masih pada kehadiran digital agar bisnis mudah dikenal dan dihubungi customer";
    case "professional":
      return "bisnis sudah berjalan dan membutuhkan pengelolaan konten serta data customer, namun belum memerlukan sistem operasional berat";
    case "business":
      return "bisnis sudah memiliki proses operasional harian yang perlu dirapikan (order masuk, pengerjaan, hingga pembayaran) pada satu unit bisnis";
    default:
      return "sistem dibutuhkan untuk mengelola organisasi yang kompleks";
  }
}

function buildRationale(
  brief: OrderBriefData,
  level: PackageLevel,
  signals: string[],
  blockedReasons: string[],
) {
  const parts: string[] = [];
  parts.push(`Dari brief terlihat bahwa ${levelCharacter(level)}.`);
  if (signals.length) {
    parts.push(`Dasar penilaian: ${signals.join("; ")}.`);
  }
  const scale = brief.usersScale?.trim();
  if (scale) parts.push(`Cakupan pengguna sistem: ${scale}.`);
  // Enterprise gating remains an internal decision signal. Its diagnostic
  // details are intentionally omitted from customer-facing Order Brief copy.
  return parts.join(" ");
}
