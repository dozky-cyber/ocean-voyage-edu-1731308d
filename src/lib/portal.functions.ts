/**
 * Client Portal — token-authenticated public access.
 *
 * The portal link contains a long random token that identifies exactly one
 * client row. The handler verifies the token server-side and returns only that
 * client's project, payment, document and message data (never PII of others).
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { parseTimeline } from "@/lib/admin/payments";

const tokenSchema = z.object({ token: z.string().min(20).max(120) });

export const getClientPortal = createServerFn({ method: "GET" })
  .inputValidator((data: unknown) => tokenSchema.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: client } = await supabaseAdmin
      .from("clients")
      .select("id, name, company, package, status, converted_at, lead_id")
      .eq("portal_token", data.token)
      .maybeSingle();
    if (!client) return { found: false as const };

    const [projects, documents, messages, invoices] = await Promise.all([
      supabaseAdmin
        .from("client_projects")
        .select("id, name, status, progress, summary, timeline, start_date, target_date")
        .eq("client_id", client.id)
        .order("created_at", { ascending: false }),
      supabaseAdmin
        .from("client_documents")
        .select("id, title, kind, url, created_at")
        .eq("client_id", client.id)
        .order("created_at", { ascending: false }),
      supabaseAdmin
        .from("client_messages")
        .select("id, sender, author_name, body, created_at")
        .eq("client_id", client.id)
        .order("created_at", { ascending: true })
        .limit(200),
      client.lead_id
        ? supabaseAdmin
            .from("invoices")
            .select("id, number, title, amount, currency, status, due_date, paid_at, payment_link")
            .eq("lead_id", client.lead_id)
            .order("created_at", { ascending: false })
        : Promise.resolve({ data: [] as never[] }),
    ]);

    return {
      found: true as const,
      client: {
        name: client.name,
        company: client.company,
        package: client.package,
        status: client.status,
        since: client.converted_at,
      },
      projects: (projects.data ?? []).map((p) => ({
        ...p,
        timeline: parseTimeline(p.timeline),
      })),
      documents: documents.data ?? [],
      messages: messages.data ?? [],
      invoices: invoices.data ?? [],
    };
  });

export const sendClientPortalMessage = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    tokenSchema.extend({ body: z.string().min(1).max(2000) }).parse(data),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: client } = await supabaseAdmin
      .from("clients")
      .select("id, name")
      .eq("portal_token", data.token)
      .maybeSingle();
    if (!client) throw new Error("Portal tidak ditemukan.");

    const { error } = await supabaseAdmin.from("client_messages").insert({
      client_id: client.id,
      sender: "client",
      author_name: client.name,
      body: data.body,
    });
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });
