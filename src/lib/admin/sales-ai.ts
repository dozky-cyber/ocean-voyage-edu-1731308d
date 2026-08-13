/**
 * KERJAKU AI Sales Assistant + Proposal Generator — deterministic engine.
 *
 * Pure, client-safe functions. Given the CRM lead record they derive a sales
 * strategy brief and a full proposal draft. No network calls, no AI credits.
 */

import {
  briefIncludedFeatures,
  detectSelectedFeatures,
  resolvePackage,
} from "./feature-library";

export const PROPOSAL_STATUSES = [
  "Draft",
  "Sent",
  "Viewed",
  "Negotiation",
  "Approved",
  "Rejected",
] as const;

export type ProposalStatus = (typeof PROPOSAL_STATUSES)[number];

export function isProposalStatus(value: unknown): value is ProposalStatus {
  return typeof value === "string" && (PROPOSAL_STATUSES as readonly string[]).includes(value);
}

export function proposalStatusClass(status: string): string {
  switch (status) {
    case "Approved":
      return "bg-primary/15 text-primary border-primary/30";
    case "Rejected":
      return "bg-destructive/15 text-destructive border-destructive/30";
    case "Sent":
    case "Viewed":
    case "Negotiation":
      return "bg-accent/20 text-accent-foreground border-accent/30";
    default:
      return "bg-secondary/40 text-secondary-foreground border-border/60";
  }
}

/** Minimal shape the engine needs — matches the consultations row. */
export type SalesLead = {
  name: string;
  email?: string | null;
  whatsapp?: string | null;
  company?: string | null;
  business_name?: string | null;
  project_type?: string | null;
  requirement?: string | null;
  features?: string | null;
  notes?: string | null;
  admin_notes?: string | null;
  budget?: string | null;
  timeline?: string | null;
  status?: string | null;
  lead_score?: number | null;
  lead_temperature?: string | null;
  ai_summary?: string | null;
  ai_recommended_package?: string | null;
  ai_business_category?: string | null;
  ai_problems?: unknown;
  ai_requirements?: unknown;
  ai_lead_score?: number | null;
  ai_complexity?: string | null;
  ai_qualification_status?: string | null;
  ai_conversation?: unknown;
};

export type ObjectionAnswer = { objection: string; response: string };

export type SalesBrief = {
  strategy: string[];
  recommendedPackage: string;
  painPoints: string[];
  followUpMessage: string;
  objections: ObjectionAnswer[];
  priority: string;
  features: string[];
  scope: string[];
  timeline: string;
  investment: string;
};

function toStrings(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((v): v is string => typeof v === "string") : [];
}

function firstName(name: string): string {
  return (name || "").trim().split(/\s+/)[0] || "Bapak/Ibu";
}

function clientLabel(lead: SalesLead): string {
  return lead.business_name || lead.company || lead.name || "Klien";
}

export function recommendPackage(lead: SalesLead): string {
  if (lead.ai_recommended_package) return resolvePackage(lead.ai_recommended_package).key;
  const req = toStrings(lead.ai_requirements).join(" ").toLowerCase();
  const text = `${lead.requirement ?? ""} ${lead.features ?? ""} ${lead.project_type ?? ""}`.toLowerCase();
  const all = `${req} ${text}`;
  const category = (lead.ai_business_category ?? "").toLowerCase();
  if (category.includes("enterprise") || all.includes("erp") || all.includes("enterprise"))
    return "Enterprise System";
  if (all.includes("ai") || all.includes("automation") || all.includes("otomat"))
    return "Digital Workflow Solution";
  if (all.includes("dashboard") || all.includes("aplikasi") || all.includes("custom"))
    return "Professional System";
  return "Landing Page";
}

export function painPointsOf(lead: SalesLead): string[] {
  const points = toStrings(lead.ai_problems);
  if (points.length) return points;
  const derived: string[] = [];
  const text = `${lead.requirement ?? ""} ${lead.notes ?? ""}`.toLowerCase();
  if (text.includes("laporan") || text.includes("report")) derived.push("Laporan masih manual");
  if (text.includes("data")) derived.push("Pengelolaan data belum terpusat");
  if (text.includes("pelanggan") || text.includes("customer"))
    derived.push("Manajemen pelanggan belum rapi");
  if (text.includes("stok") || text.includes("inventory")) derived.push("Kontrol stok belum akurat");
  if (!derived.length) derived.push("Proses operasional masih manual dan memakan waktu");
  return derived;
}

