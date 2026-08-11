/**
 * KERJAKU AI Sales Consultant — content + deterministic recommendation engine.
 *
 * The consultant guides a visitor through four steps (business category →
 * problems → requirements → readiness), then derives a recommended KERJAKU
 * solution, complexity estimate and lead qualification score.
 *
 * Client-safe: pure data + pure functions, no browser or server APIs.
 */

export type OptionItem = { id: string; label: string; weight?: number };

export const aiConsultantSection = {
  eyebrow: "AI CONSULTANT",
  title: "Ngobrol Langsung dengan AI Consultant KERJAKU",
  subtitle:
    "Ceritakan kondisi bisnis Anda seperti chat biasa. AI KERJAKU akan menggali kebutuhan, menganalisa masalah, lalu merekomendasikan solusi digital yang paling tepat.",
  cta: "Mulai Konsultasi AI",
  fabLabel: "AI Consultant",
  intro:
    "Halo! Saya asisten digital KERJAKU. Saya bantu identifikasi kebutuhan sistem bisnis Anda dalam 4 langkah singkat.",
  /** Transparency note shown before the assessment begins. */
  disclosureTitle: "Guided AI Project Assessment",
  disclosurePoints: [
    "Asesmen terpandu berbasis AI — dirancang bersama tim KERJAKU, bukan kuis biasa.",
    "Menganalisis profil bisnis, hambatan operasional, dan kebutuhan sistem Anda.",
    "Merekomendasikan paket solusi, estimasi kompleksitas, dan prioritas pengerjaan.",
    "Bukan chatbot bebas tanya — fokusnya memetakan project Anda secara terstruktur.",
  ],
  disclosureFooter:
    "Hasil asesmen langsung diteruskan ke tim KERJAKU sebagai bahan diskusi project Anda.",
};


export const businessCategories: OptionItem[] = [
  { id: "umkm", label: "UMKM", weight: 1 },
  { id: "retail", label: "Retail", weight: 2 },
  { id: "workshop", label: "Workshop / Bengkel", weight: 2 },
  { id: "restaurant", label: "Restoran / F&B", weight: 2 },
  { id: "agency", label: "Agency / Jasa", weight: 2 },
  { id: "enterprise", label: "Enterprise / Perusahaan", weight: 4 },
  { id: "other", label: "Lainnya", weight: 1 },
];

export const businessProblems: OptionItem[] = [
  { id: "data", label: "Sulit mengelola data", weight: 2 },
  { id: "reporting", label: "Laporan masih manual", weight: 2 },
  { id: "customer", label: "Manajemen pelanggan belum rapi", weight: 2 },
  { id: "sales", label: "Sulit tracking penjualan / aktivitas", weight: 2 },
  { id: "operational", label: "Operasional tidak efisien", weight: 2 },
  { id: "automation", label: "Butuh otomatisasi proses", weight: 3 },
];

export const businessRequirements: OptionItem[] = [
  { id: "website", label: "Website", weight: 1 },
  { id: "dashboard", label: "Dashboard", weight: 2 },
  { id: "custom-app", label: "Aplikasi custom", weight: 3 },
  { id: "ai", label: "AI automation", weight: 3 },
  { id: "database", label: "Sistem database", weight: 2 },
  { id: "mobile", label: "Aplikasi mobile", weight: 3 },
  { id: "location", label: "Sistem berbasis lokasi", weight: 3 },
];

export const budgetReadiness: OptionItem[] = [
  { id: "budgeted", label: "Sudah dianggarkan", weight: 25 },
  { id: "planning", label: "Sedang direncanakan", weight: 15 },
  { id: "exploring", label: "Masih eksplorasi", weight: 5 },
];

export const timelineReadiness: OptionItem[] = [
  { id: "asap", label: "Secepatnya (< 1 bulan)", weight: 25 },
  { id: "quarter", label: "1 – 3 bulan", weight: 16 },
  { id: "later", label: "Lebih dari 3 bulan", weight: 6 },
];

export const userScale: OptionItem[] = [
  { id: "small", label: "1 – 5 pengguna", weight: 1 },
  { id: "medium", label: "6 – 20 pengguna", weight: 3 },
  { id: "large", label: "21 – 100 pengguna", weight: 5 },
  { id: "enterprise", label: "Lebih dari 100 pengguna", weight: 8 },
];

export type PackageId =
  | "basic-system"
  | "professional-system"
  | "digital-workflow"
  | "enterprise-transformation";

export const solutionPackages: Record<
  PackageId,
  { name: string; tagline: string; features: string[] }
> = {
  "basic-system": {
    name: "Basic System",
    tagline: "Untuk kehadiran digital yang sederhana dan profesional.",
    features: ["Website profesional", "Company profile", "Form kontak", "SEO dasar"],
  },
  "professional-system": {
    name: "Professional System",
    tagline: "Untuk branding bisnis dan pengelolaan layanan.",
    features: [
      "Website bisnis + landing page",
      "Katalog layanan / produk",
      "Form lead & notifikasi",
      "Analytics dasar",
    ],
  },
  "digital-workflow": {
    name: "Digital Workflow Solution",
    tagline: "Untuk manajemen operasional, database, dashboard, dan otomatisasi.",
    features: [
      "Dashboard operasional",
      "Database pelanggan & transaksi",
      "Sistem laporan otomatis",
      "AI assistant & automation",
    ],
  },
  "enterprise-transformation": {
    name: "Enterprise Digital Transformation",
    tagline: "Untuk sistem kompleks, AI, integrasi, dan organisasi besar.",
    features: [
      "Custom enterprise platform",
      "Multi-role & multi-user access",
      "Integrasi sistem & API",
      "AI intelligence + analitik lanjutan",
    ],
  },
};

