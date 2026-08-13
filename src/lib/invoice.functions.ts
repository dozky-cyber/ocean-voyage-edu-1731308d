import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { InvoiceDocData, InvoiceLine } from "@/lib/invoice-doc";

const idSchema = z.object({ id: z.string().uuid() });

function lines(value: unknown): InvoiceLine[] {
  if (!Array.isArray(value)) return [];
  return value.map((row) => ({
    item: String((row as { item?: unknown })?.item ?? ""),
    detail: String((row as { detail?: unknown })?.detail ?? ""),
    amount: Number((row as { amount?: unknown })?.amount ?? 0) || 0,
  }));
}

async function loadInvoiceDoc(
  supabase: { from: (table: string) => any },
  id: string,
): Promise<{ doc: InvoiceDocData; leadId: string | null }> {
  const { derivePaymentState, isPaymentType, parseSchedule, recalcSchedule } = await import(
    "@/lib/admin/invoice-schedule"
  );

  const { data: invoice, error } = await supabase
    .from("invoices")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!invoice) throw new Error("Invoice tidak ditemukan.");

  const total = Number(invoice.amount) || 0;
  const schedule = recalcSchedule(parseSchedule(invoice.schedule), total);

  const doc: InvoiceDocData = {
    number: String(invoice.number ?? "-"),
    issueDate: String(invoice.created_at ?? new Date().toISOString()),
    dueDate: (invoice.due_date as string) ?? null,
    status: String(invoice.status ?? "Pending"),
    paymentState: derivePaymentState(schedule, total),
    clientName: String(invoice.client_name ?? "Client"),
    businessName: (invoice.client_company as string) ?? null,
    email: (invoice.client_email as string) ?? null,
    whatsapp: (invoice.client_whatsapp as string) ?? null,
    projectName: String(invoice.project_name ?? invoice.package ?? "Project Digital"),
    currency: String(invoice.currency ?? "IDR"),
    core: lines(invoice.items),
    optional: lines(invoice.optional_items),
    total,
    paymentType: isPaymentType(invoice.payment_type) ? invoice.payment_type : "full",
    schedule,
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
        projectName: doc.projectName,
        total: doc.total,
        currency: doc.currency,
        paymentType: doc.paymentType,
        schedule: doc.schedule,
        fileName,
        previewUrl: uploaded.url,
      }),
    };
  });
