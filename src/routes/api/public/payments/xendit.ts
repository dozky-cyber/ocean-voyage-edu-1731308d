/**
 * Xendit invoice callback — external caller, no session.
 *
 * Xendit POSTs here whenever an invoice changes state. The request is
 * authenticated with the callback verification token from the Xendit
 * dashboard (header `x-callback-token`), compared in constant time.
 */
import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const payloadSchema = z.object({
  id: z.string().min(1).optional(),
  external_id: z.string().min(1).max(200),
  status: z.string().min(1).max(50),
});

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export const Route = createFileRoute("/api/public/payments/xendit")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const expected = process.env["XENDIT_CALLBACK_TOKEN"];
        if (!expected) {
          return new Response("Callback token not configured", { status: 503 });
        }
        const token = request.headers.get("x-callback-token") ?? "";
        if (!safeEqual(token, expected)) {
          return new Response("Invalid callback token", { status: 401 });
        }

        const parsed = payloadSchema.safeParse(await request.json().catch(() => null));
        if (!parsed.success) return new Response("Invalid payload", { status: 400 });

        const { external_id: number, status } = parsed.data;
        const normalized = status.toUpperCase();
        const mapped =
          normalized === "PAID" || normalized === "SETTLED"
            ? "Paid"
            : normalized === "EXPIRED" || normalized === "FAILED"
              ? "Failed"
              : null;
        if (!mapped) return new Response("ignored", { status: 200 });

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data: invoice } = await supabaseAdmin
          .from("invoices")
          .select("id, status")
          .eq("number", number)
          .maybeSingle();
        if (!invoice) return new Response("Invoice not found", { status: 404 });
        if (invoice.status === mapped) return new Response("ok", { status: 200 });

        const { setInvoiceStatus } = await import("@/lib/billing.server");
        await setInvoiceStatus(supabaseAdmin, invoice.id, mapped);

        return new Response("ok", { status: 200 });
      },
    },
  },
});
