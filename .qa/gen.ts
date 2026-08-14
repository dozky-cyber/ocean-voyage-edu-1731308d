import { buildProposalFromBrief } from "../src/lib/admin/proposal-from-brief";
import { buildProposalPdf } from "../src/lib/proposal-pdf";
import type { OrderBriefData } from "../src/lib/order-brief";
import { writeFileSync } from "fs";

const samples: Record<string, OrderBriefData> = {
  furniture: {
    version: 2, customerName: "Budi", whatsapp: "6281234567890", email: "budi@gmail.com",
    business: "Furniture & Interior Custom Workshop",
    project: "Website portfolio dan pencatatan project custom furniture",
    goal: "Customer bisa lihat hasil kerja dan owner bisa pantau project",
    problems: ["Portfolio tersebar di WA dan IG", "Customer sering tanya progress pengerjaan", "Pencatatan project masih manual di buku"],
    usersScale: "Owner + 3 tim produksi", adminNeeds: "Owner dan admin",
    features: ["Website Portfolio", "FAQ", "Pencatatan Project", "Status Tracking", "Notifikasi Progress", "Invoice Digital"],
    timeline: "2 bulan", budget: "10-15 juta", recommendation: null, createdAt: new Date().toISOString(),
  },
  laundry: {
    version: 1, customerName: "Sari", whatsapp: "628111", email: "sari@gmail.com",
    business: "Laundry Kiloan Sari Wangi",
    project: "Sistem order laundry dan notifikasi pelanggan",
    goal: "Order tidak tertukar dan pelanggan tahu cuciannya selesai",
    problems: ["Nota masih tulis tangan dan sering hilang", "Pelanggan sering nanya cucian sudah selesai belum", "Rekap omzet harian susah dihitung"],
    usersScale: "5 karyawan", adminNeeds: "Kasir",
    features: ["Manajemen Order", "Nota Digital", "Notifikasi Status"],
    timeline: "1 bulan", budget: "5 juta", recommendation: null, createdAt: new Date().toISOString(),
  },
};

for (const [name, brief] of Object.entries(samples)) {
  const built = buildProposalFromBrief({ brief, contactName: brief.customerName });
  const pdf = buildProposalPdf({
    title: "Proposal", version: 1, clientName: brief.business, contactName: brief.customerName,
    email: brief.email, whatsapp: brief.whatsapp, recommendedPackage: built.packageName,
    currency: "IDR", validUntil: null, investmentNote: built.investmentNote, paymentType: "termin",
    paymentDpPercent: 50, sections: built.sections, pricing: built.pricing,
    briefTimeline: brief.timeline, enhancements: built.enhancements, coreFeatures: built.coreFeatures,
    createdAt: new Date().toISOString(),
  });
  writeFileSync(`/tmp/qa/${name}.pdf`, pdf);
  const map = built.sections.find((s) => s.heading === "Problem & Solution Mapping");
  const bertahap = built.sections.find((s) => s.heading === "Rekomendasi Implementasi Bertahap");
  console.log(`===== ${name} =====\n${map?.body}\n---\n${bertahap?.body}\n`);
}
