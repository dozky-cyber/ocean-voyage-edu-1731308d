/**
 * KERJAKU AI Sales Assistant + Proposal Generator — deterministic engine.
 *
 * Pure, client-safe functions. Given the CRM lead record they derive a sales
 * strategy brief and a full proposal draft. No network calls, no AI credits.
 */

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
  if (lead.ai_recommended_package) return lead.ai_recommended_package;
  const req = toStrings(lead.ai_requirements).join(" ").toLowerCase();
  const text = `${lead.requirement ?? ""} ${lead.features ?? ""} ${lead.project_type ?? ""}`.toLowerCase();
  const all = `${req} ${text}`;
  const category = (lead.ai_business_category ?? "").toLowerCase();
  if (category.includes("enterprise") || all.includes("erp") || all.includes("enterprise"))
    return "Enterprise System";
  if (all.includes("ai") || all.includes("automation") || all.includes("otomat"))
    return "Business System";
  if (all.includes("dashboard") || all.includes("aplikasi") || all.includes("custom"))
    return "Professional System";
  return "Basic Digital Presence";
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
      : pkg === "Business System"
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

export function buildProposalSections(lead: SalesLead): ProposalSection[] {
  const brief = buildSalesBrief(lead);
  const client = clientLabel(lead);
  const bullets = (items: string[]) => items.map((i) => `• ${i}`).join("\n");

  return [
    {
      heading: "1. Client Information",
      body: [
        `Nama klien: ${lead.name}`,
        `Bisnis: ${client}`,
        lead.email ? `Email: ${lead.email}` : null,
        lead.whatsapp ? `WhatsApp: ${lead.whatsapp}` : null,
        lead.ai_business_category ? `Kategori bisnis: ${lead.ai_business_category}` : null,
        lead.project_type ? `Jenis project: ${lead.project_type}` : null,
      ]
        .filter(Boolean)
        .join("\n"),
    },
    {
      heading: "2. Business Challenge",
      body:
        lead.ai_summary?.trim() ||
        `${client} sedang menghadapi hambatan pada proses operasional harian. Kebutuhan yang disampaikan: ${
          lead.requirement?.trim() || "peningkatan efisiensi lewat sistem digital"
        }.`,
    },
    { heading: "3. Current Problems", body: bullets(brief.painPoints) },
    {
      heading: "4. Proposed Solution",
      body: `KERJAKU merekomendasikan ${brief.recommendedPackage}. Solusi ini dirancang untuk menyelesaikan ${brief.painPoints[0].toLowerCase()} dengan alur kerja terpusat, data yang rapi, dan laporan yang terbentuk otomatis.`,
    },
    { heading: "5. Recommended Features", body: bullets(brief.features) },
    { heading: "6. Project Scope", body: bullets(brief.scope) },
    {
      heading: "7. Timeline Estimate",
      body: `${brief.timeline}${lead.timeline ? `\nTarget klien: ${lead.timeline}.` : ""}`,
    },
    { heading: "8. Investment Recommendation", body: brief.investment },
    {
      heading: "9. Next Steps",
      body: bullets([
        "Konfirmasi scope fase pertama bersama tim KERJAKU",
        "Penjadwalan sesi discovery (60 menit)",
        "Penandatanganan kesepakatan kerja & DP",
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
