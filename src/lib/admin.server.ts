/**
 * Admin (Business OS) data access — server-only.
 *
 * Every function receives an authenticated Supabase client (RLS as the signed-in
 * user). Admin-only rows are additionally protected by RLS policies that call
 * public.has_role(auth.uid(), 'admin').
 */
import type { SupabaseClient } from "@supabase/supabase-js";

import { normalizeStage, type PipelineStage } from "@/lib/admin/pipeline";
import type { Database } from "@/integrations/supabase/types";

type Client = SupabaseClient<Database>;

export const LEAD_LIST_COLUMNS =
  "id, created_at, name, email, whatsapp, company, business_name, project_type, budget, timeline, status, status_updated_at, lead_score, lead_temperature, lead_source, visitor_source, utm_source, utm_campaign, ai_recommended_package, ai_business_category, ai_lead_score, ai_qualification_status, ai_complexity";

export type LeadListRow = {
  id: string;
  created_at: string;
  name: string;
  email: string;
  whatsapp: string;
  company: string | null;
  business_name: string | null;
  project_type: string;
  budget: string;
  timeline: string;
  status: string;
  status_updated_at: string | null;
  lead_score: number;
  lead_temperature: string;
  lead_source: string;
  visitor_source: string | null;
  utm_source: string | null;
  utm_campaign: string | null;
  ai_recommended_package: string | null;
  ai_business_category: string | null;
  ai_lead_score: number;
  ai_qualification_status: string | null;
  ai_complexity: string | null;
};

/** Roles held by the signed-in user (RLS lets users read their own rows). */
export async function fetchUserRole(supabase: Client, userId: string): Promise<WorkspaceRole | null> {
  const { data, error } = await supabase.from("user_roles").select("role").eq("user_id", userId);
  if (error) throw new Error("Tidak dapat memverifikasi akses workspace.");
  return highestRole((data ?? []).map((row) => String(row.role)));
}

/** Any workspace role (owner/admin/sales/viewer) — read access. */
export async function assertWorkspace(supabase: Client, userId: string): Promise<WorkspaceRole> {
  const role = await fetchUserRole(supabase, userId);
  if (!role) throw new Error("Forbidden: akses workspace diperlukan.");
  return role;
}

/** Owner/Admin/Sales — may edit leads and sales artefacts. */
export async function assertLeadWork(supabase: Client, userId: string): Promise<WorkspaceRole> {
  const role = await assertWorkspace(supabase, userId);
  if (!canWorkLeads(role)) throw new Error("Forbidden: akses sales diperlukan.");
  return role;
}

/** Owner/Admin — may manage business data and the team. */
export async function assertManage(supabase: Client, userId: string): Promise<WorkspaceRole> {
  const role = await assertWorkspace(supabase, userId);
  if (!canManageBusiness(role)) throw new Error("Forbidden: akses admin diperlukan.");
  return role;
}

/* ------------------------------- Team members ----------------------------- */