export function requirementsOf(lead: SalesLead): string[] {
  const req = toStrings(lead.ai_requirements);
  if (req.length) return req;
  const list: string[] = [];
  if (lead.features) list.push(...lead.features.split(/[,\n]/).map((f) => f.trim()).filter(Boolean));
  if (!list.length && lead.project_type) list.push(lead.project_type);
  if (!list.length) list.push("Sistem digital sesuai kebutuhan operasional");
  return list;
}

function timelineNote(lead: SalesLead): string {
  const t = (lead.timeline ?? "").toLowerCase();
  if (t.includes("segera") || t.includes("1") || t.includes("urgent"))
    return "Prioritas cepat: MVP 2–3 minggu, iterasi lanjutan setelah go-live.";
  if (t.includes("3") || t.includes("bulan"))
    return "Estimasi 4–8 minggu: discovery, build bertahap, UAT, lalu go-live.";
  return "Estimasi 4–6 minggu tergantung kelengkapan data dan approval di setiap tahap.";
}

function investmentNote(lead: SalesLead, pkg: string): string {
  const budget = lead.budget?.trim();
  const base =
    pkg === "Enterprise System"
      ? "Skala enterprise: investasi disusun bertahap per modul agar risiko terkendali."
      : pkg === "Digital Workflow Solution"
        ? "Investasi menengah dengan fokus otomatisasi yang langsung menekan biaya operasional."
        : pkg === "Professional System"
          ? "Investasi efisien untuk sistem operasional inti, bisa dikembangkan bertahap."
          : "Investasi ringan untuk membangun kehadiran digital yang kredibel.";
  return budget
    ? `${base} Range budget klien: ${budget}. Rekomendasi: sesuaikan scope fase pertama agar masuk range ini.`
    : `${base} Budget belum ditentukan — gali angka indikatif saat follow-up.`;
}

