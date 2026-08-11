/**
 * KERJAKU Executive Business Intelligence — server-only aggregation.
 *
 * Read-only: it composes numbers from the existing CRM, proposal, invoice,
 * client and project tables. Nothing here writes or changes other modules.
 */
import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/integrations/supabase/types";
import { normalizeStage as normalizeDeliveryStage, projectHealth } from "@/lib/admin/ops";
import { parseTimeline, timelineProgress } from "@/lib/admin/payments";
import { parsePricingItems, pricingTotal } from "@/lib/admin/sales-ai";
import { daysUntil, parseTeam } from "@/lib/admin/projects";

type Client = SupabaseClient<Database>;

export type NamedCount = { label: string; value: number };
export type MonthPoint = { month: string; revenue: number; leads: number };

export type ExecutiveIntelligence = {
  overview: {
    revenue: number;
    outstanding: number;
    activeProjects: number;
    totalClients: number;
    totalLeads: number;
    conversionRate: number;
    pipelineValue: number;
    avgDealSize: number;
  };
  sales: {
    funnel: { label: string; value: number; hint?: string }[];
    sources: NamedCount[];
    packages: NamedCount[];
    conversion: {
      leadToProposal: number;
      proposalToPaid: number;
      leadToClient: number;
      hot: number;
      warm: number;
      cold: number;
    };
  };
  finance: {
    paidCount: number;
    paidAmount: number;
    outstandingCount: number;
    outstandingAmount: number;
    overdueCount: number;
    byStatus: NamedCount[];
    monthly: MonthPoint[];
    forecast: { nextMonth: number; quarter: number; basis: string };
  };
  projects: {
    active: number;
    completed: number;
    delayed: number;
    atRisk: number;
    avgCompletionDays: number;
    avgProgress: number;
    byStage: NamedCount[];
    workload: NamedCount[];
  };
};

function monthKey(iso: string): string {
  return iso.slice(0, 7);
}

function lastMonths(count: number): string[] {
  const out: string[] = [];
  const now = new Date();
  for (let i = count - 1; i >= 0; i -= 1) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    out.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }
  return out;
}

function tally(values: (string | null | undefined)[], limit = 8): NamedCount[] {
  const map = new Map<string, number>();
  for (const raw of values) {
    const label = (raw ?? "").trim();
    if (!label) continue;
    map.set(label, (map.get(label) ?? 0) + 1);
  }
  return [...map.entries()]
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, limit);
}

const OPEN_PROPOSAL = new Set(["Draft", "Sent", "Viewed", "Negotiation"]);

