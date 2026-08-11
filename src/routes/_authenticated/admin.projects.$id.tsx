import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, ExternalLink, FileText, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Chip, GlassCard, SectionCard } from "@/components/admin/ui";
import {
  formatMoney,
  PROJECT_STATUSES,
  type ProjectStatus,
  type TimelineStep,
} from "@/lib/admin/payments";
import {
  formatDate,
  PROJECT_TEMPLATES,
  TASK_PRIORITIES,
  TASK_STATUSES,
  taskPriorityClass,
  taskStatusClass,
  templateMeta,
  type TaskPriority,
  type TaskStatus,
} from "@/lib/admin/projects";
import { teamRoleClass } from "@/lib/admin/team";
import { getTeamMembersFn } from "@/lib/team.functions";
import {
  applyTemplateFn,
  createTaskFn,
  deleteTaskFn,
  getProjectWorkspace,
  saveProjectDetails,
  setTaskStatusFn,
  updateTaskFn,
} from "@/lib/projects.functions";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/admin/projects/$id")({
  component: ProjectWorkspacePage,
});

const TABS = ["Overview", "Timeline", "Tasks", "Files", "Activity"] as const;
type Tab = (typeof TABS)[number];

const inputClass =
  "w-full rounded-xl border border-border/50 bg-background/40 px-3 py-2 text-sm outline-none transition focus:border-primary/60";