export function buildSalesBrief(lead: SalesLead): SalesBrief {
  const pkg = recommendPackage(lead);
  const pains = painPointsOf(lead);
  const features = requirementsOf(lead);
  const temp = lead.lead_temperature ?? "Cold Lead";
  const score = lead.ai_lead_score || lead.lead_score || 0;
  const client = clientLabel(lead);

  const strategy: string[] = [];
  strategy.push(
    `Fokus utama: ${pains[0]}. Arahkan percakapan ke dampak efisiensi dan waktu yang hilang, bukan ke harga.`,
  );
  if (temp === "Hot Lead")
    strategy.push(
      "Lead panas — jangan tunda. Tawarkan jadwal call 20 menit dalam 24 jam dan siapkan proposal langsung setelahnya.",
    );
  else if (temp === "Warm Lead")
    strategy.push(
      "Lead hangat — bangun kepercayaan dulu dengan studi kasus KERJAKU yang mirip kategori bisnisnya.",
    );
  else
    strategy.push(
      "Lead dingin — edukasi dulu. Kirim insight singkat tentang masalahnya, jangan langsung menjual paket.",
    );
  if (lead.ai_business_category)
    strategy.push(
      `Kategori ${lead.ai_business_category}: gunakan bahasa operasional harian mereka, bukan istilah teknis.`,
    );
  if (lead.timeline)
    strategy.push(`Timeline klien "${lead.timeline}" — jadikan alasan untuk menetapkan next step konkret.`);
  strategy.push(`Rekomendasikan ${pkg} sebagai fase pertama, sisanya jadikan roadmap fase 2.`);

  const followUpMessage = [
    `Halo ${firstName(lead.name)}, saya dari KERJAKU.`,
    `Terima kasih sudah menghubungi kami soal kebutuhan ${lead.project_type || "sistem digital"} untuk ${client}.`,
    `Dari yang saya baca, tantangan utamanya di ${pains[0].toLowerCase()}.`,
    `Kami biasanya menyelesaikan ini lewat ${pkg} — fokusnya ${features.slice(0, 2).join(" dan ") || "otomatisasi proses inti"}.`,
    `Boleh saya kirim gambaran solusi + estimasi timeline-nya? Atau kalau lebih enak, kita ngobrol 20 menit minggu ini.`,
  ].join(" ");

  const objections: ObjectionAnswer[] = [
    {
      objection: "Terlalu mahal",
      response:
        "Bandingkan dengan biaya waktu yang hilang sekarang: jelaskan ROI dan penghematan jam kerja dari otomatisasi. Tawarkan pengerjaan bertahap agar investasi awal lebih ringan.",
    },
    {
      objection: "Nanti dulu / belum butuh sekarang",
      response:
        "Tanyakan berapa jam per minggu yang habis untuk proses manual saat ini, lalu hitung akumulasi kerugiannya dalam 3 bulan. Tawarkan fase discovery kecil sebagai langkah awal tanpa komitmen besar.",
    },
    {
      objection: "Sudah pakai Excel / cara lama",
      response:
        "Posisikan sistem sebagai kelanjutan dari Excel mereka, bukan pengganti total. Tunjukkan migrasi data dan bagaimana laporan otomatis menghilangkan input ganda.",
    },
    {
      objection: "Takut sistemnya tidak dipakai tim",
      response:
        "Tekankan proses onboarding, UI sederhana, dan iterasi bersama tim mereka selama UAT. Sebut contoh sistem KERJAKU yang dipakai harian oleh tim operasional.",
    },
    {
      objection: "Mau bandingkan dulu dengan vendor lain",
      response:
        "Dorong perbandingan berbasis scope dan after-support, bukan harga saja. Kirim rincian deliverable agar klien punya kerangka pembanding yang berpihak ke kualitas.",
    },
  ];

  const scope = [
    "Discovery & pemetaan proses bisnis",
    "Perancangan struktur data dan alur kerja",
    `Pengembangan ${pkg}`,
    "Integrasi & migrasi data awal",
    "Testing, UAT bersama tim klien",
    "Go-live, pelatihan singkat, dan masa pendampingan",
  ];

  const priority =
    temp === "Hot Lead"
      ? `Prioritas tinggi (skor ${score}) — follow up hari ini.`
      : temp === "Warm Lead"
        ? `Prioritas sedang (skor ${score}) — follow up dalam 2 hari.`
        : `Prioritas nurture (skor ${score}) — masukkan ke alur edukasi mingguan.`;

  return {
    strategy,
    recommendedPackage: pkg,
    painPoints: pains,
    followUpMessage,
    objections,
    priority,
    features,
    scope,
    timeline: timelineNote(lead),
    investment: investmentNote(lead, pkg),
  };
}

export type ProposalSection = { heading: string; body: string };
export type PricingItem = { item: string; detail: string; amount: number };

/**
 * Core Solution pricing. The price comes from the CORE SOLUTION PACKAGE —
 * it is never auto-calculated from the number of features.
 */
export function buildPricingItems(lead: SalesLead): PricingItem[] {
  const definition = resolvePackage(recommendPackage(lead));
  const included = briefIncludedFeatures(buildSalesBrief(lead).features).join(", ");
  return [
    {
      item: `Core Solution — ${definition.key}`,
      detail: included
        ? `Termasuk: ${included}`
        : "Scope utama sesuai Final Order Brief dan Client Discovery",
      amount: definition.basePrice,
    },
  ];
}

export function formatIDR(amount: number, currency = "IDR"): string {
  try {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(amount || 0);
  } catch {
    return `${currency} ${Math.round(amount || 0).toLocaleString("id-ID")}`;
  }
}

export function pricingTotal(items: PricingItem[]): number {
  return items.reduce((sum, i) => sum + (Number(i.amount) || 0), 0);
}

export function parsePricingItems(value: unknown): PricingItem[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) =>
    item && typeof item === "object"
      ? [
          {
            item: String((item as { item?: unknown }).item ?? ""),
            detail: String((item as { detail?: unknown }).detail ?? ""),
            amount: Number((item as { amount?: unknown }).amount ?? 0) || 0,
          },
        ]
      : [],
  );
}

