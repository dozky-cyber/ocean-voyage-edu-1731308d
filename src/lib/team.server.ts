/**
 * KERJAKU Team Management — server-only data access.
 *
 * Read-only against existing delivery data (`client_projects`, `project_tasks`,
 * `project_activities`); it never mutates CRM, proposal, invoice, client, or
 * project rows. Members are assigned to projects through the existing
 * `client_projects.team` array saved by the project workspace.
 */
import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/integrations/supabase/types";
import { OVERLOAD_THRESHOLD } from "@/lib/admin/team";

type Client = SupabaseClient<Database>;

const MEMBER_COLUMNS =
  "id, name, email, role, avatar_url, title, active, capacity, notes, created_at, updated_at";

export type TeamMemberRow = {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar_url: string | null;
  title: string | null;
  active: boolean;
  capacity: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type TeamMemberProfile = TeamMemberRow & {
  projects: { id: string; name: string; status: string; target_date: string | null }[];
  tasks: {
    id: string;
    title: string;
    status: string;
    priority: string;
    due_date: string | null;
    project_id: string;
    project_name: string;
  }[];
  open_tasks: number;
  workload: number;
  activity: { id: string; action: string; detail: string | null; created_at: string }[];
};

export type TeamWorkspace = {
  members: TeamMemberProfile[];
  summary: {
    total: number;
    active: number;
    overloaded: number;
    assigned_projects: number;
    avg_projects: number;
    avg_workload: number;
    unassigned_projects: number;
  };
};

function matches(a: string, b: string) {
  return a.trim().toLowerCase() === b.trim().toLowerCase();
}

export async function fetchTeamMembers(supabase: Client): Promise<TeamMemberRow[]> {
  const { data, error } = await supabase
    .from("team_members")
    .select(MEMBER_COLUMNS)
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as TeamMemberRow[];
}

export async function fetchTeamWorkspace(supabase: Client): Promise<TeamWorkspace> {
  const [members, projectsRes, tasksRes, activityRes] = await Promise.all([
    fetchTeamMembers(supabase),
    supabase
      .from("client_projects")
      .select("id, name, status, team, target_date")
      .order("created_at", { ascending: false })
      .limit(300),
    supabase
      .from("project_tasks")
      .select("id, project_id, title, status, priority, due_date, assignee")
      .limit(1000),
    supabase
      .from("project_activities")
      .select("id, actor, action, detail, created_at")
      .order("created_at", { ascending: false })
      .limit(400),
  ]);

  const projects = (projectsRes.data ?? []).map((p) => ({
    id: p.id,
    name: p.name,
    status: p.status,
    target_date: p.target_date,
    team: Array.isArray(p.team) ? (p.team as unknown[]).filter((v): v is string => typeof v === "string") : [],
  }));
  const projectName = new Map(projects.map((p) => [p.id, p.name]));
  const tasks = tasksRes.data ?? [];
  const activities = activityRes.data ?? [];

  const profiles: TeamMemberProfile[] = members.map((member) => {
    const memberProjects = projects
      .filter((p) => p.team.some((t) => matches(t, member.name)) && p.status !== "Completed")
      .map((p) => ({ id: p.id, name: p.name, status: p.status, target_date: p.target_date }));

    const memberTasks = tasks
      .filter((t) => typeof t.assignee === "string" && matches(t.assignee, member.name))
      .map((t) => ({
        id: t.id,
        title: t.title,
        status: t.status,
        priority: t.priority,
        due_date: t.due_date,
        project_id: t.project_id,
        project_name: projectName.get(t.project_id) ?? "Project",
      }));

    const openTasks = memberTasks.filter((t) => t.status !== "Completed").length;
    const capacity = member.capacity > 0 ? member.capacity : 6;
    const workload = Math.round((openTasks / capacity) * 100);

    return {
      ...member,
      projects: memberProjects,
      tasks: memberTasks,
      open_tasks: openTasks,
      workload,
      activity: activities
        .filter((a) => typeof a.actor === "string" && matches(a.actor, member.name))
        .slice(0, 6)
        .map((a) => ({ id: a.id, action: a.action, detail: a.detail, created_at: a.created_at })),
    };
  });

  const activeMembers = profiles.filter((m) => m.active);
  const assignedProjects = new Set<string>();
  for (const profile of profiles) for (const p of profile.projects) assignedProjects.add(p.id);
  const openProjects = projects.filter((p) => p.status !== "Completed");

  return {
    members: profiles,
    summary: {
      total: profiles.length,
      active: activeMembers.length,
      overloaded: profiles.filter((m) => m.active && m.workload >= OVERLOAD_THRESHOLD).length,
      assigned_projects: assignedProjects.size,
      avg_projects: activeMembers.length
        ? Math.round(
            (activeMembers.reduce((sum, m) => sum + m.projects.length, 0) / activeMembers.length) *
              10,
          ) / 10
        : 0,
      avg_workload: activeMembers.length
        ? Math.round(activeMembers.reduce((sum, m) => sum + m.workload, 0) / activeMembers.length)
        : 0,
      unassigned_projects: openProjects.filter((p) => !assignedProjects.has(p.id)).length,
    },
  };
}

export type TeamMemberInput = {
  name: string;
  email: string;
  role: string;
  avatar_url: string | null;
  title: string | null;
  active: boolean;
  capacity: number;
  notes: string | null;
};

export async function createTeamMember(
  supabase: Client,
  input: TeamMemberInput,
  userId: string,
): Promise<TeamMemberRow> {
  const { data, error } = await supabase
    .from("team_members")
    .insert({ ...input, created_by: userId })
    .select(MEMBER_COLUMNS)
    .single();
  if (error) throw new Error(error.message);
  return data as TeamMemberRow;
}

export async function updateTeamMember(
  supabase: Client,
  input: TeamMemberInput & { id: string },
): Promise<TeamMemberRow> {
  const { id, ...fields } = input;
  const { data, error } = await supabase
    .from("team_members")
    .update(fields)
    .eq("id", id)
    .select(MEMBER_COLUMNS)
    .single();
  if (error) throw new Error(error.message);
  return data as TeamMemberRow;
}

export async function deleteTeamMember(supabase: Client, id: string): Promise<{ ok: true }> {
  const { error } = await supabase.from("team_members").delete().eq("id", id);
  if (error) throw new Error(error.message);
  return { ok: true };
}