export async function fetchExecutiveIntelligence(supabase: Client): Promise<ExecutiveIntelligence> {
  const [leadsRes, proposalsRes, invoicesRes, clientsRes, projectsRes, tasksRes] =
    await Promise.all([
      supabase
        .from("consultations")
        .select(
          "id, created_at, status, lead_temperature, lead_source, visitor_source, utm_source, selected_package, ai_recommended_package, ai_conversation",
        ),
      supabase.from("proposals").select("id, status, pricing_items, created_at"),
      supabase
        .from("invoices")
        .select("id, status, amount, currency, due_date, paid_at, created_at, items"),
      supabase.from("clients").select("id, status, created_at"),
      supabase
        .from("client_projects")
        .select("id, name, status, stage, progress, timeline, team, start_date, target_date, updated_at, created_at"),
      supabase.from("project_tasks").select("id, project_id, assignee, status, due_date"),
    ]);

  const err =
    leadsRes.error ??
    proposalsRes.error ??
    invoicesRes.error ??
    clientsRes.error ??
    projectsRes.error ??
    tasksRes.error;
  if (err) throw new Error("Tidak dapat memuat data business intelligence.");

  const leads = leadsRes.data ?? [];
  const proposals = proposalsRes.data ?? [];
  const invoices = invoicesRes.data ?? [];
  const clients = clientsRes.data ?? [];
  const projects = projectsRes.data ?? [];
  const tasks = tasksRes.data ?? [];

  /* ------------------------------- Financial ------------------------------ */

  const amountOf = (row: (typeof invoices)[number]): number => {
    const amount = Number(row.amount ?? 0);
    if (amount > 0) return amount;
    return pricingTotal(parsePricingItems(row.items));
  };

  const paidInvoices = invoices.filter((i) => i.status === "Paid");
  const outstandingInvoices = invoices.filter(
    (i) => i.status === "Pending" || i.status === "Payment Link Sent",
  );
  const paidAmount = paidInvoices.reduce((sum, i) => sum + amountOf(i), 0);
  const outstandingAmount = outstandingInvoices.reduce((sum, i) => sum + amountOf(i), 0);
  const overdueCount = outstandingInvoices.filter((i) => {
    const days = daysUntil(i.due_date);
    return days !== null && days < 0;
  }).length;

  const months = lastMonths(6);
  const monthly: MonthPoint[] = months.map((month) => ({
    month,
    revenue: paidInvoices
      .filter((i) => monthKey(String(i.paid_at ?? i.created_at)) === month)
      .reduce((sum, i) => sum + amountOf(i), 0),
    leads: leads.filter((l) => monthKey(String(l.created_at)) === month).length,
  }));

  const revenueMonths = monthly.filter((m) => m.revenue > 0);
  const avgMonthly =
    revenueMonths.length > 0
      ? Math.round(revenueMonths.reduce((s, m) => s + m.revenue, 0) / revenueMonths.length)
      : 0;
  const recent = monthly.slice(-3);
  const trendAvg =
    recent.length > 0 ? Math.round(recent.reduce((s, m) => s + m.revenue, 0) / recent.length) : 0;
  const nextMonth = Math.round(trendAvg * 0.6 + avgMonthly * 0.4 + outstandingAmount * 0.35);

  /* -------------------------------- Pipeline ------------------------------ */

  const openProposals = proposals.filter((p) => OPEN_PROPOSAL.has(String(p.status)));
  const proposalValue = (row: (typeof proposals)[number]) =>
    pricingTotal(parsePricingItems(row.pricing_items));
  const pipelineValue =
    openProposals.reduce((sum, p) => sum + proposalValue(p), 0) + outstandingAmount;

  const approvedProposals = proposals.filter((p) => p.status === "Approved").length;
  const paidClients = clients.length;

  const aiLeads = leads.filter(
    (l) => l.lead_source === "ai_consultant" || (Array.isArray(l.ai_conversation) && l.ai_conversation.length > 0),
  ).length;

  const conversionRate = leads.length ? Number(((paidClients / leads.length) * 100).toFixed(1)) : 0;
  const leadToProposal = leads.length
    ? Number(((proposals.length / leads.length) * 100).toFixed(1))
    : 0;
  const proposalToPaid = proposals.length
    ? Number(((paidClients / proposals.length) * 100).toFixed(1))
    : 0;

  /* -------------------------------- Projects ------------------------------ */

  const overdueByProject = new Map<string, number>();
  for (const task of tasks) {
    if (task.status === "Completed") continue;
    const days = daysUntil(task.due_date);
    if (days !== null && days < 0) {
      overdueByProject.set(task.project_id, (overdueByProject.get(task.project_id) ?? 0) + 1);
    }
  }

  const decorated = projects.map((project) => {
    const stage = normalizeDeliveryStage(project.stage);
    const progress = Number(project.progress ?? 0) || timelineProgress(parseTimeline(project.timeline));
    return {
      ...project,
      stage,
      progress,
      health: projectHealth({
        stage,
        progress,
        target_date: project.target_date,
        overdue_tasks: overdueByProject.get(project.id) ?? 0,
      }),
    };
  });

  const completedProjects = decorated.filter((p) => p.stage === "Completed");
  const activeProjects = decorated.filter((p) => p.stage !== "Completed");
  const completionDays = completedProjects
    .map((p) => {
      const start = p.start_date ? new Date(`${p.start_date}T00:00:00`).getTime() : new Date(p.created_at).getTime();
      const end = new Date(p.updated_at).getTime();
      if (Number.isNaN(start) || Number.isNaN(end) || end < start) return null;
      return Math.round((end - start) / 86_400_000);
    })
    .filter((v): v is number => v !== null);

  const workloadMap = new Map<string, number>();
  for (const task of tasks) {
    if (task.status === "Completed") continue;
    const name = (task.assignee ?? "").trim() || "Belum ditugaskan";
    workloadMap.set(name, (workloadMap.get(name) ?? 0) + 1);
  }
  for (const project of activeProjects) {
    for (const member of parseTeam(project.team)) {
      if (!workloadMap.has(member)) workloadMap.set(member, 0);
    }
  }

  return {
    overview: {
      revenue: paidAmount,
      outstanding: outstandingAmount,
      activeProjects: activeProjects.length,
      totalClients: clients.length,
      totalLeads: leads.length,
      conversionRate,
      pipelineValue,
      avgDealSize: paidInvoices.length ? Math.round(paidAmount / paidInvoices.length) : 0,
    },
    sales: {
      funnel: [
        { label: "Visitor", value: leads.length + aiLeads, hint: "estimasi dari sesi tercatat" },
        { label: "AI Assessment", value: aiLeads, hint: "lead lewat AI consultant" },
        { label: "Lead", value: leads.length },
        { label: "Proposal", value: proposals.length, hint: `${approvedProposals} approved` },
        { label: "Paid Client", value: paidClients },
      ],
      sources: tally(
        leads.map((l) => l.lead_source ?? l.visitor_source ?? l.utm_source ?? "direct"),
      ),
      packages: tally(leads.map((l) => l.ai_recommended_package ?? l.selected_package)),
      conversion: {
        leadToProposal,
        proposalToPaid,
        leadToClient: conversionRate,
        hot: leads.filter((l) => l.lead_temperature === "hot").length,
        warm: leads.filter((l) => l.lead_temperature === "warm").length,
        cold: leads.filter((l) => l.lead_temperature === "cold").length,
      },
    },
    finance: {
      paidCount: paidInvoices.length,
      paidAmount,
      outstandingCount: outstandingInvoices.length,
      outstandingAmount,
      overdueCount,
      byStatus: tally(invoices.map((i) => i.status), 6),
      monthly,
      forecast: {
        nextMonth,
        quarter: nextMonth * 3,
        basis: "rata-rata 3 bulan terakhir + 35% outstanding",
      },
    },
    projects: {
      active: activeProjects.length,
      completed: completedProjects.length,
      delayed: decorated.filter((p) => p.health === "Delayed").length,
      atRisk: decorated.filter((p) => p.health === "At Risk").length,
      avgCompletionDays: completionDays.length
        ? Math.round(completionDays.reduce((s, v) => s + v, 0) / completionDays.length)
        : 0,
      avgProgress: decorated.length
        ? Math.round(decorated.reduce((s, p) => s + p.progress, 0) / decorated.length)
        : 0,
      byStage: tally(decorated.map((p) => p.stage), 6),
      workload: [...workloadMap.entries()]
        .map(([label, value]) => ({ label, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 8),
    },
  };
}
