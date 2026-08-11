// Client-safe helpers for the KERJAKU Order Brief follow-up (CRM delivery).
// Pure formatting/normalisation only — no AI Consultant logic is touched here.

export type OrderBriefData = {
  version: number;
  customerName: string;
  whatsapp: string | null;
  email: string | null;
  business: string;
  project: string;
  goal: string | null;
  problems: string[];
  usersScale: string | null;
  adminNeeds: string | null;
  features: string[];
  timeline: string | null;
  budget: string | null;
  recommendation: string | null;
  createdAt: string;
};

/** Normalise an Indonesian phone number to WhatsApp format (628xxxxxxxxx). */
export function normalizeWhatsapp(raw: string | null | undefined): string | null {
  if (!raw) return null;
  let digits = raw.replace(/\D/g, "");
  if (!digits) return null;
  if (digits.startsWith("0")) digits = `62${digits.slice(1)}`;
  else if (digits.startsWith("8")) digits = `62${digits}`;
  else if (digits.startsWith("620")) digits = `62${digits.slice(3)}`;
  if (!digits.startsWith("62")) digits = `62${digits}`;
  return digits.length >= 10 ? digits : null;
}

export function waLink(number: string, message: string) {
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}

function safeName(value: string) {
  return (
    value
      .trim()
      .replace(/[^A-Za-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "") || "Customer"
  );
}

export function briefFileName(customerName: string) {
  return `Order_Brief_KERJAKU_${safeName(customerName)}.pdf`;
}

/** Jakarta (WIB) date + time strings. */
export function wibStamp(iso?: string) {
  const date = iso ? new Date(iso) : new Date();
  const tz = "Asia/Jakarta";
  return {
    date: date.toLocaleDateString("id-ID", {
      timeZone: tz,
      day: "numeric",
      month: "long",
      year: "numeric",
    }),
    time: `${date.toLocaleTimeString("id-ID", {
      timeZone: tz,
      hour: "2-digit",
      minute: "2-digit",
    })} WIB`,
  };
}

/** Message sent to the customer (identical for WhatsApp and email body). */
export function buildFollowUpMessage(brief: OrderBriefData, stampIso?: string) {
  const { date, time } = wibStamp(stampIso);
  return [
    "Halo Kak, terima kasih sudah melakukan konsultasi bersama KERJAKU AI Consultant.",
    "",
    "Berikut hasil preview konsultasi awal Kakak yang sudah kami rangkum dalam Order Brief KERJAKU.",
    "",
    "Jika ada tambahan fitur, perubahan kebutuhan, atau ingin konsultasi lanjutan bisa langsung informasikan kepada kami ya Kak.",
    "",
    `📎 Terlampir Order Brief: ${briefFileName(brief.customerName)}`,
    "",
    `Tanggal: ${date}`,
    `Jam: ${time}`,
    "",
    "Tim KERJAKU akan melakukan pengecekan kebutuhan terlebih dahulu.",
    "Setelah kebutuhan sudah final, tim kami akan memberikan rekomendasi solusi dan penawaran harga yang sesuai.",
    "",
    "Terima kasih sudah mempercayakan konsultasi kepada KERJAKU 🙏",
  ].join("\n");
}

export function emailSubject(brief: OrderBriefData) {
  return `Order Brief Konsultasi KERJAKU - ${brief.customerName}`;
}

/** Ordered field list used by both the preview UI and the PDF. */
export function briefFields(brief: OrderBriefData): { label: string; value: string }[] {
  const list = (items: string[]) => (items.length ? items.map((i) => `• ${i}`).join("\n") : "-");
  return [
    { label: "Bisnis", value: brief.business || "-" },
    { label: "Project", value: brief.project || "-" },
    { label: "Tujuan", value: brief.goal || "-" },
    { label: "Masalah Bisnis", value: list(brief.problems) },
    { label: "User Sistem", value: brief.usersScale || "-" },
    { label: "Kebutuhan Admin/Team", value: brief.adminNeeds || "-" },
    { label: "Fitur", value: list(brief.features) },
    { label: "Timeline", value: brief.timeline || "-" },
    { label: "Budget", value: brief.budget || "-" },
    { label: "AI Recommendation", value: brief.recommendation || "-" },
  ];
}
