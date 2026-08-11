import { createFileRoute } from "@tanstack/react-router";

/**
 * Telegram webhook — routes incoming messages into the AI Business Assistant core.
 * Security: shared secret header derived from the bot token + chat allowlist.
 */
export const Route = createFileRoute("/api/public/telegram/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { verifyWebhookSecret, handleTelegramUpdate } = await import(
          "@/lib/assistant-telegram.server"
        );

        const secret = request.headers.get("x-telegram-bot-api-secret-token") ?? "";
        if (!verifyWebhookSecret(secret)) {
          return new Response("Unauthorized", { status: 401 });
        }

        const update = await request.json().catch(() => null);
        if (!update) return Response.json({ ok: true, ignored: true });

        await handleTelegramUpdate(update);
        return Response.json({ ok: true });
      },
    },
  },
});
