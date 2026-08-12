import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { ProposalDocData } from "@/lib/proposal-doc";

const idSchema = z.object({ id: z.string().uuid() });

type LeadContact = { name?: string | null; email?: string | null; whatsapp?: string | null };

async function loadProposalDoc(
  supabase: {
    from: (table: string) => any;
  },
  id: string,
): Promise<{ doc: ProposalDocData; leadId: string | null }> {
  const { data: proposal, error } = await supabase
    .from("proposals")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!proposal) throw new Error("Proposal tidak ditemukan.");

  let lead: LeadContact = {};
  if (proposal.lead_id) {
    const { data } = await supabase
      .from("consultations")
      .select("name, email, whatsapp")
      .eq("id", proposal.lead_id)
      .maybeSingle();
    lead = (data as LeadContact) ?? {};
  }

  const sections = Array.isArray(proposal.content)
    ? (proposal.content as unknown[]).map((row) => ({
        heading: String((row as { heading?: unknown })?.heading ?? ""),
        body: String((row as { body?: unknown })?.body ?? ""),
      }))
    : [];
  const pricing = Array.isArray(proposal.pricing_items)
    ? (proposal.pricing_items as unknown[]).map((row) => ({
        item: String((row as { item?: unknown })?.item ?? ""),
        detail: String((row as { detail?: unknown })?.detail ?? ""),
        amount: Number((row as { amount?: unknown })?.amount ?? 0) || 0,
      }))
    : [];

  const doc: ProposalDocData = {
    title: String(proposal.title ?? "Proposal KERJAKU"),
    version: Number(proposal.version ?? 1),
    clientName: String(proposal.client_name ?? lead.name ?? "Client"),
    contactName: String(lead.name ?? proposal.client_name ?? "Client"),
    email: lead.email ?? null,
    whatsapp: lead.whatsapp ?? null,
    recommendedPackage: (proposal.recommended_package as string) ?? null,
    currency: String(proposal.currency ?? "IDR"),
    validUntil: (proposal.valid_until as string) ?? null,
    investmentNote: (proposal.investment_note as string) ?? null,
    timelineNote: (proposal.timeline_note as string) ?? null,
    sections,
    pricing,
    createdAt: String(proposal.created_at ?? new Date().toISOString()),
  };

  return { doc, leadId: (proposal.lead_id as string) ?? null };
}

/** Generate + store the proposal PDF and return a clean KERJAKU short link. */
export const prepareProposalFile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => idSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { proposalFileName, proposalSlugBase, buildProposalWhatsappMessage } = await import(
      "@/lib/proposal-doc"
    );
    const { buildProposalPdf } = await import("@/lib/proposal-pdf");
    const { uploadDocumentPdf } = await import("@/lib/order-brief.server");

    const { doc, leadId } = await loadProposalDoc(context.supabase as never, data.id);
    const fileName = proposalFileName(doc.clientName);

    const uploaded = await uploadDocumentPdf({
      kind: "proposal",
      slugBase: proposalSlugBase(doc.clientName),
      folder: leadId ?? data.id,
      fileName,
      bytes: buildProposalPdf(doc),
      leadId,
      createdBy: context.userId,
    });
    if (!uploaded.url) {
      throw new Error(`Gagal menyiapkan file proposal: ${uploaded.reason ?? "unknown"}`);
    }

    return {
      fileName,
      url: uploaded.url,
      whatsapp: doc.whatsapp,
      clientName: doc.clientName,
      message: buildProposalWhatsappMessage({
        clientName: doc.contactName,
        fileName,
        previewUrl: uploaded.url,
      }),
    };
  });

/** Log a proposal delivery and move the proposal into "Sent". */
export const markProposalSent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        channel: z.enum(["whatsapp", "email"]),
        fileName: z.string().max(200),
        url: z.string().url().optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const supabase = context.supabase as never as { from: (table: string) => any };
    const { data: proposal } = await supabase
      .from("proposals")
      .select("id, lead_id, status, version")
      .eq("id", data.id)
      .maybeSingle();
    if (!proposal) throw new Error("Proposal tidak ditemukan.");

    if (proposal.status === "Draft") {
      await supabase
        .from("proposals")
        .update({ status: "Sent", sent_at: new Date().toISOString() })
        .eq("id", data.id);
    }

    if (proposal.lead_id) {
      await supabase.from("lead_ai_activities").insert({
        lead_id: proposal.lead_id,
        action: "proposal.sent",
        label: data.channel === "whatsapp" ? "WhatsApp" : "Email",
        content: `Proposal v${proposal.version ?? 1} dikirim melalui ${
          data.channel === "whatsapp" ? "WhatsApp" : "Email"
        }`,
        meta: {
          channel: data.channel,
          fileName: data.fileName,
          url: data.url ?? null,
          proposalId: data.id,
          status: "success",
        },
        created_by: context.userId,
        created_by_email: (context.claims as { email?: string } | null)?.email ?? null,
      });
    }

    return { ok: true as const };
  });
