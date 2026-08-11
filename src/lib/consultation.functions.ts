import { createServerFn } from "@tanstack/react-start";
import { consultationSubmissionSchema } from "./consultation-schema";

/**
 * Accepts a consultation lead: validates server-side, stores it, then notifies
 * via Telegram and email. Notifications are best-effort — a stored submission
 * still succeeds if a notification channel fails.
 */
export const submitConsultationLead = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => consultationSubmissionSchema.parse(data))
  .handler(async ({ data }) => {
    const { storeConsultation, sendLeadEmail, formatLeadTelegram } =
      await import("./consultation.server");
    const { sendTelegramMessage } = await import("./telegram.server");

    const { form, tracking, ai } = data;
    const row = await storeConsultation(form, tracking, ai);
    const createdAt = new Date(row?.created_at ?? Date.now()).toISOString();

    const telegram = await sendTelegramMessage(formatLeadTelegram(form, createdAt, tracking, ai));
    const email = await sendLeadEmail(form, createdAt, tracking, ai);

    return {
      success: true as const,
      stored: Boolean(row),
      notifiedTelegram: telegram.ok,
      notifiedEmail: email.sent,
      leadScore: tracking?.leadScore ?? 0,
      leadTemperature: tracking?.leadTemperature ?? "Cold Lead",
    };
  });
