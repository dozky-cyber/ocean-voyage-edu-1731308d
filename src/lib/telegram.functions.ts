import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const consultationSchema = z.object({
  name: z.string().trim().min(2).max(80),
  contact: z.string().trim().min(3).max(120),
  projectType: z.string().trim().max(80).optional(),
  budget: z.string().trim().max(80).optional(),
  message: z.string().trim().min(5).max(2000),
});

export type ConsultationInput = z.infer<typeof consultationSchema>;

/**
 * Accepts a consultation/order submission and notifies Telegram.
 * Telegram delivery is best-effort: the submission still succeeds if it fails.
 */
export const submitConsultation = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => consultationSchema.parse(data))
  .handler(async ({ data }) => {
    const { sendTelegramMessage, formatConsultation } = await import("./telegram.server");
    const result = await sendTelegramMessage(formatConsultation(data));
    return { success: true, notified: result.ok };
  });

/** Sends the fixed connection-test message to the configured Telegram chat. */
export const testTelegramConnection = createServerFn({ method: "POST" }).handler(async () => {
  const { sendTelegramMessage, TEST_MESSAGE } = await import("./telegram.server");
  const result = await sendTelegramMessage(TEST_MESSAGE);
  return result.ok ? { ok: true as const } : { ok: false as const, error: result.error };
});
