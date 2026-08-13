import { selectConsultantFeatures } from "../src/lib/admin/consultant-library";
import { decidePackageLevel } from "../src/lib/admin/package-decision-sop";

type S = {
  name: string;
  business: string;
  problem: string;
  goal?: string;
  context: string;
  scale: string;
  features?: string[];
  expectCore: string[];
  forbid: string[];
};

const S: S[] = [
  { name: "Laundry kiloan", business: "Laundry kiloan", problem: "Order dicatat manual di buku, pesanan tertukar, customer sering tanya status cucian sudah selesai belum", goal: "Operasional lebih rapi dan customer mudah memesan", context: "1 outlet, owner dan 4 karyawan, order via whatsapp", scale: "owner dan 4 karyawan", expectCore: ["order-management", "status-tracking"], forbid: ["inventory", "crm", "api-integration"] },
  { name: "Florist", business: "Toko bunga / florist", problem: "Belum ada website, customer sulit melihat daftar produk dan sulit memesan", goal: "Customer bisa pesan online", context: "dikelola personal, tanpa karyawan", scale: "Tidak (dikelola personal)", expectCore: ["katalog"], forbid: ["multi-user", "inventory"] },
  { name: "Retail toko baju", business: "Toko baju retail", problem: "Stok sering selisih, rekap penjualan manual", context: "1 toko, 4 karyawan", scale: "4 karyawan", expectCore: ["inventory", "laporan-penjualan"], forbid: ["api-integration"] },
  { name: "Warung sembako", business: "Warung sembako", problem: "Catat penjualan manual di buku, sering lupa harga", context: "warung kecil, dijaga sendiri", scale: "Tidak (dikelola personal)", expectCore: ["order-management"], forbid: ["multi-user", "crm"] },
  { name: "Bengkel mobil", business: "Bengkel mobil", problem: "Jadwal servis sering bentrok, penjadwalan mekanik manual", context: "1 bengkel, 6 mekanik", scale: "6 karyawan", expectCore: ["schedule-management"], forbid: ["inventory"] },
  { name: "Fotografer", business: "Studio fotografer", problem: "Pelanggan lama sulit follow up, repeat order rendah", context: "1 studio", scale: "2 karyawan", expectCore: ["customer-history"], forbid: ["inventory"] },
  { name: "Salon", business: "Salon kecantikan", problem: "Customer sulit memesan jadwal, reservasi lewat chat menumpuk", context: "1 cabang, 5 kapster", scale: "5 karyawan", expectCore: ["booking"], forbid: ["inventory"] },
  { name: "Klinik gigi", business: "Klinik gigi", problem: "Data pelanggan tidak tersimpan, riwayat kunjungan hilang, jadwal pasien bentrok", context: "1 klinik, 3 dokter", scale: "3 karyawan", expectCore: ["database-customer", "schedule-management"], forbid: ["inventory"] },
  { name: "Catering", business: "Katering rumahan", problem: "Nota masih ditulis manual, bukti transaksi sering hilang", context: "pesanan harian kantor", scale: "dikelola personal", expectCore: ["digital-nota"], forbid: ["multi-user"] },
  { name: "Bakery", business: "Toko bakery", problem: "Pesanan kue dicatat manual dan sering tertukar, customer tanya status pesanan", context: "1 toko, 5 karyawan", scale: "5 karyawan", expectCore: ["order-management", "status-tracking"], forbid: ["crm"] },
  { name: "Distributor sparepart", business: "Distributor sparepart motor", problem: "Stok sulit dikontrol, sering kehabisan barang, pencatatan order manual", context: "3 cabang, 30 karyawan, banyak SKU", scale: "30 user, 3 cabang", expectCore: ["inventory", "order-management"], forbid: [] },
  { name: "Agen grosir sembako", business: "Agen grosir sembako", problem: "Pencatatan order manual dan stok gudang sulit dipantau", context: "2 gudang, 15 karyawan", scale: "15 karyawan", expectCore: ["order-management", "inventory"], forbid: ["api-integration"] },
  { name: "Pabrik konveksi kecil", business: "Pabrik konveksi kecil", problem: "Operasional berantakan, owner sulit memantau pekerjaan harian, status pekerjaan tidak jelas", context: "1 pabrik, 20 penjahit", scale: "20 karyawan", expectCore: ["dashboard-admin", "status-tracking"], forbid: ["api-integration"] },
  { name: "Kontraktor", business: "Kontraktor bangunan", problem: "Progress proyek sulit dipantau, jadwal pekerjaan tim sering bentrok", context: "3 proyek berjalan, 12 pekerja", scale: "12 karyawan", expectCore: ["status-tracking", "schedule-management"], forbid: ["inventory"] },
  { name: "Konsultan pajak", business: "Konsultan pajak", problem: "Tidak bisa update konten sendiri, harus minta developer", context: "kantor kecil", scale: "3 karyawan", expectCore: ["cms"], forbid: ["inventory", "multi-user"] },
  { name: "Travel agent", business: "Travel agent / tour", problem: "Reservasi paket wisata masih manual lewat chat, customer sulit memesan", context: "1 kantor, 4 staff", scale: "4 karyawan", expectCore: ["booking"], forbid: ["inventory"] },
  { name: "Agen properti", business: "Agen properti", problem: "Daftar listing properti sulit disampaikan ke calon pembeli, belum ada website", goal: "Calon pembeli bisa melihat listing", context: "5 marketing", scale: "5 karyawan", expectCore: ["katalog"], forbid: ["inventory"] },
  { name: "Event organizer", business: "Event organizer", problem: "Jadwal event bentrok dan progress persiapan sulit dipantau", context: "tim 8 orang, banyak klien", scale: "8 karyawan", expectCore: ["schedule-management", "status-tracking"], forbid: ["inventory"] },
  { name: "Cafe / restoran", business: "Cafe dan restoran", problem: "Menu tidak terstruktur, order manual lewat chat sering tertukar, nota manual", context: "1 outlet, 6 karyawan", scale: "6 karyawan", expectCore: ["katalog", "order-management", "digital-nota"], forbid: ["crm"] },
  { name: "Konter pulsa", business: "Konter pulsa dan aksesoris HP", problem: "Transaksi dicatat manual, rekap omzet harian tidak rapi", context: "1 konter, dijaga sendiri", scale: "Tidak (dikelola personal)", expectCore: ["order-management", "laporan-penjualan"], forbid: ["multi-user"] },
  { name: "Jasa service AC", business: "Jasa service AC", problem: "Perlu hak akses berbeda untuk admin dan teknisi, order dicatat manual", context: "10 teknisi lapangan", scale: "10 karyawan", expectCore: ["multi-user", "order-management"], forbid: [] },
  { name: "Percetakan", business: "Percetakan digital printing", problem: "Status pekerjaan sulit dipantau, order manual di buku", context: "1 workshop", scale: "5 karyawan", expectCore: ["status-tracking", "order-management"], forbid: ["inventory"] },
];

