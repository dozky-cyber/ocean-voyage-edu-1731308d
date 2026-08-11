import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { OrderBriefData } from "@/lib/order-brief";

/** Either a conversation id (AI Consultant view) or a CRM lead id. */
const targetSchema = z
  .object({
    conversationId: z.string().uuid().optional(),
    leadId: z.string().uuid().optional(),
  })
  .refine((value) => Boolean(value.conversationId || value.leadId), {
    message: "conversationId atau leadId wajib diisi.",
  });

export type OrderBriefDelivery = {
  id: string;
  channel: string;
  file_name: string;
  created_at: string;
  created_by_email: string | null;
};

/** Latest Order Brief for a conversation + delivery history. */
export const getOrderBrief = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => targetSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { loadOrderBriefFor } = await import("@/lib/order-brief.server");
    const found = await loadOrderBriefFor(context.supabase as never, data);
    const loaded = found ? { ...found, leadId: found.leadId ?? data.leadId ?? null } : null;
    if (!loaded) return { brief: null, leadId: data.leadId ?? null, deliveries: [] as OrderBriefDelivery[] };

    let deliveries: OrderBriefDelivery[] = [];
    if (loaded.leadId) {
      const { data: rows } = await context.supabase
        .from("lead_ai_activities")
        .select("id, action, label, meta, created_by_email, created_at")
        .eq("lead_id", loaded.leadId)
        .eq("action", "order_brief.sent")
        .order("created_at", { ascending: false })
        .limit(20);
      deliveries = (rows ?? []).map((row) => ({
        id: row.id as string,
        channel: ((row.meta as { channel?: string } | null)?.channel ?? row.label ?? "-") as string,
        file_name: ((row.meta as { fileName?: string } | null)?.fileName ?? "-") as string,
        created_at: row.created_at as string,
        created_by_email: (row.created_by_email as string | null) ?? null,
      }));
    }

    return { brief: loaded.brief as OrderBriefData, leadId: loaded.leadId, deliveries };
  });

const deliverySchema = z
  .object({
    conversationId: z.string().uuid().optional(),
    leadId: z.string().uuid().optional(),
    channel: z.enum(["whatsapp", "email"]),
    markContacted: z.boolean().default(true),
  })
  .refine((value) => Boolean(value.conversationId || value.leadId), {
    message: "conversationId atau leadId wajib diisi.",
  });

async function recordDelivery(
  context: { supabase: unknown; userId: string; claims: unknown },
  leadId: string | null,
  channel: string,
  fileName: string,
  detail: string,
  markContacted: boolean,
) {
  if (!leadId) return;
  const supabase = context.supabase as never as {
    from: (table: string) => {
      insert: (values: Record<string, unknown>) => Promise<{ error: { message: string } | null }>;
    };
  };
  const email =
    context.claims && typeof context.claims === "object"
      ? ((context.claims as { email?: string }).email ?? null)
      : null;
  await supabase.from("lead_ai_activities").insert({
    lead_id: leadId,
    action: "order_brief.sent",
    label: channel === "whatsapp" ? "WhatsApp" : "Email",
    content: detail,
    meta: { channel, fileName },
    created_by: context.userId,
    created_by_email: email,
  });

  if (markContacted) {
    const { fetchLead, setLeadStage } = await import("@/lib/admin.server");
    const lead = (await fetchLead(context.supabase as never, leadId)) as {
      status?: string;
    } | null;
    if (!lead || lead.status === "New Lead" || lead.status === "New" || !lead.status) {
      await setLeadStage(context.supabase as never, leadId, "Contacted");
    }
  }
}

/** Log a WhatsApp send (link opened by admin) and move the lead to Contacted. */
export const markOrderBriefSent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => deliverySchema.parse(input))
  .handler(async ({ data, context }) => {
    const { loadOrderBriefFor } = await import("@/lib/order-brief.server");
    const { briefFileName } = await import("@/lib/order-brief");
    const loaded = await loadOrderBriefFor(context.supabase as never, data);
    if (!loaded) throw new Error("Order Brief belum tersedia.");
    const fileName = briefFileName(loaded.brief.customerName);
    await recordDelivery(
      context as never,
      loaded.leadId ?? data.leadId ?? null,
      data.channel,
      fileName,
      `Order Brief v${loaded.brief.version} dikirim melalui ${
        data.channel === "whatsapp" ? "WhatsApp" : "Email"
      }`,
      data.markContacted,
    );
    return { ok: true as const, fileName };
  });

/** Send the Order Brief PDF to the customer email, then log + update pipeline. */
export const sendOrderBriefByEmail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        conversationId: z.string().uuid().optional(),
        leadId: z.string().uuid().optional(),
        to: z.string().email().optional(),
        markContacted: z.boolean().default(true),
      })
      .refine((value) => Boolean(value.conversationId || value.leadId), {
        message: "conversationId atau leadId wajib diisi.",
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { loadOrderBriefFor, sendOrderBriefEmail } = await import("@/lib/order-brief.server");
    const { briefFileName, buildFollowUpMessage, emailSubject } = await import(
      "@/lib/order-brief"
    );
    const { orderBriefPdfBase64 } = await import("@/lib/order-brief-pdf");

    const loaded = await loadOrderBriefFor(context.supabase as never, data);
    if (!loaded) throw new Error("Order Brief belum tersedia.");
    const to = data.to ?? loaded.brief.email;
    if (!to) throw new Error("Email customer belum tersedia.");

    const fileName = briefFileName(loaded.brief.customerName);
    const result = await sendOrderBriefEmail({
      to,
      subject: emailSubject(loaded.brief),
      message: buildFollowUpMessage(loaded.brief),
      fileName,
      pdfBase64: orderBriefPdfBase64(loaded.brief),
    });
    if (!result.sent) throw new Error(`Email gagal dikirim (${result.reason}).`);

    await recordDelivery(
      context as never,
      loaded.leadId ?? data.leadId ?? null,
      "email",
      fileName,
      `Order Brief v${loaded.brief.version} dikirim melalui Email ke ${to}`,
      data.markContacted,
    );
    return { ok: true as const, fileName, to };
  });
