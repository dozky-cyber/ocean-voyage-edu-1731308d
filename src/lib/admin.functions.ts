import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { PIPELINE_STAGES } from "@/lib/admin/pipeline";

/** Whether the signed-in user is an admin (used to gate the workspace UI). */
export const getAdminAccess = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    return { isAdmin: Boolean(data), userId: context.userId };
  });

/** Business analytics overview built from the existing consultations table. */
export const getAdminOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { assertAdmin, fetchLeads, buildOverview } = await import("./admin.server");
    await assertAdmin(context.supabase, context.userId);
    return buildOverview(await fetchLeads(context.supabase));
  });

/** All leads for the CRM list and the pipeline board. */
export const getAdminLeads = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { assertAdmin, fetchLeads } = await import("./admin.server");
    await assertAdmin(context.supabase, context.userId);
    return fetchLeads(context.supabase);
  });

/** Full lead profile including AI analysis and conversation history. */
export const getAdminLead = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const { assertAdmin, fetchLead } = await import("./admin.server");
    await assertAdmin(context.supabase, context.userId);
    return fetchLead(context.supabase, data.id);
  });

export const updateLeadStage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z.object({ id: z.string().uuid(), stage: z.enum(PIPELINE_STAGES) }).parse(data),
  )
  .handler(async ({ data, context }) => {
    const { assertAdmin, setLeadStage } = await import("./admin.server");
    await assertAdmin(context.supabase, context.userId);
    return setLeadStage(context.supabase, data.id, data.stage);
  });

export const updateLeadNotes = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z.object({ id: z.string().uuid(), notes: z.string().max(4000) }).parse(data),
  )
  .handler(async ({ data, context }) => {
    const { assertAdmin, setLeadNotes } = await import("./admin.server");
    await assertAdmin(context.supabase, context.userId);
    return setLeadNotes(context.supabase, data.id, data.notes);
  });

/** One-time owner bootstrap: first signed-in account claims the admin role. */
export const claimFirstAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase.rpc("claim_first_admin");
    if (error) return { claimed: false as const };
    return { claimed: Boolean(data) };
  });