/**
 * KERJAKU proposal template V5.
 *
 * Structure: Client Requirement → Business Problem → Feature List (Order Brief)
 * → Recommended Solution → Core Solution → (Feature Recommendation, Optional
 * Feature, Project Timeline, Investment, Payment Terms are rendered dynamically
 * from the proposal record) → Next Steps.
 *
 * The feature list is copied 1:1 from the Final Order Brief — never summarized,
 * merged, renamed, or reduced. Recommended Solution always equals Core Solution.
 */
export function buildProposalSections(lead: SalesLead): ProposalSection[] {
  const brief = buildSalesBrief(lead);
  const client = clientLabel(lead);
  const definition = resolvePackage(brief.recommendedPackage);
  const core = briefIncludedFeatures(brief.features);
  const bullets = (items: string[]) => items.map((i) => `\u2022 ${i}`).join("\n");
  const numbered = (items: string[]) => items.map((i, index) => `${index + 1}. ${i}`).join("\n");
  const today = new Date().toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return [
    {
      heading: "Cover",
      body: [
        `Proposal Solusi Digital untuk ${client}`,
        `Disiapkan untuk: ${lead.name}`,
        lead.project_type ? `Kebutuhan: ${lead.project_type}` : null,
        `Rekomendasi solusi: ${definition.key}`,
        `Tanggal: ${today}`,
        "Disiapkan oleh: KERJAKU — Business System Consultant",
      ]
        .filter(Boolean)
        .join("\n"),
    },
    {
      heading: "About KERJAKU",
      body: [
        "KERJAKU membangun produk digital yang benar-benar dipakai setiap hari: website, aplikasi bisnis, otomatisasi alur kerja, dan integrasi AI.",
        "Pendekatan kami sederhana — pahami proses bisnisnya dulu, baru bangun sistemnya. Setiap project dikerjakan bertahap agar hasilnya terukur dan risikonya terkendali.",
      ].join("\n\n"),
    },
    {
      heading: "Client Requirement",
      body: [
        `${client} menyampaikan kebutuhan berikut pada sesi konsultasi bersama KERJAKU:`,
        "",
        lead.requirement?.trim() ||
          lead.project_type?.trim() ||
          "Sistem digital untuk mendukung operasional bisnis.",
        lead.ai_summary?.trim() ? `\n${lead.ai_summary.trim()}` : null,
        lead.budget?.trim() ? `\nRange budget klien: ${lead.budget.trim()}` : null,
      ]
        .filter((v) => v !== null)
        .join("\n"),
    },
    {
      heading: "Business Problem",
      body: ["Masalah utama yang kami identifikasi:", "", bullets(brief.painPoints)].join("\n"),
    },
    {
      heading: "Feature List (Order Brief)",
      body: [
        "Daftar fitur berikut diambil langsung dari Final Order Brief dan Client Discovery, menjadi acuan scope pengerjaan:",
        "",
        numbered(brief.features),
      ].join("\n"),
    },
    {
      heading: "Recommended Solution",
      body: [
        `KERJAKU merekomendasikan ${definition.key} sebagai solusi utama (Core Solution).`,
        `Solusi ini menyelesaikan ${brief.painPoints[0].toLowerCase()} melalui alur kerja terpusat, data yang rapi, dan proses yang terukur.`,
        "",
        "Manfaat untuk bisnis:",
        bullets(definition.benefits),
      ].join("\n"),
    },
    {
      heading: "Core Solution",
      body: [
        definition.key,
        "",
        "Included Feature:",
        bullets(core),
        "",
        "Cakupan pengerjaan:",
        bullets(brief.scope),
      ].join("\n"),
    },
    {
      heading: "Next Steps",
      body: bullets([
        "Konfirmasi scope Core Solution bersama tim KERJAKU",
        "Penjadwalan sesi discovery (60 menit)",
        "Penandatanganan kesepakatan kerja",
        "Kick-off pengembangan",
      ]),
    },
  ];
}

export function parseSections(value: unknown): ProposalSection[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) =>
    item && typeof item === "object" && "heading" in item && "body" in item
      ? [
          {
            heading: String((item as { heading: unknown }).heading),
            body: String((item as { body: unknown }).body),
          },
        ]
      : [],
  );
}

/* ---------------------------------------------------------------------------
 * AI Sales Engine — intent analysis, follow-up generator, objection handler
 * ------------------------------------------------------------------------ */

