// Server-only consultation handling: persistence + notification formatting.
import type { ConsultationForm } from "./consultation-schema";

export const LEAD_EMAIL = "admin.kerjaku@gmail.com";

function line(label: string, value?: string | null) {
  return `${label}\n${value && value.trim() ? value.trim() : "-"}\n`;
}

export function formatLeadEmail(data: ConsultationForm, createdAt: string) {
  return {
    subject: `[Konsultasi KERJAKU] Project Baru - ${data.name}`,
    text: [
      "KONSULTASI BARU KERJAKU",
      "",
      line("Nama:", data.name),
      line("Email:", data.email),
      line("WhatsApp:", data.whatsapp),
      line("Jenis Project:", data.projectType),
      line("Kebutuhan:", data.requirement),
      line("Budget:", data.budget),
      line("Timeline:", data.timeline),
      line("Nama Bisnis:", data.businessName),
      line("Fitur:", data.features),
      line("Catatan:", data.notes),
      line("Tanggal Submit:", createdAt),
    ].join("\n"),
  };
}

function esc(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export function formatLeadTelegram(data: ConsultationForm, createdAt: string) {
  const row = (label: string, value?: string) =>
    `<b>${label}:</b>\n${value && value.trim() ? esc(value.trim()) : "-"}`;
  return [
    "🔔 <b>LEAD BARU KERJAKU</b>",
    "",
    row("Nama", data.name),
    "",
    row("Email", data.email),
    "",
    row("WhatsApp", data.whatsapp),
    "",
    row("Project", data.projectType),
    "",
    row("Budget", data.budget),
    "",
    row("Timeline", data.timeline),
    "",
    row("Kebutuhan", data.requirement),
    "",
    row("Fitur", data.features),
    "",
    row("Catatan", data.notes),
    "",
    row("Tanggal", createdAt),
  ].join("\n");
}

/** Persist the lead. Returns the row id when stored. */
export async function storeConsultation(data: ConsultationForm) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: row, error } = await supabaseAdmin
    .from("consultations")
    .insert({
      name: data.name,
      email: data.email,
      whatsapp: data.whatsapp,
      project_type: data.projectType,
      requirement: data.requirement,
      budget: data.budget,
      timeline: data.timeline,
      business_name: data.businessName || null,
      features: data.features || null,
      notes: data.notes || null,
    })
    .select("id, created_at")
    .single();

  if (error) {
    console.error(`[consultation] store failed: ${error.message}`);
    return null;
  }
  return row;
}

/**
 * Email notification to the owner. Managed email sending requires a verified
 * sender domain; until then the lead is logged (Telegram + database still work).
 */
export async function sendLeadEmail(data: ConsultationForm, createdAt: string) {
  const { subject, text } = formatLeadEmail(data, createdAt);
  // Managed email sending requires a verified sender domain for kerjaku.space.
  // Until it is set up, the lead is logged server-side; Telegram + database
  // storage still capture every submission so no lead is lost.
  console.info(`[consultation] ${subject}\n${text}`);
  return { sent: false, reason: "email_domain_not_configured" as const };
}
