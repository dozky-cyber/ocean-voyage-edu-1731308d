/**
 * Global search + notification feed for the Business OS — server-only.
 *
 * Read-only aggregation over existing tables. No schema changes; every query
 * runs through the caller's authenticated client so RLS/permissions apply.
 */
import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/integrations/supabase/types";
import type {
  NotificationItem,
  SearchCategory,
  SearchResult,
} from "@/lib/admin/search";

type Client = SupabaseClient<Database>;

function escapeLike(value: string): string {
  return value.replace(/[%,()]/g, " ").trim();
}

function money(amount: number, currency: string): string {
  return `${currency} ${new Intl.NumberFormat("id-ID").format(amount)}`;
}

export async function searchWorkspace(
  supabase: Client,
  rawTerm: string,
  categories: SearchCategory[],
): Promise<SearchResult[]> {
  const term = escapeLike(rawTerm);
  if (term.length < 2) return [];
  const want = (c: SearchCategory) => categories.length === 0 || categories.includes(c);
  const like = `%${term}%`;
  const limit = 6;

  const [leads, clients, projects, proposals, invoices, tasks, portfolio] = await Promise.all([
    want("lead")
      ? supabase
          .from("consultations")
          .select("id, name, email, company, business_name, status, lead_temperature, created_at")
          .or(
            `name.ilike.${like},email.ilike.${like},company.ilike.${like},business_name.ilike.${like},whatsapp.ilike.${like}`,
          )
          .order("created_at", { ascending: false })
          .limit(limit)
      : null,
    want("client")
      ? supabase
          .from("clients")
          .select("id, name, email, company, status")
          .or(`name.ilike.${like},email.ilike.${like},company.ilike.${like}`)
          .limit(limit)
      : null,
    want("project")
      ? supabase
          .from("client_projects")
          .select("id, name, status, stage, phase, target_date")
          .or(`name.ilike.${like},summary.ilike.${like},scope.ilike.${like}`)
          .limit(limit)
      : null,
    want("proposal")
      ? supabase
          .from("proposals")
          .select("id, title, status, client_name, recommended_package, updated_at")
          .or(`title.ilike.${like},client_name.ilike.${like},recommended_package.ilike.${like}`)
          .limit(limit)
      : null,
    want("invoice")
      ? supabase
          .from("invoices")
          .select("id, number, title, client_name, status, amount, currency")
          .or(
            `number.ilike.${like},title.ilike.${like},client_name.ilike.${like},client_email.ilike.${like}`,
          )
          .limit(limit)
      : null,
    want("task")
      ? supabase
          .from("project_tasks")
          .select("id, project_id, title, status, assignee, priority, due_date")
          .or(`title.ilike.${like},description.ilike.${like},assignee.ilike.${like}`)
          .limit(limit)
      : null,
    want("portfolio")
      ? supabase
          .from("portfolio_projects")
          .select("id, title, slug, category, published")
          .or(`title.ilike.${like},slug.ilike.${like},category.ilike.${like}`)
          .limit(limit)
      : null,
  ]);

  const out: SearchResult[] = [];

  for (const row of leads?.data ?? []) {
    out.push({
      id: row.id,
      category: "lead",
      title: row.name,
      subtitle: row.company || row.business_name || row.email,
      meta: row.lead_temperature?.replace(" Lead", "") ?? row.status,
      href: `/admin/leads/${row.id}`,
    });
  }
  for (const row of clients?.data ?? []) {
    out.push({
      id: row.id,
      category: "client",
      title: row.name,
      subtitle: row.company || row.email,
      meta: row.status,
      href: `/admin/clients/${row.id}`,
    });
  }
  for (const row of projects?.data ?? []) {
    out.push({
      id: row.id,
      category: "project",
      title: row.name,
      subtitle: `${row.stage ?? row.phase} · ${row.status}`,
      meta: row.target_date,
      href: `/admin/projects/${row.id}`,
    });
  }
  for (const row of proposals?.data ?? []) {
    out.push({
      id: row.id,
      category: "proposal",
      title: row.title,
      subtitle: row.client_name || row.recommended_package || "Proposal",
      meta: row.status,
      href: `/admin/proposals/${row.id}`,
    });
  }
  for (const row of invoices?.data ?? []) {
    out.push({
      id: row.id,
      category: "invoice",
      title: `${row.number} · ${row.title}`,
      subtitle: row.client_name || "-",
      meta: money(Number(row.amount ?? 0), row.currency ?? "IDR"),
      href: `/admin/invoices/${row.id}`,
    });
  }
  for (const row of tasks?.data ?? []) {
    out.push({
      id: row.id,
      category: "task",
      title: row.title,
      subtitle: `${row.assignee?.trim() || "Belum ditugaskan"} · ${row.status}`,
      meta: row.due_date,
      href: `/admin/projects/${row.project_id}`,
    });
  }
  for (const row of portfolio?.data ?? []) {
    out.push({
      id: row.id,
      category: "portfolio",
      title: row.title,
      subtitle: row.category,
      meta: row.published ? "Published" : "Draft",
      href: `/admin/portfolio`,
    });
  }

  return out;
}

