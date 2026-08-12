import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { orderBriefStatus, type OrderBriefData, type OrderBriefStatus } from "@/lib/order-brief";

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
  status: string;
  url: string | null;
};

type ActivityRow = {
  id: string;
  action: string;
  label: string | null;
  meta: Record<string, unknown> | null;
  created_by_email: string | null;
  created_at: string;
};

/** Latest Order Brief + delivery history + workflow status. */
export const getOrderBrief = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => targetSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { loadOrderBriefFor } = await import("@/lib/order-brief.server");
    const found = await loadOrderBriefFor(context.supabase as never, data);
    const loaded = found ? { ...found, leadId: found.leadId ?? data.leadId ?? null } : null;
    if (!loaded)
      return {
        brief: null,
        leadId: data.leadId ?? null,
        conversationId: null as string | null,
        deliveries: [] as OrderBriefDelivery[],
        status: "None" as OrderBriefStatus,
      };

    let deliveries: OrderBriefDelivery[] = [];
    let reviewed = false;
    if (loaded.leadId) {
      const { data: rows } = await context.supabase
        .from("lead_ai_activities")
        .select("id, action, label, meta, created_by_email, created_at")
        .eq("lead_id", loaded.leadId)
        .in("action", ["order_brief.sent", "order_brief.reviewed"])
        .order("created_at", { ascending: false })
        .limit(40);
      const list = (rows ?? []) as unknown as ActivityRow[];
      reviewed = list.some((row) => row.action === "order_brief.reviewed");
      deliveries = list
        .filter((row) => row.action === "order_brief.sent")
        .map((row) => ({
          id: row.id,
          channel: (row.meta?.["channel"] as string) ?? row.label ?? "-",
          file_name: (row.meta?.["fileName"] as string) ?? "-",
          created_at: row.created_at,
          created_by_email: row.created_by_email,
          status: (row.meta?.["status"] as string) ?? "success",
          url: (row.meta?.["url"] as string) ?? null,
        }));
    }

    const status = orderBriefStatus({
      hasBrief: true,
      reviewed,
      sentWhatsapp: deliveries.some((d) => d.channel === "whatsapp" && d.status === "success"),
      sentEmail: deliveries.some((d) => d.channel === "email" && d.status === "success"),
    });

    return {
      brief: loaded.brief as OrderBriefData,
      leadId: loaded.leadId,
      conversationId: loaded.conversationId,
      deliveries,
      status,
    };
  });

const deliverySchema = z
  .object({
    conversationId: z.string().uuid().optional(),
    leadId: z.string().uuid().optional(),
    channel: z.enum(["whatsapp", "email"]),
    markContacted: z.boolean().default(true),
    pdfUrl: z.string().url().optional(),
  })
  .refine((value) => Boolean(value.conversationId || value.leadId), {
    message: "conversationId atau leadId wajib diisi.",
  });

async function logActivity(
  context: { supabase: unknown; userId: string; claims: unknown },
  leadId: string | null,
  action: string,
  label: string,
  content: string,
  meta: Record<string, unknown>,
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
    action,
    label,
    content,
    meta,
    created_by: context.userId,
    created_by_email: email,
  });
}

async function recordDelivery(
  context: { supabase: unknown; userId: string; claims: unknown },
  leadId: string | null,
  channel: string,
  fileName: string,
  detail: string,
  markContacted: boolean,
  extra: Record<string, unknown> = {},
) {
  if (!leadId) return;
  await logActivity(
    context,
    leadId,
    "order_brief.sent",
    channel === "whatsapp" ? "WhatsApp" : "Email",
    detail,
    { channel, fileName, status: "success", ...extra },
  );

  if (markContacted) {
    const { fetchLead, setLeadStage } = await import("@/lib/admin.server");
    const lead = (await fetchLead(context.supabase as never, leadId)) as { status?: string } | null;
    if (!lead || lead.status === "New Lead" || lead.status === "New" || !lead.status) {
      await setLeadStage(context.supabase as never, leadId, "Contacted");
    }
  }
}

/** Mark the brief as reviewed (admin opened preview or edit form). */
export const markOrderBriefReviewed = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => targetSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { loadOrderBriefFor } = await import("@/lib/order-brief.server");
    const loaded = await loadOrderBriefFor(context.supabase as never, data);
    const leadId = loaded?.leadId ?? data.leadId ?? null;
    if (!leadId || !loaded) return { ok: false as const };
    const { count } = (await (context.supabase as never as any)
      .from("lead_ai_activities")
      .select("id", { count: "exact", head: true })
      .eq("lead_id", leadId)
      .eq("action", "order_brief.reviewed")) as { count: number | null };
    if ((count ?? 0) === 0) {
      await logActivity(
        context as never,
        leadId,
        "order_brief.reviewed",
        "Reviewed",
        `Order Brief v${loaded.brief.version} direview admin`,
        {},
      );
    }
    return { ok: true as const };
  });