export type LeadIntel = {
  summary: string;
  painPoints: string[];
  buyingIntent: { level: "Tinggi" | "Sedang" | "Rendah"; score: number; signals: string[] };
  recommendedPackage: string;
  closingProbability: number;
  probabilityReasons: string[];
  strategy: string[];
  nextBestAction: string;
  priority: string;
};

const INTENT_MAX = 100;

export function buildLeadIntel(lead: SalesLead): LeadIntel {
  const brief = buildSalesBrief(lead);
  const client = clientLabel(lead);
  const temp = lead.lead_temperature ?? "Cold Lead";
  const conversation = Array.isArray(lead.ai_conversation) ? lead.ai_conversation.length : 0;
  const stage = (lead.status ?? "").toLowerCase();

  const signals: string[] = [];
  let intent = 20;
  if (temp === "Hot Lead") {
    intent += 30;
    signals.push("Lead ditandai Hot berdasarkan perilaku kunjungan");
  } else if (temp === "Warm Lead") {
    intent += 18;
    signals.push("Lead hangat — sudah menunjukkan minat nyata");
  } else signals.push("Lead masih dingin — butuh edukasi sebelum penawaran");
  if (conversation > 0) {
    intent += Math.min(15, conversation * 4);
    signals.push(`Menyelesaikan ${conversation} tahap percakapan AI Consultant`);
  }
  if (lead.budget?.trim()) {
    intent += 12;
    signals.push(`Menyebutkan budget: ${lead.budget}`);
  }
  if (lead.timeline?.trim()) {
    intent += 10;
    signals.push(`Punya target waktu: ${lead.timeline}`);
  }
  if ((lead.requirement ?? "").trim().length > 80) {
    intent += 8;
    signals.push("Menjelaskan kebutuhan secara detail");
  }
  if (lead.whatsapp?.trim()) {
    intent += 5;
    signals.push("Meninggalkan nomor WhatsApp aktif");
  }
  if (stage.includes("proposal") || stage.includes("negotiation")) {
    intent += 12;
    signals.push(`Sudah berada di stage ${lead.status}`);
  }
  intent = Math.max(5, Math.min(INTENT_MAX, intent));

  const level: LeadIntel["buyingIntent"]["level"] =
    intent >= 70 ? "Tinggi" : intent >= 45 ? "Sedang" : "Rendah";

  const probabilityReasons: string[] = [];
  let probability = Math.round(intent * 0.7);
  if (lead.budget?.trim()) {
    probability += 8;
    probabilityReasons.push("Budget sudah disebutkan — negosiasi lebih cepat.");
  } else probabilityReasons.push("Budget belum diketahui — gali angka indikatif dulu.");
  if (stage.includes("negotiation") || stage.includes("proposal")) {
    probability += 10;
    probabilityReasons.push("Sudah masuk tahap proposal/negosiasi.");
  }
  if (temp === "Cold Lead") {
    probability -= 10;
    probabilityReasons.push("Temperatur masih dingin — perlu nurture sebelum closing.");
  }
  if (!lead.timeline?.trim()) probabilityReasons.push("Timeline belum jelas — tetapkan next step dengan tanggal.");
  probability = Math.max(5, Math.min(95, probability));

  const nextBestAction =
    temp === "Hot Lead"
      ? "Kirim pesan WhatsApp hari ini dan tawarkan call 20 menit dalam 24 jam."
      : stage.includes("proposal")
        ? "Follow up proposal: konfirmasi apakah sudah dibaca dan tanyakan pertanyaan yang tersisa."
        : temp === "Warm Lead"
          ? "Kirim studi kasus relevan, lalu ajukan satu pertanyaan kualifikasi soal budget."
          : "Kirim insight singkat tentang masalah utamanya tanpa menjual paket dulu.";

  const summary = [
    `${lead.name}${client && client !== lead.name ? ` dari ${client}` : ""} mencari ${lead.project_type || "solusi digital"}.`,
    lead.ai_summary?.trim() ||
      `Kebutuhan yang disampaikan: ${lead.requirement?.trim() || "peningkatan efisiensi lewat sistem digital"}.`,
    `Masalah utama: ${brief.painPoints[0].toLowerCase()}. Rekomendasi paket: ${brief.recommendedPackage}.`,
  ].join(" ");

  return {
    summary,
    painPoints: brief.painPoints,
    buyingIntent: { level, score: intent, signals },
    recommendedPackage: brief.recommendedPackage,
    closingProbability: probability,
    probabilityReasons,
    strategy: brief.strategy,
    nextBestAction,
    priority: brief.priority,
  };
}

