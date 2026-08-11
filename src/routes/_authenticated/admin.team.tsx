import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import {
  AlertTriangle,
  CheckCircle2,
  FolderKanban,
  Pencil,
  Plus,
  Trash2,
  UserCheck,
  Users,
  X,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Chip, GlassCard, MetricTile, SectionCard } from "@/components/admin/ui";
import { formatDate } from "@/lib/admin/projects";
import {
  initials,
  TEAM_ROLES,
  teamRoleClass,
  workloadClass,
  workloadLabel,
  type TeamRole,
} from "@/lib/admin/team";
import {
  createTeamMemberFn,
  deleteTeamMemberFn,
  getTeamWorkspace,
  updateTeamMemberFn,
} from "@/lib/team.functions";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/admin/team")({
  component: TeamPage,
});

const inputClass =
  "w-full rounded-xl border border-border/50 bg-background/40 px-3 py-2 text-sm outline-none transition focus:border-primary/60";

type Draft = {
  id: string | null;
  name: string;
  email: string;
  role: TeamRole;
  avatar_url: string;
  title: string;
  active: boolean;
  capacity: number;
  notes: string;
};

const emptyDraft: Draft = {
  id: null,
  name: "",
  email: "",
  role: "Developer",
  avatar_url: "",
  title: "",
  active: true,
  capacity: 6,
  notes: "",
};

function Avatar({ name, url }: { name: string; url: string | null }) {
  if (url) {
    return (
      <img
        src={url}
        alt={name}
        loading="lazy"
        className="h-11 w-11 shrink-0 rounded-2xl border border-border/50 object-cover"
      />
    );
  }
  return (
    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-border/50 bg-primary/15 text-sm font-semibold text-primary">
      {initials(name)}
    </span>
  );
}

