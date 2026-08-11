import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type RequirementVersionRow = {
  id: string;
  conversation_id: string;
  lead_id: string | null;
  version: number;
  business: string;
  project: string;
  features: string[];
  problems: string[];
  package_name: string | null;
  timeline: string | null;
  budget: string | null;
  users_scale: string | null;
  intent: string;
  score: number;
  contact_name: string | null;
  contact_email: string | null;
  contact_whatsapp: string | null;
  summary: string | null;
  change_note: string | null;
  final_prompt: string | null;
  source: string;
  created_at: string;
};

const listSchema = z.object({ conversationId: z.string().uuid() });

/** All requirement versions for a conversation, newest first. */
export const listRequirementVersions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => listSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await context.supabase
      .from("conversation_requirements")
      .select("*")
      .eq("conversation_id", data.conversationId)
      .order("version", { ascending: false });
    if (error) throw new Error(error.message);
    return { versions: (rows ?? []) as unknown as RequirementVersionRow[] };
  });

const updateSchema = z.object({
  conversationId: z.string().uuid(),
  business: z.string().default(""),
  project: z.string().default(""),
  features: z.array(z.string()).default([]),
  problems: z.array(z.string()).default([]),
  packageName: z.string().nullable().default(null),
  timeline: z.string().nullable().default(null),
  budget: z.string().nullable().default(null),
  usersScale: z.string().nullable().default(null),
  intent: z.string().default("medium"),
  score: z.number().int().min(0).max(100).default(0),
  contactName: z.string().nullable().default(null),
  contactEmail: z.string().nullable().default(null),
  contactWhatsapp: z.string().nullable().default(null),
  summary: z.string().nullable().default(null),
  changeNote: z.string().nullable().default(null),
  notifyTelegram: z.boolean().default(false),
});

/** Create a NEW requirement version after follow-up (original stays intact). */
export const addRequirementVersion = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => updateSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { data: conversation, error } = await context.supabase
      .from("ai_conversations")
      .select("id, lead_id")
      .eq("id", data.conversationId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!conversation) throw new Error("Conversation tidak ditemukan.");

    const { saveRequirementVersion, formatRequirementTelegram } = await import(
      "@/lib/requirements.server"
    );
    const payload = {
      business: data.business,
      project: data.project,
      features: data.features,
      problems: data.problems,
      packageName: data.packageName,
      timeline: data.timeline,
      budget: data.budget,
      usersScale: data.usersScale,
      intent: data.intent,
      score: data.score,
      contactName: data.contactName,
      contactEmail: data.contactEmail,
      contactWhatsapp: data.contactWhatsapp,
      summary: data.summary,
      changeNote: data.changeNote,
      source: "manual" as const,
    };
    const saved = await saveRequirementVersion(
      conversation.id,
      conversation.lead_id,
      payload,
      context.userId,
    );
    if (!saved) throw new Error("Gagal menyimpan versi requirement.");

    if (data.notifyTelegram) {
      const { sendTelegramMessage } = await import("@/lib/telegram.server");
      await sendTelegramMessage(formatRequirementTelegram(payload, saved.version));
    }

    return { version: saved.version, finalPrompt: saved.finalPrompt };
  });