export async function fetchWorkspaceMembers(supabase: Client) {
  const { data, error } = await supabase
    .from("workspace_members")
    .select("id, email, role, created_at")
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function addWorkspaceMember(
  supabase: Client,
  input: { email: string; role: WorkspaceRole; invitedBy: string },
) {
  const { error } = await supabase.from("workspace_members").upsert(
    { email: input.email.trim().toLowerCase(), role: input.role, invited_by: input.invitedBy },
    { onConflict: "email" },
  );
  if (error) throw new Error(error.message);
  return { ok: true as const };
}

export async function removeWorkspaceMember(supabase: Client, id: string) {
  const { error } = await supabase.from("workspace_members").delete().eq("id", id);
  if (error) throw new Error(error.message);
  return { ok: true as const };
}


export async function fetchLeads(supabase: Client): Promise<LeadListRow[]> {
  const { data, error } = await supabase
    .from("consultations")
    .select(LEAD_LIST_COLUMNS)
    .order("created_at", { ascending: false })
    .limit(500);
  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as LeadListRow[];
}

export async function fetchLead(supabase: Client, id: string) {
  const { data, error } = await supabase
    .from("consultations")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

export async function setLeadStage(supabase: Client, id: string, stage: PipelineStage) {
  const { error } = await supabase
    .from("consultations")
    .update({ status: normalizeStage(stage), status_updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw new Error(error.message);
  return { ok: true as const };
}

export async function setLeadNotes(supabase: Client, id: string, notes: string) {
  const { error } = await supabase
    .from("consultations")
    .update({ admin_notes: notes })
    .eq("id", id);
  if (error) throw new Error(error.message);
  return { ok: true as const };
}

export type AdminOverview = {
  totalLeads: number;
  hot: number;
  warm: number;
  cold: number;
  aiLeads: number;
  aiConversionRate: number;
  averageScore: number;
  stageCounts: { stage: string; count: number }[];
  sources: { source: string; count: number }[];
  packages: { name: string; count: number }[];
  categories: { name: string; count: number }[];
  monthly: { month: string; leads: number; hot: number }[];
  recent: LeadListRow[];
};

export function buildOverview(rows: LeadListRow[]): AdminOverview {
  const counts = new Map<string, number>();
  const sources = new Map<string, number>();
  const packages = new Map<string, number>();
  const categories = new Map<string, number>();
  const monthly = new Map<string, { leads: number; hot: number }>();
  let hot = 0;
  let warm = 0;
  let cold = 0;
  let aiLeads = 0;
  let scoreTotal = 0;

  for (const row of rows) {
    const stage = normalizeStage(row.status);
    counts.set(stage, (counts.get(stage) ?? 0) + 1);

    if (row.lead_temperature === "Hot Lead") hot += 1;
    else if (row.lead_temperature === "Warm Lead") warm += 1;
    else cold += 1;

    const source = row.lead_source === "ai_consultant" ? "AI Consultant" : "Manual Form";
    sources.set(source, (sources.get(source) ?? 0) + 1);
    if (row.lead_source === "ai_consultant") aiLeads += 1;

    if (row.ai_recommended_package) {
      packages.set(row.ai_recommended_package, (packages.get(row.ai_recommended_package) ?? 0) + 1);
    }
    if (row.ai_business_category) {
      categories.set(row.ai_business_category, (categories.get(row.ai_business_category) ?? 0) + 1);
    }

    scoreTotal += row.lead_score ?? 0;

    const month = row.created_at.slice(0, 7);
    const bucket = monthly.get(month) ?? { leads: 0, hot: 0 };
    bucket.leads += 1;
    if (row.lead_temperature === "Hot Lead") bucket.hot += 1;
    monthly.set(month, bucket);
  }

  const sortDesc = (map: Map<string, number>) =>
    [...map.entries()].map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);

  return {
    totalLeads: rows.length,
    hot,
    warm,
    cold,
    aiLeads,
    aiConversionRate: rows.length ? Number(((aiLeads / rows.length) * 100).toFixed(1)) : 0,
    averageScore: rows.length ? Number((scoreTotal / rows.length).toFixed(1)) : 0,
    stageCounts: [...counts.entries()].map(([stage, count]) => ({ stage, count })),
    sources: sortDesc(sources).map((s) => ({ source: s.name, count: s.count })),
    packages: sortDesc(packages),
    categories: sortDesc(categories),
    monthly: [...monthly.entries()]
      .map(([month, value]) => ({ month, leads: value.leads, hot: value.hot }))
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-12),
    recent: rows.slice(0, 8),
  };
}

/* ---------------------------------------------------------------------------
 * Proposals (AI Proposal Generator + management)
 * ------------------------------------------------------------------------ */

import {
  buildProposalSections,
  recommendPackage,
  buildSalesBrief,
  type ProposalStatus,
} from "@/lib/admin/sales-ai";

export const PROPOSAL_COLUMNS =
  "id, lead_id, title, status, recommended_package, content, investment_note, timeline_note, sent_at, approved_at, created_at, updated_at";

export async function fetchProposals(supabase: Client, leadId?: string) {
  let query = supabase
    .from("proposals")
    .select(PROPOSAL_COLUMNS)
    .order("created_at", { ascending: false })
    .limit(300);
  if (leadId) query = query.eq("lead_id", leadId);
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function fetchProposal(supabase: Client, id: string) {
  const { data, error } = await supabase
    .from("proposals")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

export async function createProposalForLead(supabase: Client, leadId: string, userId: string) {
  const lead = await fetchLead(supabase, leadId);
  if (!lead) throw new Error("Lead tidak ditemukan.");
  const brief = buildSalesBrief(lead);
  const { data, error } = await supabase
    .from("proposals")
    .insert({
      lead_id: leadId,
      title: `KERJAKU Digital Solution Proposal — ${lead.business_name || lead.company || lead.name}`,
      status: "Draft",
      recommended_package: recommendPackage(lead),
      content: buildProposalSections(lead),
      investment_note: brief.investment,
      timeline_note: brief.timeline,
      created_by: userId,
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  return { id: data.id as string };
}

export async function duplicateProposal(supabase: Client, id: string, userId: string) {
  const source = await fetchProposal(supabase, id);
  if (!source) throw new Error("Proposal tidak ditemukan.");
  const { data, error } = await supabase
    .from("proposals")
    .insert({
      lead_id: source.lead_id,
      title: `${source.title} (copy)`,
      status: "Draft",
      recommended_package: source.recommended_package,
      content: source.content,
      investment_note: source.investment_note,
      timeline_note: source.timeline_note,
      created_by: userId,
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  return { id: data.id as string };
}

export async function saveProposal(
  supabase: Client,
  input: {
    id: string;
    title: string;
    recommended_package: string | null;
    content: { heading: string; body: string }[];
  },
) {
  const { error } = await supabase
    .from("proposals")
    .update({
      title: input.title,
      recommended_package: input.recommended_package,
      content: input.content,
    })
    .eq("id", input.id);
  if (error) throw new Error(error.message);
  return { ok: true as const };
}

export async function setProposalStatus(supabase: Client, id: string, status: ProposalStatus) {
  const now = new Date().toISOString();
  const patch: { status: string; sent_at?: string; approved_at?: string } = { status };
  if (status === "Sent") patch.sent_at = now;
  if (status === "Approved") patch.approved_at = now;
  const { error } = await supabase.from("proposals").update(patch).eq("id", id);
  if (error) throw new Error(error.message);
  return { ok: true as const };
}

export async function deleteProposal(supabase: Client, id: string) {
  const { error } = await supabase.from("proposals").delete().eq("id", id);
  if (error) throw new Error(error.message);
  return { ok: true as const };
}

export type ProposalAnalytics = {
  total: number;
  byStatus: { status: string; count: number }[];
  approved: number;
  conversionRate: number;
  topPackage: string | null;
  packages: { name: string; count: number }[];
  avgLeadToProposalHours: number;
};

export async function buildProposalAnalytics(supabase: Client): Promise<ProposalAnalytics> {
  const [{ data: proposals, error }, leads] = await Promise.all([
    supabase.from("proposals").select("id, lead_id, status, recommended_package, created_at"),
    fetchLeads(supabase),
  ]);
  if (error) throw new Error(error.message);
  const rows = proposals ?? [];
  const leadCreated = new Map(leads.map((l) => [l.id, l.created_at]));

  const byStatus = new Map<string, number>();
  const packages = new Map<string, number>();
  const approvedPackages = new Map<string, number>();
  let hoursTotal = 0;
  let hoursCount = 0;

  for (const row of rows) {
    byStatus.set(row.status, (byStatus.get(row.status) ?? 0) + 1);
    if (row.recommended_package) {
      packages.set(row.recommended_package, (packages.get(row.recommended_package) ?? 0) + 1);
      if (row.status === "Approved") {
        approvedPackages.set(
          row.recommended_package,
          (approvedPackages.get(row.recommended_package) ?? 0) + 1,
        );
      }
    }
    const created = leadCreated.get(row.lead_id);
    if (created) {
      const diff = (new Date(row.created_at).getTime() - new Date(created).getTime()) / 3_600_000;
      if (diff >= 0) {
        hoursTotal += diff;
        hoursCount += 1;
      }
    }
  }

  const approved = byStatus.get("Approved") ?? 0;
  const rank = (map: Map<string, number>) =>
    [...map.entries()].map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);
  const bestApproved = rank(approvedPackages)[0]?.name ?? rank(packages)[0]?.name ?? null;

  return {
    total: rows.length,
    byStatus: [...byStatus.entries()].map(([status, count]) => ({ status, count })),
    approved,
    conversionRate: rows.length ? Number(((approved / rows.length) * 100).toFixed(1)) : 0,
    topPackage: bestApproved,
    packages: rank(packages),
    avgLeadToProposalHours: hoursCount ? Number((hoursTotal / hoursCount).toFixed(1)) : 0,
  };
}