export const FOLLOW_UP_TYPES = [
  "First Response",
  "Reminder Follow Up",
  "After Proposal",
  "Closing Message",
  "Re-engagement",
] as const;

export type FollowUpType = (typeof FOLLOW_UP_TYPES)[number];

export function isFollowUpType(value: unknown): value is FollowUpType {
  return typeof value === "string" && (FOLLOW_UP_TYPES as readonly string[]).includes(value);
}

export type FollowUpDraft = { type: FollowUpType; whatsapp: string; email: string; emailSubject: string };

export function buildFollowUp(lead: SalesLead, type: FollowUpType): FollowUpDraft {
  const brief = buildSalesBrief(lead);
  const name = firstName(lead.name);
  const client = clientLabel(lead);
  const pain = brief.painPoints[0].toLowerCase();
  const pkg = brief.recommendedPackage;
  const project = lead.project_type || "sistem digital";

  let whatsapp: string;
  let emailBody: string;
  let emailSubject: string;

  switch (type) {
    case "Reminder Follow Up":
      whatsapp = `Halo ${name}, semoga harinya lancar 🙌\n\nSaya follow up soal kebutuhan ${project} untuk ${client}. Apakah sudah sempat dibaca gambaran solusinya?\n\nKalau ada yang mau didalami, saya bisa jelaskan singkat lewat call 15–20 menit. Kira-kira lebih enak hari apa?`;
      emailSubject = `Follow up: kebutuhan ${project} untuk ${client}`;
      emailBody = `Halo ${name},\n\nSaya ingin memastikan informasi dari KERJAKU sebelumnya sudah sampai dan cukup jelas.\n\nFokus kami tetap sama: menyelesaikan ${pain} lewat ${pkg}, sehingga proses harian tim ${client} jadi lebih ringan.\n\nApakah ada bagian yang ingin didalami lebih dulu? Saya siap menyesuaikan scope fase pertama sesuai prioritas Anda.\n\nSalam,\nTim KERJAKU`;
      break;
    case "After Proposal":
      whatsapp = `Halo ${name}, proposal ${pkg} untuk ${client} sudah saya kirim ya 🙏\n\nDi dalamnya ada rincian scope, timeline, dan langkah berikutnya. Kalau ada bagian yang ingin disesuaikan (fitur atau tahapan), tinggal bilang — masih sangat fleksibel.\n\nApakah minggu ini bisa kita bahas 20 menit?`;
      emailSubject = `Proposal ${pkg} — ${client}`;
      emailBody = `Halo ${name},\n\nTerima kasih atas waktunya. Proposal ${pkg} untuk ${client} sudah kami susun berdasarkan kebutuhan yang Anda sampaikan.\n\nRingkasnya:\n• Masalah yang dipecahkan: ${pain}\n• Scope fase pertama: ${brief.features.slice(0, 3).join(", ") || "sistem operasional inti"}\n• ${brief.timeline}\n\nSilakan sampaikan jika ada penyesuaian scope. Kami bisa mengatur ulang tahapan agar sesuai prioritas dan anggaran.\n\nSalam,\nTim KERJAKU`;
      break;
    case "Closing Message":
      whatsapp = `Halo ${name}, dari diskusi kita sejauh ini sepertinya ${pkg} sudah paling pas untuk kebutuhan ${client}.\n\nKalau setuju, saya siapkan kesepakatan kerja dan jadwal kick-off minggu ini. Apakah kita lanjut ke tahap itu?`;
      emailSubject = `Langkah berikutnya: memulai ${pkg} untuk ${client}`;
      emailBody = `Halo ${name},\n\nBerdasarkan diskusi kita, ${pkg} adalah langkah pertama yang paling masuk akal untuk menyelesaikan ${pain}.\n\nJika Anda setuju, langkah berikutnya:\n1. Konfirmasi scope fase pertama\n2. Kesepakatan kerja & DP\n3. Kick-off dan sesi discovery\n\n${brief.investment}\n\nBoleh saya siapkan dokumennya hari ini?\n\nSalam,\nTim KERJAKU`;
      break;
    case "Re-engagement":
      whatsapp = `Halo ${name}, semoga kabar baik 🙂\n\nSaya cek kembali catatan kami soal rencana ${project} untuk ${client}. Apakah kebutuhan itu masih berjalan, atau sedang ditunda dulu?\n\nKalau masih relevan, saya bisa kirim opsi paling ringan untuk mulai bertahap.`;
      emailSubject = `Masih relevan? Rencana ${project} untuk ${client}`;
      emailBody = `Halo ${name},\n\nSudah beberapa waktu sejak diskusi terakhir kita tentang ${project} untuk ${client}.\n\nBanyak klien memulai dari fase kecil dulu: menyelesaikan ${pain}, lalu berkembang bertahap. Jika rencananya masih ada, saya bisa kirim opsi paling ringan untuk memulai.\n\nApakah topik ini masih menjadi prioritas tahun ini?\n\nSalam,\nTim KERJAKU`;
      break;
    default:
      whatsapp = `Halo ${name}, saya dari KERJAKU 👋\n\nTerima kasih sudah menghubungi kami soal ${project} untuk ${client}. Dari yang saya baca, tantangan utamanya di ${pain}.\n\nBiasanya kami menyelesaikan ini lewat ${pkg}, fokusnya ${brief.features.slice(0, 2).join(" dan ") || "otomatisasi proses inti"}.\n\nBoleh saya kirim gambaran solusi + estimasi timeline-nya? Atau kita ngobrol 20 menit minggu ini?`;
      emailSubject = `KERJAKU — solusi untuk ${project} di ${client}`;
      emailBody = `Halo ${name},\n\nTerima kasih sudah menghubungi KERJAKU mengenai ${project} untuk ${client}.\n\nDari kebutuhan yang Anda sampaikan, tantangan utamanya adalah ${pain}. Kami merekomendasikan ${pkg} sebagai fase pertama, dengan fokus pada ${brief.features.slice(0, 3).join(", ") || "otomatisasi proses inti"}.\n\n${brief.timeline}\n\nApakah Anda bersedia untuk sesi singkat 20 menit agar saya bisa menjelaskan gambaran solusinya?\n\nSalam,\nTim KERJAKU`;
      break;
  }

  return { type, whatsapp, email: emailBody, emailSubject };
}

