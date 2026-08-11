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

export async function assertAdmin(supabase: Client, userId: string): Promise<void> {
  const { data, error } = await supabase.rpc("has_role", {
    _user_id: userId,
    _role: "admin",
  });
  if (error) throw new Error("Tidak dapat memverifikasi akses admin.");
  if (!data) throw new Error("Forbidden: akses admin diperlukan.");
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