export type Complexity = "Low" | "Medium" | "High";
export type Qualification = "Cold Lead" | "Warm Lead" | "Hot Lead";

export type ConsultantAnswers = {
  category: string;
  problems: string[];
  requirements: string[];
  budget: string;
  timeline: string;
  users: string;
};

export const emptyAnswers: ConsultantAnswers = {
  category: "",
  problems: [],
  requirements: [],
  budget: "",
  timeline: "",
  users: "",
};

export type ConsultantResult = {
  businessCategory: string;
  problems: string[];
  requirements: string[];
  budget: string;
  timeline: string;
  users: string;
  packageId: PackageId;
  packageName: string;
  packageTagline: string;
  features: string[];
  complexity: Complexity;
  score: number;
  qualification: Qualification;
  summary: string;
};

function labelOf(list: OptionItem[], id: string) {
  return list.find((item) => item.id === id)?.label ?? "";
}

function labelsOf(list: OptionItem[], ids: string[]) {
  return ids.map((id) => labelOf(list, id)).filter(Boolean);
}

function weightOf(list: OptionItem[], id: string) {
  return list.find((item) => item.id === id)?.weight ?? 0;
}

function weightSum(list: OptionItem[], ids: string[]) {
  return ids.reduce((total, id) => total + weightOf(list, id), 0);
}

function pickPackage(answers: ConsultantAnswers, complexityScore: number): PackageId {
  if (answers.category === "enterprise" || answers.users === "enterprise" || complexityScore >= 14) {
    return "enterprise-transformation";
  }
  if (complexityScore >= 8) return "digital-workflow";
  if (complexityScore >= 4) return "professional-system";
  return "basic-system";
}

export function buildRecommendation(answers: ConsultantAnswers): ConsultantResult {
  const categoryLabel = labelOf(businessCategories, answers.category);
  const problemLabels = labelsOf(businessProblems, answers.problems);
  const requirementLabels = labelsOf(businessRequirements, answers.requirements);

  const complexityScore =
    weightSum(businessRequirements, answers.requirements) +
    Math.round(weightSum(businessProblems, answers.problems) / 2) +
    weightOf(userScale, answers.users) +
    weightOf(businessCategories, answers.category);

  const complexity: Complexity =
    complexityScore >= 14 ? "High" : complexityScore >= 7 ? "Medium" : "Low";

  const packageId = pickPackage(answers, complexityScore);
  const pack = solutionPackages[packageId];

  const score = Math.min(
    100,
    (problemLabels.length > 0 ? 15 : 0) +
      (requirementLabels.length > 0 ? 15 : 0) +
      weightOf(budgetReadiness, answers.budget) +
      weightOf(timelineReadiness, answers.timeline) +
      Math.min(12, complexityScore) +
      Math.min(8, weightOf(userScale, answers.users)),
  );

  const qualification: Qualification =
    score >= 70 ? "Hot Lead" : score >= 40 ? "Warm Lead" : "Cold Lead";

  const summary = [
    `Bisnis: ${categoryLabel || "-"}`,
    `Masalah: ${problemLabels.join(", ") || "-"}`,
    `Kebutuhan: ${requirementLabels.join(", ") || "-"}`,
    `Rekomendasi Solusi: ${pack.name}`,
    `Fitur Utama: ${pack.features.join(", ")}`,
    `Estimasi Kompleksitas: ${complexity}`,
    `Kesiapan Budget: ${labelOf(budgetReadiness, answers.budget) || "-"}`,
    `Target Waktu: ${labelOf(timelineReadiness, answers.timeline) || "-"}`,
    `Skala Pengguna: ${labelOf(userScale, answers.users) || "-"}`,
    `Kualifikasi: ${qualification} (${score}/100)`,
  ].join("\n");

  return {
    businessCategory: categoryLabel,
    problems: problemLabels,
    requirements: requirementLabels,
    budget: labelOf(budgetReadiness, answers.budget),
    timeline: labelOf(timelineReadiness, answers.timeline),
    users: labelOf(userScale, answers.users),
    packageId,
    packageName: pack.name,
    packageTagline: pack.tagline,
    features: pack.features,
    complexity,
    score,
    qualification,
    summary,
  };
}

export type ConsultantStepId =
  | "category"
  | "problems"
  | "requirements"
  | "budget"
  | "timeline"
  | "users";

export type ConsultantStep = {
  id: ConsultantStepId;
  question: string;
  hint?: string;
  options: OptionItem[];
  multi: boolean;
};

export const consultantSteps: ConsultantStep[] = [
  {
    id: "category",
    question: "Bisnis Anda bergerak di bidang apa?",
    options: businessCategories,
    multi: false,
  },
  {
    id: "problems",
    question: "Masalah apa yang paling terasa saat ini?",
    hint: "Bisa pilih lebih dari satu.",
    options: businessProblems,
    multi: true,
  },
  {
    id: "requirements",
    question: "Sistem seperti apa yang Anda butuhkan?",
    hint: "Bisa pilih lebih dari satu.",
    options: businessRequirements,
    multi: true,
  },
  {
    id: "budget",
    question: "Bagaimana kesiapan anggaran project ini?",
    options: budgetReadiness,
    multi: false,
  },
  {
    id: "timeline",
    question: "Kapan sistem ini ingin mulai digunakan?",
    options: timelineReadiness,
    multi: false,
  },
  {
    id: "users",
    question: "Berapa perkiraan jumlah pengguna sistemnya?",
    options: userScale,
    multi: false,
  },
];
