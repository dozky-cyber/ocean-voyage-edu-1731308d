import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { InvoiceDocData, InvoiceEstimate, InvoiceLine } from "@/lib/invoice-doc";

const idSchema = z.object({ id: z.string().uuid() });

function lines(value: unknown): InvoiceLine[] {
  if (!Array.isArray(value)) return [];
  return value.map((row) => ({
    item: String((row as { item?: unknown })?.item ?? ""),
    detail: String((row as { detail?: unknown })?.detail ?? ""),
    amount: Number((row as { amount?: unknown })?.amount ?? 0) || 0,
  }));
}

/** Proposal enhancements → estimasi opsional (informatif, tidak masuk total). */
function estimates(value: unknown): InvoiceEstimate[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((row) => {
      const item = row as {
        name?: unknown;
        benefit?: unknown;
        amount?: unknown;
        priority?: unknown;
        phase?: unknown;
      };
      const priority = Number(item?.priority ?? 0);
      const phase = Number(item?.phase ?? 0);
      const meta = [
        priority ? `Prioritas ${priority}` : "",
        phase ? `Fase ${phase}` : "",
        "estimasi harga, belum termasuk total",
      ]
        .filter(Boolean)
        .join("  |  ");
      return {
        name: String(item?.name ?? "").trim(),
        note: meta,
        amount: Number(item?.amount ?? 0) || 0,
      };
    })
    .filter((row) => row.name.length > 0);
}

async function loadInvoiceDoc(
  supabase: { from: (table: string) => any },
  id: string,
): Promise<{ doc: InvoiceDocData; leadId: string | null }> {
  const { derivePaymentState, isPaymentType, parseSchedule, recalcSchedule } = await import(
    "@/lib/admin/invoice-schedule"
  );
  const { customerEmail, customerWhatsapp, cleanContactName } = await import("@/lib/invoice-doc");
  const { providerLabel } = await import("@/lib/admin/payments");

  const { data: invoice, error } = await supabase
    .from("invoices")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!invoice) throw new Error("Invoice tidak ditemukan.");

  let proposal:
    | { title?: string | null; version?: number | null; enhancements?: unknown }
    | null = null;
  if (invoice.proposal_id) {
    const { data } = await supabase
      .from("proposals")
      .select("title, version, enhancements")
      .eq("id", invoice.proposal_id)
      .maybeSingle();
    proposal = data ?? null;
  }

  const total = Number(invoice.amount) || 0;
  const schedule = recalcSchedule(parseSchedule(invoice.schedule), total);

  const business = String(invoice.client_company ?? "").trim() || null;
  const contact = cleanContactName(String(invoice.client_name ?? "")) || "Client";

  const doc: InvoiceDocData = {
    number: String(invoice.number ?? "-"),
    issueDate: String(invoice.created_at ?? new Date().toISOString()),
    dueDate: (invoice.due_date as string) ?? null,
    status: String(invoice.status ?? "Pending"),
    paymentState: derivePaymentState(schedule, total),
    clientName: contact,
    businessName: business && business.toLowerCase() !== contact.toLowerCase() ? business : null,
    email: customerEmail(invoice.client_email as string | null),
    whatsapp: customerWhatsapp(invoice.client_whatsapp as string | null),
    projectName: String(invoice.project_name ?? invoice.package ?? "Project Digital"),
    packageName: (invoice.package as string) ?? null,
    proposalRef: proposal
      ? `Proposal V${Number(proposal.version ?? 1)}${proposal.title ? ` — ${proposal.title}` : ""}`
      : null,
    currency: String(invoice.currency ?? "IDR"),
    core: lines(invoice.items),
    optional: lines(invoice.optional_items),
    estimates: estimates(proposal?.enhancements),
    total,
    paymentType: isPaymentType(invoice.payment_type) ? invoice.payment_type : "full",
    schedule,
    paymentMethod: invoice.provider ? providerLabel(String(invoice.provider)) : null,
    paymentLink: (invoice.payment_link as string) ?? null,
    notes: (invoice.notes as string) ?? null,
  };

  return { doc, leadId: (invoice.lead_id as string) ?? null };
}

/** Generate + store the invoice PDF and return a clean KERJAKU short link. */
export const prepareInvoiceFile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => idSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { invoiceFileName, invoiceSlugBase, buildInvoiceWhatsappMessage } = await import(
      "@/lib/invoice-doc"
    );
    const { buildInvoicePdf } = await import("@/lib/invoice-pdf");
    const { uploadDocumentPdf } = await import("@/lib/order-brief.server");

    const { doc, leadId } = await loadInvoiceDoc(context.supabase as never, data.id);
    const fileName = invoiceFileName(doc.clientName);

    const uploaded = await uploadDocumentPdf({
      kind: "invoice",
      slugBase: invoiceSlugBase(doc.clientName),
      folder: leadId ?? data.id,
      fileName,
      bytes: buildInvoicePdf(doc),
      leadId,
      createdBy: context.userId,
      linkPath: "i",
    });
    if (!uploaded.url) {
      throw new Error(`Gagal menyiapkan file invoice: ${uploaded.reason ?? "unknown"}`);
    }

    return {
      fileName,
      url: uploaded.url,
      whatsapp: doc.whatsapp,
      clientName: doc.clientName,
      message: buildInvoiceWhatsappMessage({
        clientName: doc.clientName,
        invoiceNumber: doc.number,
        projectName: doc.projectName,
        total: doc.total,
        currency: doc.currency,
        paymentType: doc.paymentType,
        schedule: doc.schedule,
        dueDate: doc.dueDate,
        previewUrl: uploaded.url,
      }),
    };
  });
