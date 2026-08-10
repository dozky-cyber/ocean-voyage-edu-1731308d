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

function htmlBody(data: ConsultationForm, createdAt: string) {
  const row = (label: string, value?: string | null) =>
    `<tr><td style="padding:6px 12px 6px 0;font-weight:600;vertical-align:top;white-space:nowrap">${esc(
      label,
    )}</td><td style="padding:6px 0">${
      value && value.trim() ? esc(value.trim()).replace(/\n/g, "<br/>") : "-"
    }</td></tr>`;

  return `<div style="font-family:Arial,Helvetica,sans-serif;color:#111"><h2 style="margin:0 0 12px">Konsultasi Baru KERJAKU</h2><table style="border-collapse:collapse;font-size:14px">${[
    row("Nama", data.name),
    row("Email", data.email),
    row("WhatsApp", data.whatsapp),
    row("Project", data.projectType),
    row("Budget", data.budget),
    row("Timeline", data.timeline),
    row("Kebutuhan", data.requirement),
    row("Fitur", data.features),
    row("Catatan", data.notes),
    row("Tanggal", createdAt),
  ].join("")}</table></div>`;
}

/**
 * Email notification to the owner via the Resend connector gateway.
 * Best-effort: failures are logged, never thrown back to the form.
 */
export async function sendLeadEmail(data: ConsultationForm, createdAt: string) {
  const lovableKey = process.env["LOVABLE_API_KEY"];
  const resendKey = process.env["RESEND_API_KEY"];
  if (!lovableKey || !resendKey) {
    console.error("[consultation] email skipped: missing LOVABLE_API_KEY or RESEND_API_KEY");
    return { sent: false, reason: "email_not_configured" as const };
  }

  const { subject, text } = formatLeadEmail(data, createdAt);
  const from = process.env["RESEND_FROM"] ?? "KERJAKU <onboarding@resend.dev>";

  try {
    const response = await fetch("https://connector-gateway.lovable.dev/resend/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${lovableKey}`,
        "X-Connection-Api-Key": resendKey,
      },
      body: JSON.stringify({
        from,
        to: [LEAD_EMAIL],
        reply_to: data.email,
        subject,
        text,
        html: htmlBody(data, createdAt),
      }),
    });

    if (!response.ok) {
      const detail = await response.text();
      console.error(`[consultation] email failed [${response.status}]: ${detail}`);
      return { sent: false, reason: "email_send_failed" as const };
    }

    const accepted = (await response.json().catch(() => null)) as { id?: string } | null;
    console.info(`[consultation] email accepted by provider, id=${accepted?.id ?? "unknown"}`);
    return { sent: true, reason: null };
  } catch (error) {
    console.error(
      `[consultation] email threw: ${error instanceof Error ? error.message : String(error)}`,
    );
    return { sent: false, reason: "email_send_failed" as const };
  }
}

