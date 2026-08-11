import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { PIPELINE_STAGES } from "@/lib/admin/pipeline";
import { WORKSPACE_ROLES, canManageBusiness, canWorkLeads } from "@/lib/admin/roles";
import { PROPOSAL_STATUSES } from "@/lib/admin/sales-ai";

/** Role + capabilities of the signed-in user (used to gate the workspace UI). */
export const getAdminAccess = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { fetchUserRole } = await import("./admin.server");
    const role = await fetchUserRole(context.supabase, context.userId);
    return {
      role,
      hasAccess: role !== null,
      canManage: canManageBusiness(role),
      canWorkLeads: canWorkLeads(role),
      /** Back-compat flag for existing UI checks. */
      isAdmin: role !== null,
      userId: context.userId,
    };
  });

/**
 * Whitelist-based access provisioning. Runs after sign-in: if the signed-in
 * account has a verified email present on the approved team list, the matching
 * role is granted. No email on the list means no workspace access at all.
 */
export const provisionWorkspaceAccess = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: userResult } = await supabaseAdmin.auth.admin.getUserById(context.userId);
    const user = userResult?.user;
    const email = user?.email?.toLowerCase();
    if (!email || !user?.email_confirmed_at) return { granted: false as const, role: null };

    const { data: member } = await supabaseAdmin
      .from("workspace_members")
      .select("role")
      .eq("email", email)
      .maybeSingle();
    if (!member) return { granted: false as const, role: null };

    await supabaseAdmin
      .from("user_roles")
      .upsert(
        { user_id: context.userId, role: member.role },
        { onConflict: "user_id,role", ignoreDuplicates: true },
      );

    return { granted: true as const, role: member.role };
  });

/* ------------------------------ Team management --------------------------- */

export const getWorkspaceMembers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { assertManage, fetchWorkspaceMembers } = await import("./admin.server");
    await assertManage(context.supabase, context.userId);
    return fetchWorkspaceMembers(context.supabase);
  });

export const upsertWorkspaceMember = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({ email: z.string().email().max(200), role: z.enum(WORKSPACE_ROLES) })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const { assertManage, addWorkspaceMember } = await import("./admin.server");
    await assertManage(context.supabase, context.userId);
    return addWorkspaceMember(context.supabase, { ...data, invitedBy: context.userId });
  });

export const deleteWorkspaceMember = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const { assertManage, removeWorkspaceMember } = await import("./admin.server");
    await assertManage(context.supabase, context.userId);
    return removeWorkspaceMember(context.supabase, data.id);
  });

/* --------------------------------- Business -------------------------------- */

/** Business analytics overview built from the existing consultations table. */
export const getAdminOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { assertWorkspace, fetchLeads, buildOverview } = await import("./admin.server");
    await assertWorkspace(context.supabase, context.userId);
    return buildOverview(await fetchLeads(context.supabase));
  });

/** All leads for the CRM list and the pipeline board. */
export const getAdminLeads = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { assertWorkspace, fetchLeads } = await import("./admin.server");
    await assertWorkspace(context.supabase, context.userId);
    return fetchLeads(context.supabase);
  });

/** Full lead profile including AI analysis and conversation history. */
export const getAdminLead = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const { assertWorkspace, fetchLead } = await import("./admin.server");
    await assertWorkspace(context.supabase, context.userId);
    return fetchLead(context.supabase, data.id);
  });

export const updateLeadStage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z.object({ id: z.string().uuid(), stage: z.enum(PIPELINE_STAGES) }).parse(data),
  )
  .handler(async ({ data, context }) => {
    const { assertLeadWork, setLeadStage } = await import("./admin.server");
    await assertLeadWork(context.supabase, context.userId);
    return setLeadStage(context.supabase, data.id, data.stage);
  });

export const updateLeadNotes = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z.object({ id: z.string().uuid(), notes: z.string().max(4000) }).parse(data),
  )
  .handler(async ({ data, context }) => {
    const { assertLeadWork, setLeadNotes } = await import("./admin.server");
    await assertLeadWork(context.supabase, context.userId);
    return setLeadNotes(context.supabase, data.id, data.notes);
  });

/* --------------------------- Proposal generator --------------------------- */

export const getLeadProposals = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ leadId: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const { assertWorkspace, fetchProposals } = await import("./admin.server");
    await assertWorkspace(context.supabase, context.userId);
    return fetchProposals(context.supabase, data.leadId);
  });

