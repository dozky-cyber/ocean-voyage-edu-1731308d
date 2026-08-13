/**
 * BUSINESS FLOW PATTERN LIBRARY (Team KERJAKU Consultant).
 *
 * Sebelum memilih fitur, konsultan wajib memahami ALUR BISNIS customer:
 *   Customer datang dari mana -> bagaimana transaksi terjadi -> bagaimana
 *   pekerjaan diselesaikan -> bagaimana pembayaran dilakukan -> bagaimana
 *   bisnis mempertahankan customer.
 *
 * Pattern di bawah dipakai sebagai referensi prioritas fitur, BUKAN checklist.
 * Fitur yang tidak memperbaiki alur bisnis customer harus dibuang.
 */

export type BusinessFlowPatternId =
  | "retail"
  | "process-status"
  | "service-appointment"
  | "distribution"
  | "culinary";

export type BusinessFlowPattern = {
  id: BusinessFlowPatternId;
  name: string;
  /** Alur bisnis utama (dipakai sebagai konteks konsultasi). */
  flow: string[];
  /** Masalah umum pada pola bisnis ini. */
  problems: string[];
  /** Kata kunci jenis bisnis. */
  match: string[];
  /** Fitur prioritas (id pada consultant library). */
  priority: string[];
  /** Fitur yang hanya relevan bila skala/kondisi bisnis membutuhkannya. */
  conditional: string[];
  /** Fitur yang BUKAN prioritas pada pola bisnis ini. */
  notPriority: string[];
};

