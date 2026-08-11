/**
 * KERJAKU Project Delivery — server-only data access.
 *
 * Everything here operates on the SAME `client_projects` rows created by the
 * payment → client conversion flow. No new client or project records are
 * created outside of that flow.
 */
import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/integrations/supabase/types";
import { parseTimeline, timelineProgress, type TimelineStep } from "@/lib/admin/payments";
import {
  isOverdue,
  normalizeStage,
  projectHealth,
  type DeliveryStage,
  type ProjectHealth,
} from "@/lib/admin/ops";
import {
  currentPhase,
  parseTeam,
  templateMeta,
  templateTimeline,
  type TaskPriority,
  type TaskStatus,
} from "@/lib/admin/projects";

type Client = SupabaseClient<Database>;

const PROJECT_COLUMNS =
  "id, client_id, invoice_id, name, status, stage, progress, summary, scope, template, phase, team, timeline, start_date, target_date, created_at, updated_at";

const TASK_COLUMNS =
  "id, project_id, title, description, assignee, priority, status, due_date, notes, position, created_at, updated_at";

function shapeProject(row: Record<string, unknown>) {
  const timeline = parseTimeline(row['timeline']);
  return {
    ...(row as Record<string, unknown>),
    timeline,
    stage: normalizeStage(row['stage']),
    team: parseTeam(row['team']),
    progress: timelineProgress(timeline),
    phase: currentPhase(timeline),
  } as ProjectRow;
}

export type ProjectRow = {
  id: string;
  client_id: string;
  invoice_id: string | null;
  name: string;
  status: string;
  stage: DeliveryStage;
  progress: number;
  summary: string | null;
  scope: string | null;
  template: string;
  phase: string;
  team: string[];
  timeline: TimelineStep[];
  start_date: string | null;
  target_date: string | null;
  created_at: string;
  updated_at: string;
};

export type ProjectBoardItem = ProjectRow & {
  client_name: string;
  client_company: string | null;
  client_status: string;
  client_package: string | null;
  open_tasks: number;
  total_tasks: number;
  overdue_tasks: number;
  health: ProjectHealth;
};

/* --------------------------------- Board ---------------------------------- */

export async function fetchProjectBoard(supabase: Client): Promise<ProjectBoardItem[]> {
  const [{ data: projects, error }, { data: clients }, { data: tasks }] = await Promise.all([
    supabase
      .from("client_projects")
      .select(PROJECT_COLUMNS)
      .order("created_at", { ascending: false })
      .limit(300),
    supabase.from("clients").select("id, name, company, status, package"),
    supabase.from("project_tasks").select("project_id, status, due_date"),
  ]);
  if (error) throw new Error(error.message);

  const clientById = new Map((clients ?? []).map((c) => [c.id, c]));
  const taskStats = new Map<string, { open: number; total: number; overdue: number }>();
  for (const task of tasks ?? []) {
    const stat = taskStats.get(task.project_id) ?? { open: 0, total: 0, overdue: 0 };
    stat.total += 1;
    if (task.status !== "Completed") stat.open += 1;
    if (isOverdue(task.due_date, task.status)) stat.overdue += 1;
    taskStats.set(task.project_id, stat);
  }

  return (projects ?? []).map((row) => {
    const project = shapeProject(row as Record<string, unknown>);
    const client = clientById.get(project.client_id);
    const stat = taskStats.get(project.id) ?? { open: 0, total: 0, overdue: 0 };
    return {
      ...project,
      client_name: client?.name ?? "Klien KERJAKU",
      client_company: client?.company ?? null,
      client_status: client?.status ?? "Active",
      client_package: client?.package ?? null,
      open_tasks: stat.open,
      total_tasks: stat.total,
      overdue_tasks: stat.overdue,
      health: projectHealth({
        stage: project.stage,
        progress: project.progress,
        target_date: project.target_date,
        overdue_tasks: stat.overdue,
      }),
    };
  });
}

/* ------------------------------- Workspace -------------------------------- */

