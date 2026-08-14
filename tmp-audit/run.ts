import { buildProposalFromBrief } from "../src/lib/admin/proposal-from-brief";
import type { OrderBriefData } from "../src/lib/order-brief";

const base = (o: Partial<OrderBriefData>): OrderBriefData => ({
  version: 1, customerName: "X", whatsapp: "08123", email: null,
  business: "", project: "", goal: null, problems: [], usersScale: null,
  adminNeeds: null, features: [], timeline: null, budget: null,
  recommendation: null, createdAt: "2026-08-14T01:00:00Z", ...o,
});

const cases: OrderBriefData[] = [
  base({ customerName:"Adi", business:"Tobiin Furniture & Interior Custom Workshop", project:"Website company profile + sistem pencatatan order custom furniture", goal:"Order custom lebih rapi dan client tahu progres produksi", problems:["Order custom masih dicatat di WhatsApp dan sering kelewat","Client sering menanyakan progres produksi berulang kali","Nota masih tulis tangan"], usersScale:"owner + 3 tim produksi", adminNeeds:"owner pantau order", features:["Order Management","Status Tracking","Digital Nota"], timeline:"1-2 bulan", budget:"15-20 juta" }),
  base({ customerName:"Sari", business:"Laundry Kiloan Sari Wangi", project:"Sistem kasir dan tracking cucian", goal:"Cucian tidak tertukar dan pelanggan bisa cek status", problems:["Cucian sering tertukar","Nota manual hilang","Pelanggan sering telepon menanyakan cucian sudah selesai belum"], usersScale:"owner + 2 karyawan", adminNeeds:"owner lihat omzet harian", features:["Order Management","Status Tracking","Digital Nota"], timeline:"1 bulan", budget:"8-12 juta" }),
  base({ customerName:"dr. Rina", business:"Klinik Sehat Bersama", project:"Sistem pendaftaran pasien dan rekam kunjungan", goal:"Antrian rapi dan riwayat pasien tersimpan", problems:["Antrian pasien menumpuk di jam sibuk","Rekam kunjungan pasien masih buku","Pasien sering lupa jadwal kontrol"], usersScale:"2 dokter + 3 admin", adminNeeds:"admin kelola jadwal", features:["Booking / Reservasi Online","Customer History","Schedule Management"], timeline:"2 bulan", budget:"20-30 juta" }),
  base({ customerName:"Hendra", business:"Distributor Sembako Berkah Jaya", project:"Sistem stok dan order sales lapangan", goal:"Stok akurat dan order sales terpantau", problems:["Stok gudang sering selisih","Order dari sales masih via WA","Laporan penjualan lama dibuat"], usersScale:"12 orang (gudang, sales, admin)", adminNeeds:"hak akses beda per divisi", features:["Inventory Management","Order Management","Dashboard Owner","Multi-User Access"], timeline:"3 bulan", budget:"40-60 juta" }),
  base({ customerName:"Bayu", business:"Kedai Kopi Nusa (kuliner)", project:"Sistem kasir dan menu online", goal:"Transaksi cepat dan penjualan tercatat", problems:["Kasir manual sering salah hitung","Tidak tahu menu mana yang paling laku","Stok bahan sering habis mendadak"], usersScale:"owner + 4 barista", adminNeeds:"owner lihat laporan penjualan", features:["POS / Kasir","Digital Nota","Dashboard Owner"], timeline:"1 bulan", budget:"10-15 juta" }),
];

for (const b of cases) {
  const p = buildProposalFromBrief({ brief: b, contactName: b.customerName });
  console.log("\n\n################ " + b.business + " ################");
  console.log("PACKAGE:", p.packageName);
  for (const s of p.sections) console.log(`\n--- ${s.heading} ---\n${s.body}`);
  console.log("\n--- CORE FEATURES ---");
  for (const c of p.coreFeatures) console.log(`* ${c.name}\n  ${c.description}\n  SOLVES: ${c.solves ?? "-"}`);
  console.log("\n--- ENHANCEMENTS ---");
  for (const e of p.enhancements) console.log(`* [P${e.priority} F${e.phase} ${e.recommended?"REC":"-"}] ${e.name} @${e.amount}\n  benefit: ${e.benefit}\n  reason: ${e.reason}\n  impact: ${e.impact}\n  relation: ${e.relation}`);
  console.log("\n--- PRICING ---", JSON.stringify(p.pricing));
  console.log("NOTE:", p.investmentNote);
  console.log("BRIEF FEATURES:", b.features.join(", "), "|| INCLUDED:", p.insight.included.join(", "));
}
