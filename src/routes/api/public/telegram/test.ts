import { createFileRoute } from "@tanstack/react-router";

// Simple cooldown so this public test endpoint cannot be used to spam the chat.
let lastCall = 0;
const COOLDOWN_MS = 30_000;

export const Route = createFileRoute("/api/public/telegram/test")({
  server: {
    handlers: {
      GET: async () => {
        const now = Date.now();
        if (now - lastCall < COOLDOWN_MS) {
          return Response.json({ ok: false, error: "cooldown" }, { status: 429 });
        }
        lastCall = now;

        const { sendTelegramMessage, TEST_MESSAGE } = await import("@/lib/telegram.server");
        const result = await sendTelegramMessage(TEST_MESSAGE);
        return Response.json(result, { status: result.ok ? 200 : 502 });
      },
    },
  },
});