export type ObjectionPlan = {
  objection: string;
  understanding: string;
  value: string;
  alternative: string;
  closingQuestion: string;
};

type ObjectionKind = "price" | "timing" | "trust" | "internal" | "competitor" | "generic";

function classifyObjection(text: string): ObjectionKind {
  const t = text.toLowerCase();
  if (/mahal|harga|price|budget|biaya|murah/.test(t)) return "price";
  if (/nanti|tunda|belum|next year|tahun depan|sibuk|waktu/.test(t)) return "timing";
  if (/ragu|percaya|yakin|garansi|aman|portfolio|bukti/.test(t)) return "trust";
  if (/tim|karyawan|internal|atasan|bos|diskusi dulu|rapat/.test(t)) return "internal";
  if (/vendor|kompetitor|bandingkan|banding|lain|freelancer/.test(t)) return "competitor";
  return "generic";
}

export function handleObjection(lead: SalesLead, objection: string): ObjectionPlan {
  const brief = buildSalesBrief(lead);
  const pkg = brief.recommendedPackage;
  const pain = brief.painPoints[0].toLowerCase();
  const kind = classifyObjection(objection);
  const name = firstName(lead.name);

  const lighter =
    pkg === "Enterprise System"
      ? "Digital Workflow Solution"
      : pkg === "Digital Workflow Solution"
        ? "Professional System"
        : pkg === "Professional System"
          ? "Landing Page"
          : "paket dasar dengan scope fase pertama yang lebih kecil";

  const plans: Record<ObjectionKind, Omit<ObjectionPlan, "objection">> = {
    price: {
      understanding: `Saya mengerti, ${name}. Wajar kalau angkanya perlu dipertimbangkan matang — ini keputusan investasi, bukan sekadar biaya.`,
      value: `Coba kita lihat dari sisi lain: ${pain} saat ini memakan jam kerja tim setiap minggu. Dalam 3 bulan, biaya waktu yang hilang itu biasanya lebih besar daripada investasi sistemnya. ${brief.investment}`,
      alternative: `Kalau mau lebih ringan, kita bisa mulai dari ${lighter} — ambil bagian yang paling menyakitkan dulu, sisanya jadi roadmap fase 2.`,
      closingQuestion: `Kalau kita susun fase pertama yang masuk anggaran Anda, apakah kita bisa mulai bulan ini?`,
    },
    timing: {
      understanding: `Paham sekali, ${name}. Timing memang penting dan tidak semua hal harus dikerjakan sekarang.`,
      value: `Yang perlu dipertimbangkan: selama ${pain} dibiarkan, biayanya berjalan terus setiap minggu. Memulai lebih awal justru membuat fase berikutnya lebih murah karena datanya sudah rapi.`,
      alternative: `Alternatifnya, kita mulai dari fase discovery kecil dulu — pemetaan proses saja, tanpa komitmen pengembangan penuh.`,
      closingQuestion: `Bagaimana kalau kita jadwalkan discovery singkat, lalu Anda putuskan setelah melihat hasilnya?`,
    },
    trust: {
      understanding: `Sangat masuk akal, ${name}. Memilih partner teknologi itu soal kepercayaan, bukan hanya fitur.`,
      value: `KERJAKU membangun sistem yang dipakai harian oleh tim operasional — bukan sekadar demo. Setiap tahap ada UAT bersama tim Anda, jadi Anda melihat hasilnya sebelum go-live.`,
      alternative: `Kalau ingin lebih aman, kita bisa mulai dari satu modul kecil dulu sebagai bukti kerja sebelum lanjut ke ${pkg}.`,
      closingQuestion: `Kalau saya tunjukkan contoh sistem serupa yang sudah berjalan, apakah itu cukup untuk melangkah ke tahap berikutnya?`,
    },
    internal: {
      understanding: `Tentu, ${name}. Keputusan seperti ini memang sebaiknya dibahas bersama tim.`,
      value: `Supaya diskusi internalnya lebih mudah, saya bisa siapkan ringkasan satu halaman: masalah, solusi, timeline, dan dampak ke operasional harian.`,
      alternative: `Kalau perlu, saya juga bisa ikut sesi singkat bersama tim Anda untuk menjawab pertanyaan teknis langsung.`,
      closingQuestion: `Kira-kira kapan rapat internalnya, supaya saya siapkan materinya sebelum itu?`,
    },
    competitor: {
      understanding: `Bagus justru, ${name} — membandingkan itu langkah yang sehat sebelum memutuskan.`,
      value: `Saran saya, bandingkan berdasarkan scope dan dukungan setelah go-live, bukan harga saja. Banyak sistem murah berhenti di serah terima, lalu biaya perbaikannya muncul belakangan.`,
      alternative: `Saya bisa kirim rincian deliverable ${pkg} agar Anda punya kerangka pembanding yang jelas antar vendor.`,
      closingQuestion: `Kalau rincian scope kami paling lengkap, apakah kita bisa lanjut ke tahap kesepakatan?`,
    },
    generic: {
      understanding: `Terima kasih sudah terbuka, ${name}. Saya ingin memastikan solusinya benar-benar sesuai, bukan memaksakan paket.`,
      value: `Yang kami tawarkan fokus pada satu hal: menyelesaikan ${pain} agar tim Anda tidak kehilangan waktu di proses manual.`,
      alternative: `Kalau ${pkg} terasa belum pas, kita bisa mulai dari ${lighter} dan berkembang bertahap.`,
      closingQuestion: `Boleh saya tahu bagian mana yang paling membuat Anda ragu, supaya saya bisa bantu jawab spesifik?`,
    },
  };

  return { objection: objection.trim(), ...plans[kind] };
}

export const AI_ACTIONS = {
  intel: "Lead Analysis",
  followUp: "Follow Up Generator",
  objection: "Objection Handler",
} as const;
