import { buildProposalFromBrief } from "./src/lib/admin/proposal-from-brief";
import { buildProposalPdf } from "./src/lib/proposal-pdf";
import { writeFileSync } from "fs";

const brief: any = {
  customerName: "Fadly",
  business: "Furniture & Interior Custom Workshop (Fadly Furniture Interior)",
  project: "Sistem untuk mengelola order custom furniture dari desain sampai instalasi",
  goal: "Client bisa melihat progres pekerjaan tanpa harus chat terus",
  usersScale: "5 orang tim workshop",
  adminNeeds: "Admin dan owner",
  timeline: "1-2 bulan",
  budget: "10-15 juta",
  features: ["Status Tracking Progress Pekerjaan", "Manajemen Order", "Digital Nota / Invoice"],
  problems: [
    "Client sering menanyakan progres pekerjaan lewat chat",
    "Nota masih manual dan sering tertukar",
    "Order custom banyak dan sulit dipantau",
  ],
};

const built = buildProposalFromBrief({ brief, contactName: "Fadly" });
const bytes = buildProposalPdf({
  title: `KERJAKU Digital Solution Proposal - ${brief.business}`,
  version: 1,
  clientName: brief.business,
  contactName: "Fadly",
  email: "ai-sess_gfjm2uw@leads.kerjaku.space" as any,
  whatsapp: "088289329068",
  recommendedPackage: built.packageName,
  currency: "IDR",
  validUntil: "2026-09-13",
  investmentNote: built.investmentNote,
  paymentType: "full",
  sections: built.sections as any,
  pricing: built.pricing as any,
  briefTimeline: brief.timeline,
  estimatedTimeline: "4-6 minggu",
  enhancements: built.enhancements as any,
  coreFeatures: built.coreFeatures as any,
  createdAt: new Date().toISOString(),
});
writeFileSync("/tmp/qa/sample.pdf", bytes);
console.log("ok", built.enhancements.map((e:any)=>e.name));
