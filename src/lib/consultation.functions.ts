import { createServerFn } from "@tanstack/react-start";
import { getRequestIP } from "@tanstack/react-start/server";
import { consultationSubmissionSchema } from "./consultation-schema";

/**
 * Accepts a consultation lead: validates server-side, screens for spam
 * (honeypot + per-IP rate limit), stores it, then notifies via Telegram and
 * email. Notifications are best-effort — a stored submission still succeeds
 * if a notification channel fails.
 */
export const submitConsultationLead = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => consultationSubmissionSchema.parse(data))
  .handler(async ({ data }) => {
    const { checkSpam } = await import("./spam-guard.server");

    const ip = getRequestIP({ xForwardedFor: true }) ?? "unknown";
    const verdict = checkSpam({ ip, honeypot: data.honeypot, elapsedMs: data.elapsedMs });
    if (!verdict.ok) {
      if (verdict.reason === "rate_limited") {
        throw new Error("Terlalu banyak pengiriman. Coba lagi beberapa menit lagi.");
      }
      // Silently accept bot traffic without storing or notifying.
      return {
        success: true as const,
        stored: false,
        notifiedTelegram: false,
        notifiedEmail: false,
        leadScore: 0,
        leadTemperature: "Cold Lead" as const,
      };
    }

    const { storeConsultation, sendLeadEmail, formatLeadTelegram } =
      await import("./consultation.server");
    const { sendTelegramMessage } = await import("./telegram.server");

    const { form, tracking, ai, leadSource } = data;
    const row = await storeConsultation(form, tracking, ai, leadSource);
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
