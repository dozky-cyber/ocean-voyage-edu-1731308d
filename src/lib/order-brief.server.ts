// Server-only Order Brief delivery: load brief data, send email with PDF, log history.
import type { OrderBriefData } from "./order-brief";

type Client = {
  from: (table: string) => any;
};

/** Map the latest requirement version of a conversation into Order Brief data. */
export async function loadOrderBrief(
  supabase: Client,
  conversationId: string,
): Promise<{ brief: OrderBriefData; leadId: string | null } | null> {
  const { data, error } = await supabase
    .from("conversation_requirements")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;

  const row = data as Record<string, unknown>;
  const asArray = (value: unknown) =>
    Array.isArray(value) ? value.map((item) => String(item)) : [];

  const brief: OrderBriefData = {
    version: Number(row["version"] ?? 1),
    customerName: (row["contact_name"] as string) || "Customer",
    whatsapp: (row["contact_whatsapp"] as string) ?? null,
    email: (row["contact_email"] as string) ?? null,
    business: (row["business"] as string) ?? "",
    project: (row["project"] as string) ?? "",
    goal: (row["summary"] as string) ?? null,
    problems: asArray(row["problems"]),
    usersScale: (row["users_scale"] as string) ?? null,
    adminNeeds: (row["change_note"] as string) ?? null,
    features: asArray(row["features"]),
    timeline: (row["timeline"] as string) ?? null,
    budget: (row["budget"] as string) ?? null,
    recommendation: (row["package_name"] as string) ?? null,
    createdAt: (row["created_at"] as string) ?? new Date().toISOString(),
  };

  return { brief, leadId: (row["lead_id"] as string) ?? null };
}

/** Same mapping, but resolved from the CRM lead id instead of a conversation. */
export async function loadOrderBriefByLead(
  supabase: Client,
  leadId: string,
): Promise<{ brief: OrderBriefData; leadId: string | null } | null> {
  const { data, error } = await supabase
    .from("conversation_requirements")
    .select("conversation_id")
    .eq("lead_id", leadId)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data?.conversation_id) return null;
  return loadOrderBrief(supabase, data.conversation_id as string);
}

/** Resolve a brief from either a conversation id or a CRM lead id. */
export async function loadOrderBriefFor(
  supabase: Client,
  target: { conversationId?: string; leadId?: string },
) {
  if (target.conversationId) return loadOrderBrief(supabase, target.conversationId);
  if (target.leadId) return loadOrderBriefByLead(supabase, target.leadId);
  return null;
}

function htmlFromMessage(message: string) {
  const esc = (value: string) =>
    value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return `<div style="font-family:Arial,Helvetica,sans-serif;color:#111;font-size:14px;line-height:1.6">${esc(
    message,
  ).replace(/\n/g, "<br/>")}</div>`;
}

/** Send the Order Brief to the customer via Resend with the PDF attached. */
export async function sendOrderBriefEmail(input: {
  to: string;
  subject: string;
  message: string;
  fileName: string;
  pdfBase64: string;
}): Promise<{ sent: boolean; reason: string | null }> {
  const lovableKey = process.env["LOVABLE_API_KEY"];
  const resendKey = process.env["RESEND_API_KEY"];
  if (!lovableKey || !resendKey) {
    return { sent: false, reason: "email_not_configured" };
  }
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
        to: [input.to],
        subject: input.subject,
        text: input.message,
        html: htmlFromMessage(input.message),
        attachments: [{ filename: input.fileName, content: input.pdfBase64 }],
      }),
    });
    if (!response.ok) {
      const detail = await response.text();
      console.error(`[order-brief] email failed [${response.status}]: ${detail}`);
      return { sent: false, reason: `email_send_failed_${response.status}` };
    }
    return { sent: true, reason: null };
  } catch (error) {
    console.error(
      `[order-brief] email threw: ${error instanceof Error ? error.message : String(error)}`,
    );
    return { sent: false, reason: "email_send_failed" };
  }
}