export const getProposals = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { assertWorkspace, fetchProposals } = await import("./admin.server");
    await assertWorkspace(context.supabase, context.userId);
    return fetchProposals(context.supabase);
  });

export const getProposal = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const { assertWorkspace, fetchProposal } = await import("./admin.server");
    await assertWorkspace(context.supabase, context.userId);
    return fetchProposal(context.supabase, data.id);
  });

export const generateProposal = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ leadId: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const { assertLeadWork, createProposalForLead } = await import("./admin.server");
    await assertLeadWork(context.supabase, context.userId);
    return createProposalForLead(context.supabase, data.leadId, context.userId);
  });

export const duplicateProposalFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const { assertLeadWork, duplicateProposal } = await import("./admin.server");
    await assertLeadWork(context.supabase, context.userId);
    return duplicateProposal(context.supabase, data.id, context.userId);
  });

export const saveProposalFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        title: z.string().min(1).max(200),
        client_name: z.string().max(200).nullable().optional(),
        recommended_package: z.string().max(120).nullable(),
        content: z
          .array(z.object({ heading: z.string().max(200), body: z.string().max(8000) }))
          .max(30),
        pricing_items: z
          .array(
            z.object({
              item: z.string().max(200),
              detail: z.string().max(500),
              amount: z.number().min(0).max(1_000_000_000_000),
            }),
          )
          .max(30)
          .optional(),
        currency: z.string().max(8).nullable().optional(),
        valid_until: z.string().max(20).nullable().optional(),
        investment_note: z.string().max(4000).nullable().optional(),
        timeline_note: z.string().max(4000).nullable().optional(),
        version_note: z.string().max(300).nullable().optional(),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const { assertLeadWork, saveProposal } = await import("./admin.server");
    await assertLeadWork(context.supabase, context.userId);
    return saveProposal(context.supabase, data, context.userId);
  });

export const getProposalVersions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ proposalId: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const { assertWorkspace, fetchProposalVersions } = await import("./admin.server");
    await assertWorkspace(context.supabase, context.userId);
    return fetchProposalVersions(context.supabase, data.proposalId);
  });

export const restoreProposalVersionFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z.object({ proposalId: z.string().uuid(), versionId: z.string().uuid() }).parse(data),
  )
  .handler(async ({ data, context }) => {
    const { assertLeadWork, restoreProposalVersion } = await import("./admin.server");
    await assertLeadWork(context.supabase, context.userId);
    return restoreProposalVersion(context.supabase, data, context.userId);
  });


export const setProposalStatusFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z.object({ id: z.string().uuid(), status: z.enum(PROPOSAL_STATUSES) }).parse(data),
  )
  .handler(async ({ data, context }) => {
    const { assertLeadWork, setProposalStatus } = await import("./admin.server");
    await assertLeadWork(context.supabase, context.userId);
    return setProposalStatus(context.supabase, data.id, data.status);
  });

export const deleteProposalFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const { assertManage, deleteProposal } = await import("./admin.server");
    await assertManage(context.supabase, context.userId);
    return deleteProposal(context.supabase, data.id);
  });

export const getProposalAnalytics = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { assertWorkspace, buildProposalAnalytics } = await import("./admin.server");
    await assertWorkspace(context.supabase, context.userId);
    return buildProposalAnalytics(context.supabase);
  });

/* ------------------------------ AI sales memory --------------------------- */

export const getLeadAiActivity = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ leadId: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const { assertWorkspace, fetchLeadAiActivities } = await import("./admin.server");
    await assertWorkspace(context.supabase, context.userId);
    return fetchLeadAiActivities(context.supabase, data.leadId);
  });

export const logLeadAiActivity = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        leadId: z.string().uuid(),
        action: z.string().min(1).max(80),
        label: z.string().max(160).nullable().default(null),
        content: z.string().min(1).max(12000),
        meta: z.record(z.string(), z.unknown()).default({}),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const { assertLeadWork, createLeadAiActivity } = await import("./admin.server");
    await assertLeadWork(context.supabase, context.userId);
    const email =
      (context.claims as { email?: unknown } | undefined)?.email;
    return createLeadAiActivity(
      context.supabase,
      {
        leadId: data.leadId,
        action: data.action,
        label: data.label,
        content: data.content,
        meta: data.meta,
      },
      { id: context.userId, email: typeof email === "string" ? email : null },
    );
  });

export const deleteLeadAiActivityFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const { assertManage, deleteLeadAiActivity } = await import("./admin.server");
    await assertManage(context.supabase, context.userId);
    return deleteLeadAiActivity(context.supabase, data.id);
  });