function ProjectWorkspacePage() {
  const { id } = useParams({ from: "/_authenticated/admin/projects/$id" });
  const queryClient = useQueryClient();
  const fetchWorkspace = useServerFn(getProjectWorkspace);
  const saveDetails = useServerFn(saveProjectDetails);
  const applyTemplate = useServerFn(applyTemplateFn);
  const createTask = useServerFn(createTaskFn);
  const updateTask = useServerFn(updateTaskFn);
  const setTaskStatus = useServerFn(setTaskStatusFn);
  const deleteTask = useServerFn(deleteTaskFn);

  const [tab, setTab] = useState<Tab>("Overview");
  const [draft, setDraft] = useState<{
    name: string;
    status: ProjectStatus;
    summary: string;
    scope: string;
    team: string;
    start_date: string;
    target_date: string;
    timeline: TimelineStep[];
  } | null>(null);

  const workspace = useQuery({
    queryKey: ["admin", "project", id],
    queryFn: () => fetchWorkspace({ data: { id } }),
  });

  const fetchTeamMembers = useServerFn(getTeamMembersFn);
  const teamMembers = useQuery({
    queryKey: ["admin", "team-members"],
    queryFn: () => fetchTeamMembers(),
  });

  useEffect(() => {
    const project = workspace.data?.project;
    if (!project) return;
    setDraft({
      name: project.name,
      status: (project.status as ProjectStatus) ?? "Onboarding",
      summary: project.summary ?? "",
      scope: project.scope ?? "",
      team: project.team.join(", "),
      start_date: project.start_date ?? "",
      target_date: project.target_date ?? "",
      timeline: project.timeline,
    });
  }, [workspace.data?.project]);

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ["admin", "project", id] });
    void queryClient.invalidateQueries({ queryKey: ["admin", "projects"] });
    void queryClient.invalidateQueries({ queryKey: ["admin", "project-analytics"] });
  };

  const saveMutation = useMutation({
    mutationFn: () =>
      saveDetails({
        data: {
          id,
          name: draft!.name,
          status: draft!.status,
          summary: draft!.summary || null,
          scope: draft!.scope || null,
          team: draft!.team
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
          timeline: draft!.timeline,
          start_date: draft!.start_date || null,
          target_date: draft!.target_date || null,
        },
      }),
    onSuccess: () => {
      toast.success("Project tersimpan.");
      invalidate();
    },
    onError: () => toast.error("Gagal menyimpan project."),
  });

  const templateMutation = useMutation({
    mutationFn: (templateId: string) => applyTemplate({ data: { id, templateId } }),
    onSuccess: () => {
      toast.success("Template diterapkan.");
      invalidate();
    },
    onError: () => toast.error("Gagal menerapkan template."),
  });

  const taskCreate = useMutation({
    mutationFn: (input: {
      title: string;
      description: string | null;
      assignee: string | null;
      priority: TaskPriority;
      status: TaskStatus;
      due_date: string | null;
    }) => createTask({ data: { projectId: id, ...input } }),
    onSuccess: () => {
      toast.success("Task dibuat.");
      invalidate();
    },
    onError: () => toast.error("Gagal membuat task."),
  });

  const taskUpdate = useMutation({
    mutationFn: (input: {
      id: string;
      title: string;
      description: string | null;
      assignee: string | null;
      priority: TaskPriority;
      status: TaskStatus;
      due_date: string | null;
      notes: string | null;
    }) => updateTask({ data: input }),
    onSuccess: () => {
      toast.success("Task diperbarui.");
      invalidate();
    },
    onError: () => toast.error("Gagal memperbarui task."),
  });

  const statusMutation = useMutation({
    mutationFn: (input: { id: string; status: TaskStatus }) => setTaskStatus({ data: input }),
    onSuccess: invalidate,
    onError: () => toast.error("Gagal mengubah status task."),
  });

  const removeMutation = useMutation({
    mutationFn: (taskId: string) => deleteTask({ data: { id: taskId } }),
    onSuccess: () => {
      toast.success("Task dihapus.");
      invalidate();
    },
    onError: () => toast.error("Gagal menghapus task (butuh akses admin)."),
  });

  if (workspace.isLoading || !draft) {
    return <p className="text-sm text-muted-foreground">Memuat workspace project…</p>;
  }
  if (workspace.error || !workspace.data) {
    return <p className="text-sm text-destructive">Gagal memuat project.</p>;
  }

  const { project, client, tasks, activities, documents, invoice } = workspace.data;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Link
          to="/admin/projects"
          className="inline-flex items-center gap-2 rounded-xl border border-border/50 px-3 py-1.5 text-xs text-muted-foreground transition hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Semua Project
        </Link>
        {client ? (
          <Link
            to="/admin/clients/$id"
            params={{ id: client.id }}
            className="inline-flex items-center gap-2 rounded-xl border border-border/50 px-3 py-1.5 text-xs text-muted-foreground transition hover:text-foreground"
          >
            Client Workspace <ExternalLink className="h-3.5 w-3.5" />
          </Link>
        ) : null}
      </div>

      <header className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4 sm:flex sm:flex-wrap sm:items-end sm:justify-between">
        <div className="min-w-0">
          <p className="truncate text-[0.65rem] uppercase tracking-[0.2em] text-muted-foreground">
            {client?.name ?? "Klien KERJAKU"}
          </p>
          <h1 className="mt-1 truncate text-xl font-semibold tracking-tight sm:text-2xl">
            {project.name}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {templateMeta(project.template).label} · Fase {project.phase}
          </p>
          {project.team.length > 0 ? (
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <span className="text-[0.65rem] uppercase tracking-[0.18em] text-muted-foreground">
                Tim
              </span>
              {project.team.map((name) => {
                const member = teamMembers.data?.find(
                  (m) => m.name.toLowerCase() === name.toLowerCase(),
                );
                return (
                  <Chip key={name} className={member ? teamRoleClass(member.role) : undefined}>
                    {name}
                    {member ? ` · ${member.role}` : ""}
                  </Chip>
                );
              })}
            </div>
          ) : null}
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <Chip className="border-primary/30 bg-primary/10 text-primary">{project.status}</Chip>
          <Chip className="border-border/60 bg-muted/20 text-muted-foreground">
            {project.progress}%
          </Chip>
        </div>
      </header>

      <div className="flex min-w-0 gap-1 overflow-x-auto rounded-full border border-border/40 bg-card/40 p-1">
        {TABS.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setTab(item)}
            className={cn(
              "shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition",
              tab === item
                ? "bg-primary/20 text-primary"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {item}
          </button>
        ))}
      </div>

      {tab === "Overview" ? (
        <div className="grid gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <SectionCard
            title="Detail Project"
            description="Nama, status, deskripsi, scope, dan tim."
            action={
              <button
                type="button"
                onClick={() => saveMutation.mutate()}
                disabled={saveMutation.isPending}
                className="rounded-xl bg-primary/90 px-3 py-1.5 text-xs font-medium text-primary-foreground disabled:opacity-50"
              >
                Simpan
              </button>
            }
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block sm:col-span-2">
                <span className="text-xs text-muted-foreground">Nama project</span>
                <input
                  className={cn(inputClass, "mt-1")}
                  value={draft.name}
                  onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                />
              </label>
              <label className="block">
                <span className="text-xs text-muted-foreground">Status</span>
                <select
                  className={cn(inputClass, "mt-1")}
                  value={draft.status}
                  onChange={(e) =>
                    setDraft({ ...draft, status: e.target.value as ProjectStatus })
                  }
                >
                  {PROJECT_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </label>
              <div className="block sm:col-span-2">
                <span className="text-xs text-muted-foreground">Tim (pisahkan koma)</span>
                <input
                  className={cn(inputClass, "mt-1")}
                  value={draft.team}
                  placeholder="Adji, Designer, QA"
                  onChange={(e) => setDraft({ ...draft, team: e.target.value })}
                />
                {teamMembers.data && teamMembers.data.length > 0 ? (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {teamMembers.data.map((member) => {
                      const names = draft.team
                        .split(",")
                        .map((s) => s.trim())
                        .filter(Boolean);
                      const assigned = names.some(
                        (n) => n.toLowerCase() === member.name.toLowerCase(),
                      );
                      return (
                        <button
                          key={member.id}
                          type="button"
                          onClick={() =>
                            setDraft({
                              ...draft,
                              team: (assigned
                                ? names.filter(
                                    (n) => n.toLowerCase() !== member.name.toLowerCase(),
                                  )
                                : [...names, member.name]
                              ).join(", "),
                            })
                          }
                          className={cn(
                            "rounded-full border px-2.5 py-1 text-[0.7rem] transition",
                            assigned
                              ? teamRoleClass(member.role)
                              : "border-border/50 bg-background/30 text-muted-foreground hover:text-foreground",
                          )}
                        >
                          {member.name} · {member.role}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <Link to="/admin/team" className="mt-2 inline-block text-xs text-primary hover:underline">
                    Tambah anggota tim
                  </Link>
                )}
              </div>

              <label className="block">
                <span className="text-xs text-muted-foreground">Mulai</span>
                <input
                  type="date"
                  className={cn(inputClass, "mt-1")}
                  value={draft.start_date}
                  onChange={(e) => setDraft({ ...draft, start_date: e.target.value })}
                />
              </label>
              <label className="block">
                <span className="text-xs text-muted-foreground">Target selesai</span>
                <input
                  type="date"
                  className={cn(inputClass, "mt-1")}
                  value={draft.target_date}
                  onChange={(e) => setDraft({ ...draft, target_date: e.target.value })}
                />
              </label>
              <label className="block sm:col-span-2">
                <span className="text-xs text-muted-foreground">Deskripsi</span>
                <textarea
                  rows={3}
                  className={cn(inputClass, "mt-1")}
                  value={draft.summary}
                  onChange={(e) => setDraft({ ...draft, summary: e.target.value })}
                />
              </label>
              <label className="block sm:col-span-2">
                <span className="text-xs text-muted-foreground">Scope of work</span>
                <textarea
                  rows={5}
                  className={cn(inputClass, "mt-1")}
                  value={draft.scope}
                  onChange={(e) => setDraft({ ...draft, scope: e.target.value })}
                />
              </label>
            </div>
          </SectionCard>

          <div className="min-w-0 space-y-4">
            <SectionCard title="Informasi Klien">
              {client ? (
                <dl className="space-y-2 text-sm">
                  <Row label="Nama" value={client.name} />
                  <Row label="Perusahaan" value={client.company ?? "—"} />
                  <Row label="Email" value={client.email || "—"} />
                  <Row label="WhatsApp" value={client.whatsapp ?? "—"} />
                  <Row label="Paket" value={client.package ?? "—"} />
                  <Row label="Status" value={client.status} />
                </dl>
              ) : (
                <p className="text-xs text-muted-foreground">Data klien tidak ditemukan.</p>
              )}
              {client?.portal_token ? (
                <a
                  href={`/portal/${client.portal_token}`}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-3 inline-flex items-center gap-2 rounded-xl border border-border/50 px-3 py-1.5 text-xs text-muted-foreground transition hover:text-foreground"
                >
                  Buka Client Portal <ExternalLink className="h-3.5 w-3.5" />
                </a>
              ) : null}
            </SectionCard>

            {invoice ? (
              <SectionCard title="Pembayaran">
                <p className="text-sm text-foreground">{invoice.number}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {formatMoney(Number(invoice.amount) || 0, invoice.currency ?? "IDR")} ·{" "}
                  {invoice.status}
                </p>
              </SectionCard>
            ) : null}

            <SectionCard title="Template Delivery" description="Terapkan alur milestone standar.">
              <div className="space-y-2">
                {PROJECT_TEMPLATES.map((template) => (
                  <button
                    key={template.id}
                    type="button"
                    onClick={() => templateMutation.mutate(template.id)}
                    disabled={templateMutation.isPending}
                    className={cn(
                      "w-full rounded-2xl border p-3 text-left transition disabled:opacity-50",
                      project.template === template.id
                        ? "border-primary/40 bg-primary/10"
                        : "border-border/40 bg-card/30 hover:border-primary/30",
                    )}
                  >
                    <p className="truncate text-sm font-medium text-foreground">{template.label}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{template.description}</p>
                  </button>
                ))}
              </div>
            </SectionCard>
          </div>
        </div>
      ) : null}

      {tab === "Timeline" ? (
        <SectionCard
          title="Timeline & Milestones"
          description="Centang milestone yang selesai untuk memperbarui progres."
          action={
            <button
              type="button"
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending}
              className="rounded-xl bg-primary/90 px-3 py-1.5 text-xs font-medium text-primary-foreground disabled:opacity-50"
            >
              Simpan
            </button>
          }
        >
          <div className="mb-4 grid gap-3 sm:grid-cols-2">
            <Row label="Mulai" value={formatDate(project.start_date)} />
            <Row label="Target selesai" value={formatDate(project.target_date)} />
          </div>
          <ol className="space-y-2">
            {draft.timeline.map((step, index) => (
              <li
                key={`${step.title}-${index}`}
                className="rounded-2xl border border-border/40 bg-card/30 p-3"
              >
                <div className="grid grid-cols-[auto_minmax(0,1fr)] items-start gap-3">
                  <input
                    type="checkbox"
                    className="mt-1 h-4 w-4 shrink-0 accent-current"
                    checked={step.done}
                    onChange={(e) => {
                      const timeline = draft.timeline.map((s, i) =>
                        i === index ? { ...s, done: e.target.checked } : s,
                      );
                      setDraft({ ...draft, timeline });
                    }}
                  />
                  <div className="min-w-0">
                    <input
                      className={cn(inputClass, "font-medium")}
                      value={step.title}
                      onChange={(e) => {
                        const timeline = draft.timeline.map((s, i) =>
                          i === index ? { ...s, title: e.target.value } : s,
                        );
                        setDraft({ ...draft, timeline });
                      }}
                    />
                    <input
                      className={cn(inputClass, "mt-2 text-xs")}
                      value={step.detail}
                      onChange={(e) => {
                        const timeline = draft.timeline.map((s, i) =>
                          i === index ? { ...s, detail: e.target.value } : s,
                        );
                        setDraft({ ...draft, timeline });
                      }}
                    />
                    {step.approved ? (
                      <Chip className="mt-2 border-primary/30 bg-primary/10 text-primary">
                        Disetujui klien
                      </Chip>
                    ) : null}
                  </div>
                </div>
              </li>
            ))}
          </ol>
          <button
            type="button"
            onClick={() =>
              setDraft({
                ...draft,
                timeline: [
                  ...draft.timeline,
                  { title: "Milestone baru", detail: "", done: false, date: null },
                ],
              })
            }
            className="mt-3 inline-flex items-center gap-2 rounded-xl border border-border/50 px-3 py-1.5 text-xs text-muted-foreground transition hover:text-foreground"
          >
            <Plus className="h-3.5 w-3.5" /> Tambah milestone
          </button>
        </SectionCard>
      ) : null}

      {tab === "Tasks" ? (
        <TasksPanel
          tasks={tasks}
          onCreate={(input) => taskCreate.mutate(input)}
          onUpdate={(input) => taskUpdate.mutate(input)}
          onStatus={(input) => statusMutation.mutate(input)}
          onDelete={(taskId) => removeMutation.mutate(taskId)}
          busy={taskCreate.isPending || taskUpdate.isPending}
        />
      ) : null}

      {tab === "Files" ? (
        <SectionCard title="Files & Deliverables" description="Dokumen project dan klien.">
          {documents.length === 0 ? (
            <p className="text-xs text-muted-foreground">Belum ada dokumen.</p>
          ) : (
            <ul className="space-y-2">
              {documents.map((doc) => (
                <li key={doc.id} className="flex items-center gap-2 text-sm">
                  <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                  {doc.url ? (
                    <a
                      href={doc.url}
                      target="_blank"
                      rel="noreferrer"
                      className="min-w-0 flex-1 truncate underline"
                    >
                      {doc.title}
                    </a>
                  ) : (
                    <span className="min-w-0 flex-1 truncate">{doc.title}</span>
                  )}
                  <Chip className="shrink-0 border-border/60 bg-muted/20 text-muted-foreground">
                    {doc.kind}
                  </Chip>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>
      ) : null}

      {tab === "Activity" ? (
        <SectionCard title="Activity History" description="Perubahan status, update, dan komentar.">
          {activities.length === 0 ? (
            <p className="text-xs text-muted-foreground">Belum ada aktivitas.</p>
          ) : (
            <ol className="space-y-3">
              {activities.map((item) => (
                <li key={item.id} className="border-l border-border/50 pl-3">
                  <p className="text-sm text-foreground">{item.action}</p>
                  {item.detail ? (
                    <p className="text-xs text-muted-foreground">{item.detail}</p>
                  ) : null}
                  <p className="mt-0.5 text-[0.65rem] uppercase tracking-[0.15em] text-muted-foreground">
                    {item.actor} · {formatDate(item.created_at)}
                  </p>
                </li>
              ))}
            </ol>
          )}
        </SectionCard>
      ) : null}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-3">
      <span className="truncate text-xs text-muted-foreground">{label}</span>
      <span className="min-w-0 truncate text-sm text-foreground">{value}</span>
    </div>
  );
}

type TaskRow = {
  id: string;
  title: string;
  description: string | null;
  assignee: string | null;
  priority: string;
  status: string;
  due_date: string | null;
  notes: string | null;
};

function TasksPanel({
  tasks,
  onCreate,
  onUpdate,
  onStatus,
  onDelete,
  busy,
}: {
  tasks: TaskRow[];
  onCreate: (input: {
    title: string;
    description: string | null;
    assignee: string | null;
    priority: TaskPriority;
    status: TaskStatus;
    due_date: string | null;
  }) => void;
  onUpdate: (input: {
    id: string;
    title: string;
    description: string | null;
    assignee: string | null;
    priority: TaskPriority;
    status: TaskStatus;
    due_date: string | null;
    notes: string | null;
  }) => void;
  onStatus: (input: { id: string; status: TaskStatus }) => void;
  onDelete: (id: string) => void;
  busy: boolean;
}) {
  const [title, setTitle] = useState("");
  const [assignee, setAssignee] = useState("");
  const [priority, setPriority] = useState<TaskPriority>("Medium");
  const [due, setDue] = useState("");
  const [description, setDescription] = useState("");
  const [editing, setEditing] = useState<TaskRow | null>(null);

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
      <SectionCard title="Task List" description={`${tasks.length} task`}>
        {tasks.length === 0 ? (
          <p className="text-xs text-muted-foreground">Belum ada task.</p>
        ) : (
          <ul className="space-y-2">
            {tasks.map((task) => (
              <li key={task.id} className="rounded-2xl border border-border/40 bg-card/30 p-3">
                <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">{task.title}</p>
                    {task.description ? (
                      <p className="mt-0.5 text-xs text-muted-foreground">{task.description}</p>
                    ) : null}
                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                      <Chip className={taskPriorityClass(task.priority)}>{task.priority}</Chip>
                      <Chip className={taskStatusClass(task.status)}>{task.status}</Chip>
                      <Chip className="border-border/60 bg-muted/20 text-muted-foreground">
                        {task.assignee?.trim() || "Belum ditugaskan"}
                      </Chip>
                      <Chip className="border-border/60 bg-muted/20 text-muted-foreground">
                        Due {formatDate(task.due_date)}
                      </Chip>
                    </div>
                    {task.notes ? (
                      <p className="mt-2 whitespace-pre-wrap text-xs text-muted-foreground">
                        {task.notes}
                      </p>
                    ) : null}
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-2">
                    <select
                      className="rounded-xl border border-border/50 bg-background/40 px-2 py-1 text-xs outline-none"
                      value={task.status}
                      onChange={(e) =>
                        onStatus({ id: task.id, status: e.target.value as TaskStatus })
                      }
                    >
                      {TASK_STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => setEditing(task)}
                        className="rounded-lg border border-border/50 px-2 py-1 text-[0.65rem] text-muted-foreground transition hover:text-foreground"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        aria-label="Hapus task"
                        onClick={() => onDelete(task.id)}
                        className="grid h-6 w-6 place-items-center rounded-lg border border-border/50 text-muted-foreground transition hover:text-destructive"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                </div>

                {editing?.id === task.id ? (
                  <EditTaskForm
                    task={editing}
                    onCancel={() => setEditing(null)}
                    onSave={(input) => {
                      onUpdate(input);
                      setEditing(null);
                    }}
                  />
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </SectionCard>

      <GlassCard className="h-fit">
        <p className="text-sm font-medium text-foreground">Task Baru</p>
        <div className="mt-3 space-y-2">
          <input
            className={inputClass}
            placeholder="Judul task"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <textarea
            rows={2}
            className={inputClass}
            placeholder="Deskripsi"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <input
            className={inputClass}
            placeholder="Assignee"
            value={assignee}
            onChange={(e) => setAssignee(e.target.value)}
          />
          <div className="grid grid-cols-2 gap-2">
            <select
              className={inputClass}
              value={priority}
              onChange={(e) => setPriority(e.target.value as TaskPriority)}
            >
              {TASK_PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
            <input
              type="date"
              className={inputClass}
              value={due}
              onChange={(e) => setDue(e.target.value)}
            />
          </div>
          <button
            type="button"
            disabled={!title.trim() || busy}
            onClick={() => {
              onCreate({
                title: title.trim(),
                description: description.trim() || null,
                assignee: assignee.trim() || null,
                priority,
                status: "Todo",
                due_date: due || null,
              });
              setTitle("");
              setDescription("");
              setDue("");
            }}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary/90 px-3 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
          >
            <Plus className="h-4 w-4" /> Tambah Task
          </button>
        </div>
      </GlassCard>
    </div>
  );
}

function EditTaskForm({
  task,
  onSave,
  onCancel,
}: {
  task: TaskRow;
  onSave: (input: {
    id: string;
    title: string;
    description: string | null;
    assignee: string | null;
    priority: TaskPriority;
    status: TaskStatus;
    due_date: string | null;
    notes: string | null;
  }) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState({
    title: task.title,
    description: task.description ?? "",
    assignee: task.assignee ?? "",
    priority: task.priority as TaskPriority,
    status: task.status as TaskStatus,
    due_date: task.due_date ?? "",
    notes: task.notes ?? "",
  });

  return (
    <div className="mt-3 space-y-2 border-t border-border/40 pt-3">
      <input
        className={inputClass}
        value={form.title}
        onChange={(e) => setForm({ ...form, title: e.target.value })}
      />
      <textarea
        rows={2}
        className={inputClass}
        placeholder="Deskripsi"
        value={form.description}
        onChange={(e) => setForm({ ...form, description: e.target.value })}
      />
      <div className="grid gap-2 sm:grid-cols-2">
        <input
          className={inputClass}
          placeholder="Assignee"
          value={form.assignee}
          onChange={(e) => setForm({ ...form, assignee: e.target.value })}
        />
        <input
          type="date"
          className={inputClass}
          value={form.due_date}
          onChange={(e) => setForm({ ...form, due_date: e.target.value })}
        />
        <select
          className={inputClass}
          value={form.priority}
          onChange={(e) => setForm({ ...form, priority: e.target.value as TaskPriority })}
        >
          {TASK_PRIORITIES.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
        <select
          className={inputClass}
          value={form.status}
          onChange={(e) => setForm({ ...form, status: e.target.value as TaskStatus })}
        >
          {TASK_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>
      <textarea
        rows={2}
        className={inputClass}
        placeholder="Catatan internal"
        value={form.notes}
        onChange={(e) => setForm({ ...form, notes: e.target.value })}
      />
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() =>
            onSave({
              id: task.id,
              title: form.title,
              description: form.description || null,
              assignee: form.assignee || null,
              priority: form.priority,
              status: form.status,
              due_date: form.due_date || null,
              notes: form.notes || null,
            })
          }
          className="rounded-xl bg-primary/90 px-3 py-1.5 text-xs font-medium text-primary-foreground"
        >
          Simpan Task
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-xl border border-border/50 px-3 py-1.5 text-xs text-muted-foreground"
        >
          Batal
        </button>
      </div>
    </div>
  );
}