export const BUSINESS_FLOW_PATTERNS: BusinessFlowPattern[] = [
  {
    id: "retail",
    name: "Retail / Toko / Warung / Konter / Toko Online",
    flow: [
      "Customer melihat produk",
      "Customer memilih barang",
      "Customer melakukan pembelian",
      "Bisnis mencatat transaksi",
      "Customer melakukan pembayaran",
      "Bisnis memberikan nota",
      "Customer melakukan repeat order",
    ],
    problems: [
      "Produk belum tersusun online",
      "Transaksi masih dicatat manual",
      "Sulit melihat riwayat penjualan",
      "Nota masih ditulis manual",
      "Lokasi toko sulit dijangkau / minim informasi",
    ],
    match: [
      "toko",
      "retail",
      "minimarket",
      "warung",
      "kelontong",
      "fashion",
      "konter",
      "pulsa",
      "elektronik",
      "olshop",
      "online shop",
      "toko online",
    ],
    priority: [
      "katalog",
      "order-management",
      "riwayat-transaksi",
      "digital-nota",
      "laporan-penjualan",
      "maps",
      "database-customer",
    ],
    conditional: ["inventory", "search"],
    notPriority: ["booking", "form-konsultasi", "portfolio", "testimonial"],
  },
  {
    id: "process-status",
    name: "Laundry / Bisnis dengan Status Proses",
    flow: [
      "Customer melakukan order",
      "Bisnis menerima barang",
      "Order dicatat",
      "Barang diproses",
      "Status pekerjaan berubah",
      "Customer menerima informasi selesai",
      "Pembayaran dan nota",
      "Repeat order",
    ],
    problems: [
      "Pencatatan manual",
      "Sulit mengetahui status pekerjaan",
      "Customer sering bertanya progress",
      "Riwayat pelanggan tidak tersimpan",
    ],
    match: ["laundry", "cuci", "cleaning service", "sepatu", "kiloan"],
    priority: [
      "order-management",
      "status-tracking",
      "digital-nota",
      "riwayat-transaksi",
      "dashboard-admin",
      "database-customer",
      "customer-history",
      "notification",
      "laporan-penjualan",
    ],
    conditional: ["inventory", "search"],
    notPriority: ["portfolio", "membership"],
  },
  {
    id: "service-appointment",
    name: "Jasa / Service / Appointment Business",
    flow: [
      "Customer mencari jasa",
      "Customer melakukan konsultasi / booking",
      "Bisnis menentukan jadwal",
      "Pekerjaan dikerjakan",
      "Hasil diberikan",
      "Pembayaran dan nota",
      "Repeat order",
    ],
    problems: [
      "Jadwal masih manual",
      "Data customer tidak tersimpan",
      "Sulit follow up pelanggan lama",
      "Portfolio tidak tersusun",
    ],
    match: [
      "bengkel",
      "mekanik",
      "service",
      "servis",
      "ac",
      "fotografer",
      "photo",
      "salon",
      "barber",
      "konsultan",
      "catering custom",
      "dokter",
      "bidan",
      "klinik",
      "terapi",
      "spa",
      "travel",
      "tour",
      "wisata",
      "properti",
      "event organizer",
      "wedding organizer",
    ],
    priority: [
      "booking",
      "form-konsultasi",
      "database-customer",
      "customer-history",
      "portfolio",
      "digital-nota",
      "maps",
      "testimonial",
    ],
    // Schedule Management = pengaturan jadwal internal bisnis (bukan booking).
    conditional: ["inventory", "notification", "schedule-management", "status-tracking"],
    notPriority: ["search", "multi-user"],
  },
  {
    id: "distribution",
    name: "Distributor / Agen / Grosir / Produksi",
    flow: [
      "Customer melakukan pemesanan",
      "Bisnis mengecek ketersediaan barang",
      "Gudang menyiapkan barang",
      "Barang dikirim",
      "Transaksi dicatat",
      "Invoice dibuat",
      "Repeat order",
    ],
    problems: [
      "Kontrol stok sulit",
      "Banyak transaksi dan customer",
      "Data penjualan tidak terstruktur",
      "Banyak SKU dan merk",
    ],
    // "agen" saja terlalu luas (agen travel / agen properti bukan distribusi barang).
    match: [
      "distributor",
      "supplier",
      "agen grosir",
      "agen sembako",
      "agen distributor",
      "keagenan",
      "grosir",
      "pabrik",
      "produksi",
      "sparepart",
    ],
    priority: [
      "inventory",
      "order-management",
      "riwayat-transaksi",
      "digital-nota",
      "database-customer",
      "dashboard-admin",
      "laporan-penjualan",
    ],
    conditional: ["multi-user", "automation", "search"],
    notPriority: ["portfolio", "booking", "testimonial"],
  },
  {
    id: "culinary",
    name: "Kuliner / Restoran / Catering",
    flow: [
      "Customer melihat menu",
      "Customer memilih produk",
      "Customer melakukan order",
      "Bisnis menyiapkan pesanan",
      "Pembayaran dan nota",
      "Repeat order",
    ],
    problems: [
      "Order masuk melalui chat bercampur",
      "Menu tidak terstruktur",
      "Sulit melihat transaksi",
      "Nota manual",
    ],
    match: [
      "bakery",
      "pastry",
      "cafe",
      "kafe",
      "coffee",
      "catering",
      "resto",
      "restoran",
      "rumah makan",
      "kuliner",
      "warung makan",
      "kedai",
],
    priority: [
      "katalog",
      "order-management",
      "digital-nota",
      "riwayat-transaksi",
      "laporan-penjualan",
      "database-customer",
    ],
    conditional: ["booking", "form-konsultasi", "inventory", "status-tracking", "schedule-management"],
    notPriority: ["portfolio", "multi-user"],
  },
];

function normalize(value: string) {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}

/** Deteksi pola alur bisnis dari teks jenis bisnis + konteks brief. */
export function detectBusinessFlowPattern(
  businessText: string,
  context = "",
): BusinessFlowPattern | null {
  const business = normalize(businessText);
  const full = normalize(`${businessText} ${context}`);
  let best: { pattern: BusinessFlowPattern; score: number } | null = null;
  for (const pattern of BUSINESS_FLOW_PATTERNS) {
    let score = 0;
    for (const token of pattern.match) {
      const t = normalize(token);
      if (!t) continue;
      if (business.includes(t)) score += 3;
      else if (full.includes(t)) score += 1;
    }
    if (score > 0 && (!best || score > best.score)) best = { pattern, score };
  }
  return best?.pattern ?? null;
}

/** Ringkasan alur bisnis untuk prompt / dokumen konsultasi. */
export function describeBusinessFlow(pattern: BusinessFlowPattern): string {
  return `${pattern.name}: ${pattern.flow.join(" -> ")}`;
}
