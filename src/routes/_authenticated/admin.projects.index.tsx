import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  FolderKanban,
  Gauge,
  Users,
} from "lucide-react";
import { useMemo, useState } from "react";

import { BarRows, Chip, GlassCard, MetricTile, SectionCard } from "@/components/admin/ui";
import {
  deadlineTone,
  formatDate,
  templateMeta,
} from "@/lib/admin/projects";
import { getProjectAnalytics, getProjectBoard } from "@/lib/projects.functions";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/admin/projects/")({
  component: ProjectsDashboard,
});

const FILTERS = ["Active", "Completed", "All"] as const;

function ProjectsDashboard() {
  const fetchBoard = useServerFn(getProjectBoard);
  const fetchAnalytics = useServerFn(getProjectAnalytics);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("Active");

  const board = useQuery({ queryKey: ["admin", "projects"], queryFn: () => fetchBoard() });
  const analytics = useQuery({
    queryKey: ["admin", "project-analytics"],
    queryFn: () => fetchAnalytics(),
  });

  const projects = useMemo(() => {
    const rows = board.data ?? [];
    if (filter === "All") return rows;
    if (filter === "Completed") return rows.filter((p) => p.status === "Completed");
    return rows.filter((p) => p.status !== "Completed");
  }, [board.data, filter]);

  return (
    <div className="space-y-6">
      <header className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4 sm:flex sm:flex-wrap sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h1 className="truncate text-xl font-semibold tracking-tight sm:text-2xl">
            Project Delivery
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Eksekusi project setelah pembayaran: progres, milestone, task, dan deadline.
          </p>
        </div>
        <div className="flex shrink-0 gap-1 rounded-full border border-border/40 bg-card/40 p-1">
          {FILTERS.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setFilter(item)}
              className={cn(
                "rounded-full px-3 py-1 text-xs font-medium transition",
                filter === item
                  ? "bg-primary/20 text-primary"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {item}
            </button>
          ))}
        </div>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <MetricTile
          label="Active"
          value={analytics.data?.active ?? 0}
          icon={FolderKanban}
          tone="primary"
        />
        <MetricTile label="Completed" value={analytics.data?.completed ?? 0} icon={CheckCircle2} />
        <MetricTile
          label="Delayed"
          value={analytics.data?.delayed ?? 0}
          icon={AlertTriangle}
          tone="hot"
        />
        <MetricTile
          label="Avg Progress"
          value={`${analytics.data?.averageProgress ?? 0}%`}
          icon={Gauge}
        />
        <MetricTile
          label="Avg Completion"
          value={`${analytics.data?.averageCompletionDays ?? 0} hari`}
          icon={CalendarClock}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="min-w-0 space-y-3">
          {board.isLoading ? (
            <p className="text-sm text-muted-foreground">Memuat project…</p>
          ) : board.error ? (
            <p className="text-sm text-destructive">Gagal memuat project.</p>
          ) : projects.length === 0 ? (
            <GlassCard>
              <p className="text-sm text-muted-foreground">
                Belum ada project. Project dibuat otomatis saat invoice ditandai lunas.
              </p>
            </GlassCard>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {projects.map((project) => {
                const tone = deadlineTone(project.target_date, project.status);
                return (
                  <Link
                    key={project.id}
                    to="/admin/projects/$id"
                    params={{ id: project.id }}
                    className="block rounded-3xl border border-border/40 bg-card/40 p-5 shadow-lg backdrop-blur-xl transition hover:border-primary/40"
                  >
                    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-[0.65rem] uppercase tracking-[0.2em] text-muted-foreground">
                          {project.client_name}
                        </p>
                        <p className="mt-1 truncate text-sm font-medium text-foreground">
                          {project.name}
                        </p>
                      </div>
                      <Chip className="shrink-0 border-border/60 bg-secondary/40 text-secondary-foreground">
                        {project.status}
                      </Chip>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {project.client_package ? (
                        <Chip className="border-primary/30 bg-primary/10 text-primary">
                          {project.client_package}
                        </Chip>
                      ) : null}
                      <Chip className="border-border/60 bg-muted/20 text-muted-foreground">
                        {templateMeta(project.template).label}
                      </Chip>
                    </div>

                    <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-muted/25">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-primary/80 to-primary/40"
                        style={{ width: `${project.progress}%` }}
                      />
                    </div>
                    <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                      <span>{project.progress}% · {project.phase}</span>
                      <span
                        className={cn(
                          tone === "late"
                            ? "text-destructive"
                            : tone === "soon"
                              ? "text-amber-300"
                              : "text-muted-foreground",
                        )}
                      >
                        Deadline {formatDate(project.target_date)}
                      </span>
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {project.open_tasks} task terbuka dari {project.total_tasks}
                    </p>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        <div className="min-w-0 space-y-4">
          <SectionCard title="Upcoming Deadlines" description="Target 30 hari ke depan">
            {(analytics.data?.upcoming ?? []).length === 0 ? (
              <p className="text-xs text-muted-foreground">Tidak ada deadline terdekat.</p>
            ) : (
              <ul className="space-y-2.5">
                {analytics.data!.upcoming.map((item) => (
                  <li key={item.id} className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <Link
                        to="/admin/projects/$id"
                        params={{ id: item.id }}
                        className="block truncate text-sm text-foreground hover:text-primary"
                      >
                        {item.name}
                      </Link>
                      <p className="truncate text-xs text-muted-foreground">{item.client}</p>
                    </div>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {item.days} hari
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>

          <SectionCard title="Team Workload" description="Task aktif per penanggung jawab">
            <BarRows items={analytics.data?.workload ?? []} empty="Belum ada task aktif" />
          </SectionCard>

          <SectionCard title="Client Status" description="Distribusi status project">
            <BarRows items={analytics.data?.byStatus ?? []} empty="Belum ada project" />
          </SectionCard>

          <GlassCard className="flex items-center gap-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary/15 text-primary">
              <Users className="h-4 w-4" />
            </span>
            <p className="min-w-0 text-xs text-muted-foreground">
              Project otomatis dibuat dari invoice lunas — tidak ada duplikasi data klien.
            </p>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
