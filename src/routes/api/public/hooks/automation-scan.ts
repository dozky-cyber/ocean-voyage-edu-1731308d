import { createFileRoute } from "@tanstack/react-router";

/**
 * Automation scan endpoint for scheduled callers (pg_cron / external scheduler).
 * Public prefix, so the caller must present the project's publishable key.
 */
export const Route = createFileRoute("/api/public/hooks/automation-scan")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const expected = process.env["SUPABASE_PUBLISHABLE_KEY"] ?? process.env["SUPABASE_ANON_KEY"];
        const provided =
          request.headers.get("apikey") ??
          request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ??
          "";

        if (!expected || provided !== expected) {
          return new Response(JSON.stringify({ error: "unauthorized" }), {
            status: 401,
            headers: { "Content-Type": "application/json" },
          });
        }

        const { scanAutomationDue } = await import("@/lib/automation.server");
        const result = await scanAutomationDue();
        return Response.json({ ok: true, ...result });
      },
    },
  },
});
