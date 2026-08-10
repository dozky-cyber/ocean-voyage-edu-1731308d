import { createServerFn } from "@tanstack/react-start";
import { consultationFormSchema } from "./consultation-schema";

/**
 * Accepts a consultation lead: validates server-side, stores it, then notifies
 * via Telegram and email. Notifications are best-effort — a stored submission
 * still succeeds if a notification channel fails.
 */
export const submitConsultationLead = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => consultationFormSchema.parse(data))
  .handler(async ({ data }) => {
    const { storeConsultation, sendLeadEmail, formatLeadTelegram } = await import(
      "./consultation.server"
    );
    const { sendTelegramMessage } = await import("./telegram.server");

    const row = await storeConsultation(data);
    const createdAt = new Date(row?.created_at ?? Date.now()).toISOString();

    const telegram = await sendTelegramMessage(formatLeadTelegram(data, createdAt));
    const email = await sendLeadEmail(data, createdAt);

    return {
      success: true as const,
      stored: Boolean(row),
      notifiedTelegram: telegram.ok,
      notifiedEmail: email.sent,
    };
  });