export async function fetchProjectWorkspace(supabase: Client, projectId: string) {
  const { data: row, error } = await supabase
    .from("client_projects")
    .select(PROJECT_COLUMNS)
    .eq("id", projectId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!row) throw new Error("Project tidak ditemukan.");
  const project = shapeProject(row as Record<string, unknown>);

  const [client, tasks, activities, documents, comments, invoice] = await Promise.all([
    supabase
      .from("clients")
      .select("id, name, email, whatsapp, company, package, status, portal_token, lead_id")
      .eq("id", project.client_id)
      .maybeSingle(),
    supabase
      .from("project_tasks")
      .select(TASK_COLUMNS)
      .eq("project_id", projectId)
      .order("position", { ascending: true })
      .order("created_at", { ascending: true }),
    supabase
      .from("project_activities")
      .select("id, actor, action, detail, created_at")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false })
      .limit(100),
    supabase
      .from("client_documents")
      .select("id, title, kind, url, created_at")
      .eq("client_id", project.client_id)
      .order("created_at", { ascending: false }),
    supabase
      .from("task_comments")
      .select("id, task_id, author_name, body, created_at")
      .eq("project_id", projectId)
      .order("created_at", { ascending: true })
      .limit(400),
    project.invoice_id
      ? supabase
          .from("invoices")
          .select("id, number, amount, currency, status, due_date, paid_at")
          .eq("id", project.invoice_id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  return {
    project,
    client: client.data ?? null,
    tasks: tasks.data ?? [],
    activities: activities.data ?? [],
    documents: documents.data ?? [],
    invoice: invoice.data ?? null,
    comments: comments.data ?? [],
  };
}

/* --------------------------------- Writes --------------------------------- */

export async function logProjectActivity(
  supabase: Client,
  input: { projectId: string; action: string; detail?: string | null; actor?: string },
  userId: string | null,
) {
  const { error } = await supabase.from("project_activities").insert({
    project_id: input.projectId,
    action: input.action,
    detail: input.detail ?? null,
    actor: input.actor ?? "KERJAKU Team",
    created_by: userId,
  });
  if (error) throw new Error(error.message);
  return { ok: true as const };
}

export async function updateProjectDetails(
  supabase: Client,
  input: {
    id: string;
    name: string;
    status: string;
    stage: DeliveryStage;
    summary: string | null;
    scope: string | null;
    team: string[];
    timeline: TimelineStep[];
    start_date: string | null;
    target_date: string | null;
  },
  userId: string | null,
) {
  const { error } = await supabase
    .from("client_projects")
    .update({
      name: input.name,
      status: input.status,
      stage: input.stage,
      summary: input.summary,
      scope: input.scope,
      team: input.team,
      timeline: input.timeline,
      progress: timelineProgress(input.timeline),
      phase: currentPhase(input.timeline),
      start_date: input.start_date || null,
      target_date: input.target_date || null,
    })
    .eq("id", input.id);
  if (error) throw new Error(error.message);
  await logProjectActivity(
    supabase,
    {
      projectId: input.id,
      action: "Project diperbarui",
      detail: `Stage: ${input.stage} · Status: ${input.status}`,
    },
    userId,
  );
  return { ok: true as const };
}

export async function applyProjectTemplate(
  supabase: Client,
  input: { id: string; templateId: string },
  userId: string | null,
) {
  const meta = templateMeta(input.templateId);
  const timeline = templateTimeline(input.templateId);
  const { error } = await supabase
    .from("client_projects")
    .update({
      template: meta.id,
      timeline,
      progress: timelineProgress(timeline),
      phase: currentPhase(timeline),
    })
    .eq("id", input.id);
  if (error) throw new Error(error.message);
  await logProjectActivity(
    supabase,
    { projectId: input.id, action: "Template diterapkan", detail: meta.label },
    userId,
  );
  return { ok: true as const };
}

export async function createProjectTask(
  supabase: Client,
  input: {
    projectId: string;
    title: string;
    description: string | null;
    assignee: string | null;
    priority: TaskPriority;
    status: TaskStatus;
    due_date: string | null;
  },
  userId: string | null,
) {
  const { count } = await supabase
    .from("project_tasks")
    .select("id", { count: "exact", head: true })
    .eq("project_id", input.projectId);

  const { data, error } = await supabase
    .from("project_tasks")
    .insert({
      project_id: input.projectId,
      title: input.title,
      description: input.description,
      assignee: input.assignee,
      priority: input.priority,
      status: input.status,
      due_date: input.due_date || null,
      position: count ?? 0,
      created_by: userId,
    })
    .select(TASK_COLUMNS)
    .single();
  if (error) throw new Error(error.message);

  await logProjectActivity(
    supabase,
    { projectId: input.projectId, action: "Task dibuat", detail: input.title },
    userId,
  );
  return data;
}

export async function updateProjectTask(
  supabase: Client,
  input: {
    id: string;
    title: string;
    description: string | null;
    assignee: string | null;
    priority: TaskPriority;
    status: TaskStatus;
    due_date: string | null;
    notes: string | null;
  },
  userId: string | null,
) {
  const { data, error } = await supabase
    .from("project_tasks")
    .update({
      title: input.title,
      description: input.description,
      assignee: input.assignee,
      priority: input.priority,
      status: input.status,
      due_date: input.due_date || null,
      notes: input.notes,
    })
    .eq("id", input.id)
    .select("project_id, title")
    .single();
  if (error) throw new Error(error.message);

  await logProjectActivity(
    supabase,
    {
      projectId: data.project_id,
      action: "Task diperbarui",
      detail: `${data.title} → ${input.status}`,
    },
    userId,
  );
  return { ok: true as const };
}

export async function setProjectTaskStatus(
  supabase: Client,
  input: { id: string; status: TaskStatus },
  userId: string | null,
) {
  const { data, error } = await supabase
    .from("project_tasks")
    .update({ status: input.status })
    .eq("id", input.id)
    .select("project_id, title")
    .single();
  if (error) throw new Error(error.message);
  await logProjectActivity(
    supabase,
    {
      projectId: data.project_id,
      action: "Status task berubah",
      detail: `${data.title} → ${input.status}`,
    },
    userId,
  );
  return { ok: true as const };
}

export async function deleteProjectTask(supabase: Client, id: string) {
  const { error } = await supabase.from("project_tasks").delete().eq("id", id);
  if (error) throw new Error(error.message);
  return { ok: true as const };
}

/* -------------------------------- Analytics ------------------------------- */

export type ProjectAnalytics = {
  active: number;
  completed: number;
  delayed: number;
  upcoming: { id: string; name: string; client: string; target_date: string; days: number }[];
  averageCompletionDays: number;
  averageProgress: number;
  workload: { label: string; value: number }[];
  byStatus: { label: string; value: number }[];
};

export async function buildProjectAnalytics(supabase: Client): Promise<ProjectAnalytics> {
  const board = await fetchProjectBoard(supabase);
  const { data: tasks } = await supabase.from("project_tasks").select("assignee, status");

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let completedDaysTotal = 0;
  let completedWithDates = 0;
  const byStatus = new Map<string, number>();
  const upcoming: ProjectAnalytics["upcoming"] = [];
  let delayed = 0;

  for (const project of board) {
    byStatus.set(project.status, (byStatus.get(project.status) ?? 0) + 1);
    const target = project.target_date
      ? new Date(`${project.target_date}T00:00:00`).getTime()
      : null;

    if (project.status === "Completed") {
      const start = project.start_date ? new Date(`${project.start_date}T00:00:00`).getTime() : null;
      const end = new Date(project.updated_at).getTime();
      if (start && end > start) {
        completedDaysTotal += Math.round((end - start) / 86_400_000);
        completedWithDates += 1;
      }
    } else if (target !== null) {
      const days = Math.round((target - today.getTime()) / 86_400_000);
      if (days < 0) delayed += 1;
      else if (days <= 30)
        upcoming.push({
          id: project.id,
          name: project.name,
          client: project.client_name,
          target_date: project.target_date!,
          days,
        });
    }
  }

  const workload = new Map<string, number>();
  for (const task of tasks ?? []) {
    if (task.status === "Completed") continue;
    const key = task.assignee?.trim() || "Belum ditugaskan";
    workload.set(key, (workload.get(key) ?? 0) + 1);
  }

  const active = board.filter((p) => p.status !== "Completed").length;
  const completed = board.length - active;

  return {
    active,
    completed,
    delayed,
    upcoming: upcoming.sort((a, b) => a.days - b.days).slice(0, 6),
    averageCompletionDays: completedWithDates
      ? Math.round(completedDaysTotal / completedWithDates)
      : 0,
    averageProgress: board.length
      ? Math.round(board.reduce((sum, p) => sum + p.progress, 0) / board.length)
      : 0,
    workload: [...workload.entries()]
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value),
    byStatus: [...byStatus.entries()].map(([label, value]) => ({ label, value })),
  };
}
