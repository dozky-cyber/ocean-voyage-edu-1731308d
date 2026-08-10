// Server-only Telegram notification service.
// Credentials are read from the server environment at call time and are never
// returned to the client or included in error messages.

const TELEGRAM_API = "https://api.telegram.org";

export type TelegramResult = { ok: true } | { ok: false; error: string };

function readConfig(): { token: string; chatId: string } | null {
  const token = process.env["TELEGRAM_BOT_TOKEN"];
  const chatId = process.env["TELEGRAM_CHAT_ID"];
  if (!token || !chatId) return null;
  return { token, chatId };
}

/** Strip anything that looks like a bot token out of log/error output. */
function redact(message: string, token?: string): string {
  let safe = message;
  if (token) safe = safe.split(token).join("[REDACTED]");
  return safe.replace(/\d{6,}:[A-Za-z0-9_-]{20,}/g, "[REDACTED]");
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export async function sendTelegramMessage(text: string): Promise<TelegramResult> {
  const config = readConfig();
  if (!config) {
    console.error("[telegram] missing TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID");
    return { ok: false, error: "telegram_not_configured" };
  }

  try {
    const response = await fetch(`${TELEGRAM_API}/bot${config.token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: config.chatId,
        text,
        parse_mode: "HTML",
        disable_web_page_preview: true,
      }),
    });

    const body = (await response.json().catch(() => null)) as
      | { ok?: boolean; description?: string }
      | null;

    if (!response.ok || !body?.ok) {
      const detail = redact(body?.description ?? `HTTP ${response.status}`, config.token);
      console.error(`[telegram] sendMessage failed: ${detail}`);
      return { ok: false, error: detail };
    }

    return { ok: true };
  } catch (error) {
    const detail = redact(error instanceof Error ? error.message : String(error), config.token);
    console.error(`[telegram] sendMessage threw: ${detail}`);
    return { ok: false, error: detail };
  }
}

export const TEST_MESSAGE = [
  "🟢 <b>KERJAKU BOT CONNECTED</b>",
  "",
  "System:",
  "Consultation Notification",
  "",
  "Status:",
  "Connected Successfully",
].join("\n");

export type ConsultationSubmission = {
  name: string;
  contact: string;
  projectType?: string;
  budget?: string;
  message: string;
};

export function formatConsultation(data: ConsultationSubmission): string {
  const lines = [
    "📩 <b>KERJAKU — Konsultasi / Order Baru</b>",
    "",
    `<b>Nama:</b> ${escapeHtml(data.name)}`,
    `<b>Kontak:</b> ${escapeHtml(data.contact)}`,
  ];
  if (data.projectType) lines.push(`<b>Jenis Project:</b> ${escapeHtml(data.projectType)}`);
  if (data.budget) lines.push(`<b>Estimasi Budget:</b> ${escapeHtml(data.budget)}`);
  lines.push("", "<b>Pesan:</b>", escapeHtml(data.message));
  lines.push("", `<i>${new Date().toISOString()}</i>`);
  return lines.join("\n");
}