function TeamPage() {
  const queryClient = useQueryClient();
  const fetchWorkspace = useServerFn(getTeamWorkspace);
  const createMember = useServerFn(createTeamMemberFn);
  const updateMember = useServerFn(updateTeamMemberFn);
  const removeMember = useServerFn(deleteTeamMemberFn);

  const [draft, setDraft] = useState<Draft | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);

  const workspace = useQuery({
    queryKey: ["admin", "team"],
    queryFn: () => fetchWorkspace(),
  });

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ["admin", "team"] });
  };

  const payload = (d: Draft) => ({
    name: d.name.trim(),
    email: d.email.trim(),
    role: d.role,
    avatar_url: d.avatar_url.trim() || null,
    title: d.title.trim() || null,
    active: d.active,
    capacity: Number(d.capacity) || 6,
    notes: d.notes.trim() || null,
  });

  const saveMutation = useMutation({
    mutationFn: (d: Draft) =>
      d.id
        ? updateMember({ data: { id: d.id, ...payload(d) } })
        : createMember({ data: payload(d) }),
    onSuccess: () => {
      toast.success("Team member tersimpan.");
      setDraft(null);
      invalidate();
    },
    onError: () => toast.error("Gagal menyimpan. Hanya Owner/Admin yang bisa mengelola tim."),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => removeMember({ data: { id } }),
    onSuccess: () => {
      toast.success("Team member dihapus.");
      invalidate();
    },
    onError: () => toast.error("Gagal menghapus member."),
  });

  const summary = workspace.data?.summary;
  const members = workspace.data?.members ?? [];

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
        <div className="min-w-0">
          <h1 className="truncate text-xl font-semibold tracking-tight">Team Management</h1>
          <p className="mt-1 text-xs text-muted-foreground">
            Kelola anggota tim, penugasan project, dan distribusi beban kerja.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setDraft({ ...emptyDraft })}
          className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-primary/40 bg-primary/15 px-3 py-2 text-xs font-medium text-primary transition hover:bg-primary/25"
        >
          <Plus className="h-4 w-4" /> Tambah member
        </button>
      </div>

      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
        <MetricTile label="Total members" value={summary?.total ?? 0} icon={Users} />
        <MetricTile
          label="Active members"
          value={summary?.active ?? 0}
          icon={UserCheck}
          tone="primary"
          hint={`rata-rata ${summary?.avg_workload ?? 0}% workload`}
        />
        <MetricTile
          label="Projects / member"
          value={summary?.avg_projects ?? 0}
          icon={FolderKanban}
          hint={`${summary?.assigned_projects ?? 0} project ter-assign`}
        />
        <MetricTile
          label="Overloaded"
          value={summary?.overloaded ?? 0}
          icon={AlertTriangle}
          tone={summary?.overloaded ? "hot" : "default"}
          hint={`${summary?.unassigned_projects ?? 0} project tanpa tim`}
        />
      </div>

      {draft ? (
        <SectionCard
          title={draft.id ? "Edit team member" : "Team member baru"}
          description="Nama harus sama dengan nama yang dipakai pada assignment project & task."
          action={
            <button
              type="button"
              onClick={() => setDraft(null)}
              className="grid h-8 w-8 place-items-center rounded-xl border border-border/50 text-muted-foreground transition hover:text-foreground"
              aria-label="Tutup form"
            >
              <X className="h-4 w-4" />
            </button>
          }
        >
          <form
            className="grid gap-3 sm:grid-cols-2"
            onSubmit={(e) => {
              e.preventDefault();
              if (!draft.name.trim() || !draft.email.trim()) {
                toast.error("Nama dan email wajib diisi.");
                return;
              }
              saveMutation.mutate(draft);
            }}
          >
            <label className="block">
              <span className="text-xs text-muted-foreground">Nama</span>
              <input
                className={cn(inputClass, "mt-1")}
                value={draft.name}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              />
            </label>
            <label className="block">
              <span className="text-xs text-muted-foreground">Email</span>
              <input
                type="email"
                className={cn(inputClass, "mt-1")}
                value={draft.email}
                onChange={(e) => setDraft({ ...draft, email: e.target.value })}
              />
            </label>
            <label className="block">
              <span className="text-xs text-muted-foreground">Role</span>
              <select
                className={cn(inputClass, "mt-1")}
                value={draft.role}
                onChange={(e) => setDraft({ ...draft, role: e.target.value as TeamRole })}
              >
                {TEAM_ROLES.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="text-xs text-muted-foreground">Jabatan (opsional)</span>
              <input
                className={cn(inputClass, "mt-1")}
                value={draft.title}
                placeholder="Fullstack Engineer"
                onChange={(e) => setDraft({ ...draft, title: e.target.value })}
              />
            </label>
            <label className="block sm:col-span-2">
              <span className="text-xs text-muted-foreground">Avatar URL (opsional)</span>
              <input
                className={cn(inputClass, "mt-1")}
                value={draft.avatar_url}
                placeholder="https://..."
                onChange={(e) => setDraft({ ...draft, avatar_url: e.target.value })}
              />
            </label>
            <label className="block">
              <span className="text-xs text-muted-foreground">Kapasitas task aktif</span>
              <input
                type="number"
                min={1}
                max={50}
                className={cn(inputClass, "mt-1")}
                value={draft.capacity}
                onChange={(e) => setDraft({ ...draft, capacity: Number(e.target.value) })}
              />
            </label>
            <label className="flex items-center gap-2 pt-6 text-sm">
              <input
                type="checkbox"
                checked={draft.active}
                onChange={(e) => setDraft({ ...draft, active: e.target.checked })}
              />
              <span className="text-muted-foreground">Member aktif</span>
            </label>
            <label className="block sm:col-span-2">
              <span className="text-xs text-muted-foreground">Catatan</span>
              <textarea
                rows={2}
                className={cn(inputClass, "mt-1")}
                value={draft.notes}
                onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
              />
            </label>
            <div className="sm:col-span-2">
              <button
                type="submit"
                disabled={saveMutation.isPending}
                className="rounded-xl border border-primary/40 bg-primary/15 px-4 py-2 text-xs font-medium text-primary transition hover:bg-primary/25 disabled:opacity-60"
              >
                {saveMutation.isPending ? "Menyimpan…" : "Simpan member"}
              </button>
            </div>
          </form>
        </SectionCard>
      ) : null}

      {workspace.isLoading ? (
        <GlassCard>
          <p className="text-sm text-muted-foreground">Memuat tim…</p>
        </GlassCard>
      ) : members.length === 0 ? (
        <GlassCard>
          <p className="text-sm text-muted-foreground">
            Belum ada anggota tim. Tambahkan member pertama untuk mulai membagi project.
          </p>
        </GlassCard>
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          {members.map((member) => {
            const open = openId === member.id;
            return (
              <GlassCard key={member.id} className="space-y-4">
                <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-start gap-3">
                  <Avatar name={member.name} url={member.avatar_url} />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">{member.name}</p>
                    <p className="truncate text-xs text-muted-foreground">{member.email}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                      <Chip className={teamRoleClass(member.role)}>{member.role}</Chip>
                      {member.title ? <Chip>{member.title}</Chip> : null}
                      <Chip
                        className={
                          member.active
                            ? "border-primary/30 bg-primary/10 text-primary"
                            : "border-border/60 bg-muted/40 text-muted-foreground"
                        }
                      >
                        {member.active ? "Active" : "Inactive"}
                      </Chip>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      type="button"
                      aria-label={`Edit ${member.name}`}
                      onClick={() =>
                        setDraft({
                          id: member.id,
                          name: member.name,
                          email: member.email,
                          role: (TEAM_ROLES as readonly string[]).includes(member.role)
                            ? (member.role as TeamRole)
                            : "Developer",
                          avatar_url: member.avatar_url ?? "",
                          title: member.title ?? "",
                          active: member.active,
                          capacity: member.capacity,
                          notes: member.notes ?? "",
                        })
                      }
                      className="grid h-8 w-8 place-items-center rounded-xl border border-border/50 text-muted-foreground transition hover:text-foreground"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      aria-label={`Hapus ${member.name}`}
                      onClick={() => {
                        if (confirm(`Hapus ${member.name} dari tim?`)) {
                          deleteMutation.mutate(member.id);
                        }
                      }}
                      className="grid h-8 w-8 place-items-center rounded-xl border border-border/50 text-muted-foreground transition hover:text-destructive"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">
                      Workload · {member.open_tasks}/{member.capacity} task aktif
                    </span>
                    <span className="font-medium text-foreground">
                      {member.workload}% · {workloadLabel(member.workload)}
                    </span>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted/30">
                    <div
                      className={cn("h-full rounded-full", workloadClass(member.workload))}
                      style={{ width: `${Math.min(100, member.workload)}%` }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="rounded-2xl border border-border/40 bg-background/30 px-3 py-2">
                    <p className="text-[0.6rem] uppercase tracking-[0.18em] text-muted-foreground">
                      Active projects
                    </p>
                    <p className="mt-1 text-lg font-semibold">{member.projects.length}</p>
                  </div>
                  <div className="rounded-2xl border border-border/40 bg-background/30 px-3 py-2">
                    <p className="text-[0.6rem] uppercase tracking-[0.18em] text-muted-foreground">
                      Assigned tasks
                    </p>
                    <p className="mt-1 text-lg font-semibold">{member.tasks.length}</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setOpenId(open ? null : member.id)}
                  className="text-xs font-medium text-primary transition hover:text-primary/80"
                >
                  {open ? "Sembunyikan detail" : "Lihat detail member"}
                </button>

                {open ? (
                  <div className="space-y-4 border-t border-border/40 pt-4">
                    <div>
                      <p className="text-[0.65rem] uppercase tracking-[0.18em] text-muted-foreground">
                        Active projects
                      </p>
                      <div className="mt-2 space-y-1.5">
                        {member.projects.length === 0 ? (
                          <p className="text-xs text-muted-foreground">Belum ada project.</p>
                        ) : (
                          member.projects.map((project) => (
                            <Link
                              key={project.id}
                              to="/admin/projects/$id"
                              params={{ id: project.id }}
                              className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 rounded-xl border border-border/40 bg-background/30 px-3 py-2 text-xs transition hover:border-primary/40"
                            >
                              <span className="truncate">{project.name}</span>
                              <span className="shrink-0 text-muted-foreground">
                                {project.status} · {formatDate(project.target_date)}
                              </span>
                            </Link>
                          ))
                        )}
                      </div>
                    </div>

                    <div>
                      <p className="text-[0.65rem] uppercase tracking-[0.18em] text-muted-foreground">
                        Assigned tasks
                      </p>
                      <div className="mt-2 space-y-1.5">
                        {member.tasks.length === 0 ? (
                          <p className="text-xs text-muted-foreground">Belum ada task.</p>
                        ) : (
                          member.tasks.slice(0, 6).map((task) => (
                            <div
                              key={task.id}
                              className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 rounded-xl border border-border/40 bg-background/30 px-3 py-2 text-xs"
                            >
                              <CheckCircle2
                                className={cn(
                                  "h-3.5 w-3.5 shrink-0",
                                  task.status === "Completed"
                                    ? "text-primary"
                                    : "text-muted-foreground",
                                )}
                              />
                              <span className="truncate">
                                {task.title}
                                <span className="text-muted-foreground"> · {task.project_name}</span>
                              </span>
                              <span className="shrink-0 text-muted-foreground">{task.status}</span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    <div>
                      <p className="text-[0.65rem] uppercase tracking-[0.18em] text-muted-foreground">
                        Recent activity
                      </p>
                      <div className="mt-2 space-y-1.5">
                        {member.activity.length === 0 ? (
                          <p className="text-xs text-muted-foreground">Belum ada aktivitas.</p>
                        ) : (
                          member.activity.map((item) => (
                            <div key={item.id} className="text-xs text-muted-foreground">
                              <span className="text-foreground">{item.action}</span>
                              {item.detail ? ` — ${item.detail}` : ""}
                              <span className="ml-1 opacity-70">
                                · {formatDate(item.created_at)}
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    {member.notes ? (
                      <p className="text-xs text-muted-foreground">{member.notes}</p>
                    ) : null}
                  </div>
                ) : null}
              </GlassCard>
            );
          })}
        </div>
      )}

      <SectionCard
        title="Workload distribution"
        description="Perbandingan beban kerja antar member aktif."
      >
        {members.filter((m) => m.active).length === 0 ? (
          <p className="text-xs text-muted-foreground">Belum ada member aktif.</p>
        ) : (
          <div className="space-y-3">
            {members
              .filter((m) => m.active)
              .sort((a, b) => b.workload - a.workload)
              .map((member) => (
                <div key={member.id} className="grid grid-cols-[minmax(0,7rem)_1fr_auto] items-center gap-3">
                  <span className="truncate text-xs text-muted-foreground">{member.name}</span>
                  <div className="h-2 overflow-hidden rounded-full bg-muted/30">
                    <div
                      className={cn("h-full rounded-full", workloadClass(member.workload))}
                      style={{ width: `${Math.min(100, member.workload)}%` }}
                    />
                  </div>
                  <span className="shrink-0 text-xs font-medium">{member.workload}%</span>
                </div>
              ))}
          </div>
        )}
      </SectionCard>
    </div>
  );
}