/** Generate the PDF, store it, and return a shareable signed download link. */
export const prepareOrderBriefFile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => targetSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { loadOrderBriefFor, uploadOrderBriefPdf } = await import("@/lib/order-brief.server");
    const { briefFileName } = await import("@/lib/order-brief");
    const { buildOrderBriefPdf } = await import("@/lib/order-brief-pdf");

    const loaded = await loadOrderBriefFor(context.supabase as never, data);
    if (!loaded) throw new Error("Order Brief belum tersedia.");
    const fileName = briefFileName(loaded.brief.customerName);
    const uploaded = await uploadOrderBriefPdf({
      leadId: loaded.leadId ?? data.leadId ?? null,
      conversationId: loaded.conversationId,
      fileName,
      bytes: buildOrderBriefPdf(loaded.brief),
    });
    if (!uploaded.url) {
      throw new Error(`Gagal menyiapkan file PDF: ${uploaded.reason ?? "unknown"}`);
    }
    return { fileName, url: uploaded.url };
  });

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
      data.pdfUrl ? { url: data.pdfUrl } : {},
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
    const { loadOrderBriefFor, sendOrderBriefEmail, uploadOrderBriefPdf } = await import(
      "@/lib/order-brief.server"
    );
    const { briefFileName, buildFollowUpMessage, emailSubject } = await import("@/lib/order-brief");
    const { buildOrderBriefPdf } = await import("@/lib/order-brief-pdf");

    const loaded = await loadOrderBriefFor(context.supabase as never, data);
    if (!loaded) throw new Error("Order Brief belum tersedia.");
    const to = data.to ?? loaded.brief.email;
    if (!to) throw new Error("Email customer belum tersedia.");

    const fileName = briefFileName(loaded.brief.customerName);
    const bytes = buildOrderBriefPdf(loaded.brief);
    let binary = "";
    for (const byte of bytes) binary += String.fromCharCode(byte);
    const pdfBase64 = btoa(binary);

    const uploaded = await uploadOrderBriefPdf({
      leadId: loaded.leadId ?? data.leadId ?? null,
      conversationId: loaded.conversationId,
      fileName,
      bytes,
    });

    const result = await sendOrderBriefEmail({
      to,
      subject: emailSubject(loaded.brief),
      message: buildFollowUpMessage(loaded.brief, { pdfUrl: uploaded.url }),
      fileName,
      pdfBase64,
    });
    if (!result.sent) {
      await logActivity(
        context as never,
        loaded.leadId ?? data.leadId ?? null,
        "order_brief.sent",
        "Email",
        `Order Brief v${loaded.brief.version} GAGAL dikirim ke ${to}: ${result.reason}`,
        { channel: "email", fileName, status: "failed", reason: result.reason },
      );
      throw new Error(`Email gagal dikirim. ${result.reason ?? ""}`.trim());
    }

    await recordDelivery(
      context as never,
      loaded.leadId ?? data.leadId ?? null,
      "email",
      fileName,
      `Order Brief v${loaded.brief.version} dikirim melalui Email ke ${to}`,
      data.markContacted,
      uploaded.url ? { url: uploaded.url } : {},
    );
    return { ok: true as const, fileName, to };
  });

const briefEditSchema = z
  .object({
    conversationId: z.string().uuid().optional(),
    leadId: z.string().uuid().optional(),
    customerName: z.string().min(1),
    whatsapp: z.string().nullable().default(null),
    email: z.string().nullable().default(null),
    business: z.string().default(""),
    project: z.string().default(""),
    goal: z.string().nullable().default(null),
    problems: z.array(z.string()).default([]),
    usersScale: z.string().nullable().default(null),
    adminNeeds: z.string().nullable().default(null),
    features: z.array(z.string()).default([]),
    timeline: z.string().nullable().default(null),
    budget: z.string().nullable().default(null),
    recommendation: z.string().nullable().default(null),
  })
  .refine((value) => Boolean(value.conversationId || value.leadId), {
    message: "conversationId atau leadId wajib diisi.",
  });

/** Save an edited Order Brief as a new version (old versions stay intact). */
export const saveOrderBrief = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => briefEditSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { loadOrderBriefFor, saveOrderBriefVersion } = await import("@/lib/order-brief.server");
    const loaded = await loadOrderBriefFor(context.supabase as never, {
      conversationId: data.conversationId,
      leadId: data.leadId,
    });
    if (!loaded) throw new Error("Order Brief belum tersedia.");

    const next: OrderBriefData = {
      version: loaded.brief.version + 1,
      customerName: data.customerName,
      whatsapp: data.whatsapp,
      email: data.email,
      business: data.business,
      project: data.project,
      goal: data.goal,
      problems: data.problems,
      usersScale: data.usersScale,
      adminNeeds: data.adminNeeds,
      features: data.features,
      timeline: data.timeline,
      budget: data.budget,
      recommendation: data.recommendation,
      createdAt: new Date().toISOString(),
    };

    const saved = await saveOrderBriefVersion(context.supabase as never, {
      conversationId: loaded.conversationId,
      leadId: loaded.leadId ?? data.leadId ?? null,
      base: loaded.brief,
      next,
      createdBy: context.userId,
    });

    await logActivity(
      context as never,
      loaded.leadId ?? data.leadId ?? null,
      "order_brief.reviewed",
      "Reviewed",
      `Order Brief diperbarui menjadi v${saved.version} oleh admin`,
      { version: saved.version },
    );

    return { ok: true as const, version: saved.version };
  });
