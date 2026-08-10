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
        if (result.ok) {
          return Response.json({ ok: true, status: "Connected Successfully" }, { status: 200 });
        }
        return Response.json(
          {
            ok: false,
            error: result.error,
            instructions: "Please confirm you have started @cs_kerjaku_bot in Telegram and that TELEGRAM_CHAT_ID is correct. The bot cannot send messages to a chat until the conversation has been initiated.",
          },
          { status: 502 }
        );
      },
    },
  },
});
