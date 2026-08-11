import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { PAYMENT_PROVIDER_IDS, PAYMENT_STATUSES, PROJECT_STATUSES } from "@/lib/admin/payments";

const pricingItemSchema = z.object({
  item: z.string().max(200),
  detail: z.string().max(500),
  amount: z.number().min(0).max(1_000_000_000_000),
});

/* ---------------------------------- Invoices ------------------------------ */

export const getInvoices = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { assertWorkspace } = await import("./admin.server");
    const { fetchInvoices } = await import("./billing.server");
    await assertWorkspace(context.supabase, context.userId);
    return fetchInvoices(context.supabase);
  });

export const getLeadInvoices = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ leadId: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const { assertWorkspace } = await import("./admin.server");
    const { fetchInvoices } = await import("./billing.server");
    await assertWorkspace(context.supabase, context.userId);
    return fetchInvoices(context.supabase, data.leadId);
  });

export const getInvoice = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const { assertWorkspace } = await import("./admin.server");
    const { fetchInvoice } = await import("./billing.server");
    await assertWorkspace(context.supabase, context.userId);
    return fetchInvoice(context.supabase, data.id);
  });

export const generateInvoice = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ proposalId: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const { assertLeadWork } = await import("./admin.server");
    const { createInvoiceFromProposal } = await import("./billing.server");
    await assertLeadWork(context.supabase, context.userId);
    return createInvoiceFromProposal(context.supabase, data.proposalId, context.userId);
  });

export const saveInvoiceFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        title: z.string().min(1).max(200),
        client_name: z.string().max(200).nullable(),
        client_email: z.string().max(200).nullable(),
        client_whatsapp: z.string().max(60).nullable(),
        client_company: z.string().max(200).nullable(),
        package: z.string().max(120).nullable(),
        items: z.array(pricingItemSchema).max(30),
        currency: z.string().max(8),
        due_date: z.string().max(20).nullable(),
        notes: z.string().max(4000).nullable(),
        provider: z.enum(PAYMENT_PROVIDER_IDS),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const { assertLeadWork } = await import("./admin.server");
    const { saveInvoice } = await import("./billing.server");
    await assertLeadWork(context.supabase, context.userId);
    return saveInvoice(context.supabase, data);
  });

export const setInvoiceStatusFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z.object({ id: z.string().uuid(), status: z.enum(PAYMENT_STATUSES) }).parse(data),
  )
  .handler(async ({ data, context }) => {
    const { assertLeadWork } = await import("./admin.server");
    const { setInvoiceStatus } = await import("./billing.server");
    await assertLeadWork(context.supabase, context.userId);
    return setInvoiceStatus(context.supabase, data.id, data.status);
  });

export const createPaymentLinkFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        provider: z.enum(PAYMENT_PROVIDER_IDS),
        returnUrl: z.string().max(500).nullable().optional(),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const { assertLeadWork } = await import("./admin.server");
    const { createInvoicePaymentLink } = await import("./billing.server");
    await assertLeadWork(context.supabase, context.userId);
    return createInvoicePaymentLink(context.supabase, data);
  });

export const getPaymentProviderStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { assertWorkspace } = await import("./admin.server");
    const { providerStatuses } = await import("./payments-providers.server");
    await assertWorkspace(context.supabase, context.userId);
    return providerStatuses();
  });

export const getBillingOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { assertWorkspace } = await import("./admin.server");
    const { buildBillingOverview } = await import("./billing.server");
    await assertWorkspace(context.supabase, context.userId);
    return buildBillingOverview(context.supabase);
  });

/* ---------------------------------- Clients ------------------------------- */

export const getClients = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { assertWorkspace } = await import("./admin.server");
    const { fetchClients } = await import("./billing.server");
    await assertWorkspace(context.supabase, context.userId);
    return fetchClients(context.supabase);
  });

export const getClientWorkspace = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const { assertWorkspace } = await import("./admin.server");
    const { fetchClientWorkspace } = await import("./billing.server");
    await assertWorkspace(context.supabase, context.userId);
    return fetchClientWorkspace(context.supabase, data.id);
  });

export const saveClientProject = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        name: z.string().min(1).max(200),
        status: z.enum(PROJECT_STATUSES),
        summary: z.string().max(4000).nullable(),
        target_date: z.string().max(20).nullable(),
        timeline: z
          .array(
            z.object({
              title: z.string().max(200),
              detail: z.string().max(600),
              done: z.boolean(),
              date: z.string().max(30).nullable().optional(),
            }),
          )
          .max(30),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const { assertLeadWork } = await import("./admin.server");
    const { updateClientProject } = await import("./billing.server");
    await assertLeadWork(context.supabase, context.userId);
    return updateClientProject(context.supabase, data);
  });

export const postClientMessage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({ clientId: z.string().uuid(), body: z.string().min(1).max(4000) })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const { assertLeadWork } = await import("./admin.server");
    const { addClientMessage } = await import("./billing.server");
    await assertLeadWork(context.supabase, context.userId);
    return addClientMessage(
      context.supabase,
      { clientId: data.clientId, body: data.body, authorName: "KERJAKU Team" },
      context.userId,
    );
  });

export const addClientDocumentFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        clientId: z.string().uuid(),
        title: z.string().min(1).max(200),
        url: z.string().max(600).nullable(),
        kind: z.string().max(40).default("document"),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const { assertLeadWork } = await import("./admin.server");
    const { addClientDocument } = await import("./billing.server");
    await assertLeadWork(context.supabase, context.userId);
    return addClientDocument(context.supabase, data);
  });