const rows = S.map((s) => {
  const brief = {
    version: 1,
    customerName: "-",
    whatsapp: null,
    email: null,
    business: s.business,
    project: s.goal ?? s.business,
    goal: s.goal ?? null,
    problems: [s.problem],
    usersScale: s.scale,
    adminNeeds: s.context,
    features: s.features ?? [],
    timeline: null,
    budget: null,
    recommendation: null,
    createdAt: new Date().toISOString(),
  };
  const decision = decidePackageLevel(brief as never);
  const picks = selectConsultantFeatures({
    businessText: s.business,
    problemText: s.problem,
    goalText: s.goal,
    context: `${s.problem} ${s.goal ?? ""} ${s.context} ${s.scale}`,
    scaleText: s.scale,
    allowEnterprise: decision.allowEnterprise,
    limit: 10,
  });
  const core = picks.filter((p) => p.role === "core");
  const growth = picks.filter((p) => p.role === "growth");
  const ids = picks.map((p) => p.id);
  const missing = s.expectCore.filter((id) => !core.some((c) => c.id === id));
  const leaked = s.forbid.filter((id) => ids.includes(id));
  return { s, decision, core, growth, ids, missing, leaked, pass: !missing.length && !leaked.length };
});

for (const r of rows) {
  console.log(
    [
      r.s.name,
      r.s.business,
      r.s.problem,
      r.decision.level,
      r.core.map((c) => `${c.name} [${c.solves}]`).join(" ; ") || "-",
      r.growth.slice(0, 3).map((g) => g.name).join(" ; ") || "-",
      (r.s.forbid.filter((f) => !r.ids.includes(f)).join(", ") || "-"),
      r.pass ? "PASS" : `FAIL missing=${r.missing.join(",")} leaked=${r.leaked.join(",")}`,
    ].join(" || "),
  );
}
console.log(`\nTOTAL ${rows.length}, PASS ${rows.filter((r) => r.pass).length}`);
