import { buildProposalFromBrief } from "../src/lib/admin/proposal-from-brief";
import { buildProposalPdf } from "../src/lib/proposal-pdf";
import { buildOrderBriefPdf } from "../src/lib/order-brief-pdf";
import { writeFileSync } from "fs";

const brief = {
  version: 2,
  customerName: "Fadly",
  whatsapp: "6281234567890",
  email: "fadly@tobiin.id",
  business: "Furniture & Interior Custom Workshop (Fadly Furniture Interior)",
  project: "Website company profile + sistem pencatatan project custom furniture dari survey sampai instalasi.",
  goal: "Owner ingin memantau progress tiap project dan mengurangi salah komunikasi dengan customer.",
  problems: [
    "Pencatatan project masih manual di buku dan chat",
    "Customer sering menanyakan progress produksi",
    "Nota dan penawaran dibuat manual di word",
  ],
  usersScale: "Owner + 3 admin workshop",
  adminNeeds: "Admin butuh input project dan update status produksi",
  features: ["Website Company Profile", "Katalog Produk", "Form Konsultasi", "Pencatatan Project"],
  timeline: "1-2 bulan",
  budget: "Rp 15.000.000 - Rp 25.000.000",
  recommendation: "Business System",
  createdAt: new Date().toISOString(),
};

const m = buildProposalFromBrief({ brief: brief as never, contactName: "Fadly" });
const pdf = buildProposalPdf({
  title: `KERJAKU Digital Solution Proposal — ${brief.business}`,
  version: 1,
  clientName: brief.business,
  contactName: "Fadly",
  email: brief.email,
  whatsapp: brief.whatsapp,
  recommendedPackage: m.packageName,
  currency: "IDR",
  validUntil: "2026-09-30",
  investmentNote: m.investmentNote,
  paymentType: "full",
  sections: m.sections,
  pricing: m.pricing,
  briefTimeline: brief.timeline,
  estimatedTimeline: "3-4 minggu",
  enhancements: m.enhancements,
  coreFeatures: m.coreFeatures,
  createdAt: brief.createdAt,
});
writeFileSync("/tmp/qa/proposal.pdf", pdf);
writeFileSync("/tmp/qa/brief.pdf", buildOrderBriefPdf(brief as never));
console.log("pkg", m.packageName, "| core", m.coreFeatures.map(c=>c.name), "| opt", m.enhancements.map(e=>e.name));
