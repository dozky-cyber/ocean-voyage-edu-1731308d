import { createFileRoute } from "@tanstack/react-router";

/**
 * Telegram daily brief endpoint for scheduled callers (pg_cron at 01:30 UTC = 08:30 WIB)
 * and for manual testing. Public prefix, so the caller must present the project's
 * publishable key. Delivery only ever goes to authorized Telegram chat IDs.
 */
async function run(request: Request, triggerSource: "cron" | "manual") {
  const expected = process.env["SUPABASE_PUBLISHABLE_KEY"] ?? process.env["SUPABASE_ANON_KEY"];
  const provided =
    request.headers.get("apikey") ??
    request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ??
    "";

  if (!expected || provided !== expected) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  const { sendDailyBrief } = await import("@/lib/assistant-daily.server");
  const result = await sendDailyBrief(triggerSource);
  return Response.json({ ...result, trigger: triggerSource }, { status: result.ok ? 200 : 502 });
}

export const Route = createFileRoute("/api/public/hooks/telegram-daily-brief")({
  server: {
    handlers: {
      POST: async ({ request }) => run(request, "cron"),
      // GET is the manual test trigger (sends today's brief immediately).
      GET: async ({ request }) => run(request, "manual"),
    },
  },
});