export async function buildNotifications(supabase: Client): Promise<NotificationItem[]> {
  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  const in7 = new Date(now.getTime() + 7 * 86400000).toISOString().slice(0, 10);

  const [leads, proposals, invoices, deadlines, overdue, approvals, logs] = await Promise.all([
    supabase
      .from("consultations")
      .select("id, name, company, lead_temperature, lead_score, created_at")
      .order("created_at", { ascending: false })
      .limit(12),
    supabase
      .from("proposals")
      .select("id, title, status, client_name, updated_at")
      .order("updated_at", { ascending: false })
      .limit(8),
    supabase
      .from("invoices")
      .select("id, number, client_name, amount, currency, paid_at")
      .eq("status", "paid")
      .order("paid_at", { ascending: false })
      .limit(8),
    supabase
      .from("client_projects")
      .select("id, name, target_date, status, updated_at")
      .not("target_date", "is", null)
      .lte("target_date", in7)
      .order("target_date", { ascending: true })
      .limit(8),
    supabase
      .from("project_tasks")
      .select("id, project_id, title, due_date, status, assignee, updated_at")
      .not("due_date", "is", null)
      .lt("due_date", today)
      .neq("status", "done")
      .order("due_date", { ascending: true })
      .limit(8),
    supabase
      .from("project_activities")
      .select("id, project_id, actor, action, detail, created_at")
      .order("created_at", { ascending: false })
      .limit(12),
    supabase
      .from("automation_logs")
      .select("id, title, detail, entity_type, entity_id, created_at, status")
      .order("created_at", { ascending: false })
      .limit(12),
  ]);

  const items: NotificationItem[] = [];

  for (const row of leads.data ?? []) {
    const hot = (row.lead_temperature ?? "").toLowerCase().includes("hot");
    items.push({
      id: `${hot ? "hot" : "lead"}-${row.id}`,
      kind: hot ? "hot_lead" : "new_lead",
      title: hot ? `Hot lead: ${row.name}` : `Lead baru: ${row.name}`,
      detail: `${row.company || "Tanpa perusahaan"} · skor ${row.lead_score}`,
      href: `/admin/leads/${row.id}`,
      created_at: row.created_at,
    });
  }
  for (const row of proposals.data ?? []) {
    items.push({
      id: `proposal-${row.id}-${row.status}`,
      kind: "proposal_update",
      title: `Proposal ${row.status}: ${row.title}`,
      detail: row.client_name,
      href: `/admin/proposals/${row.id}`,
      created_at: row.updated_at,
    });
  }
  for (const row of invoices.data ?? []) {
    items.push({
      id: `invoice-${row.id}`,
      kind: "invoice_paid",
      title: `Invoice ${row.number} dibayar`,
      detail: `${row.client_name ?? "-"} · ${money(Number(row.amount ?? 0), row.currency ?? "IDR")}`,
      href: `/admin/invoices/${row.id}`,
      created_at: row.paid_at ?? new Date().toISOString(),
    });
  }
  for (const row of deadlines.data ?? []) {
    items.push({
      id: `deadline-${row.id}-${row.target_date}`,
      kind: "project_deadline",
      title: `Deadline ${row.name}`,
      detail: `Target ${row.target_date} · ${row.status}`,
      href: `/admin/projects/${row.id}`,
      created_at: row.updated_at,
    });
  }
  for (const row of overdue.data ?? []) {
    items.push({
      id: `overdue-${row.id}-${row.due_date}`,
      kind: "task_overdue",
      title: `Task terlambat: ${row.title}`,
      detail: `${row.assignee?.trim() || "Belum ditugaskan"} · jatuh tempo ${row.due_date}`,
      href: `/admin/projects/${row.project_id}`,
      created_at: row.updated_at,
    });
  }
  for (const row of approvals.data ?? []) {
    if (!/approv|setuj/i.test(`${row.action} ${row.detail ?? ""}`)) continue;
    items.push({
      id: `approval-${row.id}`,
      kind: "client_approval",
      title: `Approval klien: ${row.action}`,
      detail: `${row.actor}${row.detail ? ` · ${row.detail}` : ""}`,
      href: `/admin/projects/${row.project_id}`,
      created_at: row.created_at,
    });
  }
  for (const row of logs.data ?? []) {
    items.push({
      id: `automation-${row.id}`,
      kind: "automation",
      title: row.title,
      detail: row.detail,
      href: `/admin/automation`,
      created_at: row.created_at,
    });
  }

  return items
    .sort((a, b) => (a.created_at < b.created_at ? 1 : -1))
    .slice(0, 40);
}
