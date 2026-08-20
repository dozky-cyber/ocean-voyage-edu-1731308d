import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const listSchema = z.object({
  status: z.enum(["all", "draft", "qualified_lead", "closed"]).default("all"),
});

export type AiConversationRow = {
  id: string;
  session_id: string;
  status: string;
  message_count: number;
  intent: string;
  business_category: string | null;
  summary: string | null;
  package_name: string | null;
  score: number;
  lead_id: string | null;
  messages: { role: string; text: string }[];
  created_at: string;
  updated_at: string;
};

/** AI Consultant conversations (drafts + qualified) for the workspace. */
export const listAiConversations = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => listSchema.parse(input ?? {}))
  .handler(async ({ data, context }) => {
    let query = context.supabase
      .from("ai_conversations")
      .select(
        "id, session_id, status, message_count, intent, business_category, summary, package_name, score, lead_id, messages, created_at, updated_at",
      )
      .order("updated_at", { ascending: false })
      .limit(100);
    if (data.status !== "all") query = query.eq("status", data.status);

    const { data: rows, error } = await query;
    if (error) throw new Error(error.message);
    return { conversations: (rows ?? []) as unknown as AiConversationRow[] };
  });

/** Mark a conversation as closed/abandoned. */
export const setAiConversationStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ 
      id: z.string().uuid(), 
      sessionId: z.string().min(1, "Session ID is required"),
      status: z.enum(["draft", "qualified_lead", "closed"]) 
    }).parse(input),
  )
  .handler(async ({ data, context }) => {
    // ✅ FIX: Verify conversation exists with this session_id before updating
    const { data: conversation, error: readError } = await context.supabase
      .from("ai_conversations")
      .select("id")
      .eq("id", data.id)
      .eq("session_id", data.sessionId)
      .maybeSingle();
    
    if (readError) {
      throw new Error("Failed to verify conversation ownership");
    }
    
    if (!conversation) {
      // ✅ FIX: Return error instead of silently failing (security + debugging)
      throw new Error("Conversation not found or access denied");
    }

    // ✅ FIX: Enforce session_id filter in update to prevent cross-session writes
    const { error } = await context.supabase
      .from("ai_conversations")
      .update({ status: data.status })
      .eq("id", data.id)
      .eq("session_id", data.sessionId);
    
    if (error) throw new Error(error.message);
    return { ok: true };
  });
