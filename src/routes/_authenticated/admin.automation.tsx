import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AlarmClock, CheckCircle2, RefreshCw, Workflow, X, Zap } from "lucide-react";
import { useMemo, useState } from "react";

import { GlassCard, MetricTile, SectionCard } from "@/components/admin/ui";
import {
  getAutomationCenter,
  runAutomationScan,
  setAutomationRule,
  setAutomationTaskStatus,
} from "@/lib/automation.functions";
import {
  AUTOMATION_CATEGORIES,
  CATEGORY_DESCRIPTIONS,
  CATEGORY_LABELS,
  isOverdue,
  logStatusClass,
  priorityClass,
  relativeDue,
  ruleCategory,
  type AutomationCategory,
} from "@/lib/automation/rules";
import { canManageBusiness, canWorkLeads, isWorkspaceRole } from "@/lib/admin/roles";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/admin/automation")({
  head: () => ({
    meta: [
      { title: "Automation Engine — KERJAKU Business OS" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AutomationPage,
});

function fmt(value: string): string {
  return new Date(value).toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function AutomationPage() {
  const queryClient = useQueryClient();
  const load = useServerFn(getAutomationCenter);
  const saveRule = useServerFn(setAutomationRule);
  const saveTask = useServerFn(setAutomationTaskStatus);
  const scan = useServerFn(runAutomationScan);
  const [tab, setTab] = useState<"tasks" | "rules" | "logs">("tasks");
  const [notice, setNotice] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["automation-center"],
    queryFn: () => load(),
  });

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["automation-center"] });

  const ruleMutation = useMutation({
    mutationFn: (input: { key: string; enabled?: boolean; config?: Record<string, number> }) =>
      saveRule({ data: input }),
    onSuccess: invalidate,
  });

  const taskMutation = useMutation({
    mutationFn: (input: { id: string; status: "pending" | "done" | "dismissed" }) =>
      saveTask({ data: input }),
    onSuccess: invalidate,
  });

  const scanMutation = useMutation({
    mutationFn: () => scan({}),
    onSuccess: async (result) => {
      setNotice(
        `Scan selesai — ${result.created} reminder baru, ${result.overdue} tugas jatuh tempo.`,
      );
      await invalidate();
    },
    onError: () => setNotice("Scan automation gagal dijalankan."),
  });

  const role = isWorkspaceRole(data?.role) ? data.role : null;
  const canManage = canManageBusiness(role);
  const canWork = canWorkLeads(role);

  const tasks = data?.tasks ?? [];
  const pending = useMemo(() => tasks.filter((t) => t.status === "pending"), [tasks]);
  const overdue = useMemo(() => pending.filter((t) => isOverdue(t)), [pending]);
  const completed = useMemo(() => tasks.filter((t) => t.status === "done"), [tasks]);
  const activeRules = (data?.rules ?? []).filter((r) => r.enabled).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">
            Business OS
          </p>
          <h1 className="text-2xl font-semibold text-foreground">Automation Engine</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Workflow otomatis untuk lead, sales, project, dan klien — beserta log aktivitas
            setiap automation yang berjalan.
          </p>
        </div>
        <button
          type="button"
          disabled={!canWork || scanMutation.isPending}
          onClick={() => scanMutation.mutate()}
          className="inline-flex items-center gap-2 rounded-xl border border-primary/40 bg-primary/15 px-4 py-2 text-sm font-medium text-primary transition hover:bg-primary/25 disabled:opacity-50"
        >
          <RefreshCw className={cn("h-4 w-4", scanMutation.isPending && "animate-spin")} />
          Jalankan scan
        </button>
      </div>

      {notice ? (
        <GlassCard className="border-primary/30 text-sm text-muted-foreground">{notice}</GlassCard>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricTile label="Automation aktif" value={String(activeRules)} icon={Zap} />
        <MetricTile label="Tugas pending" value={String(pending.length)} icon={Workflow} />
        <MetricTile
          label="Jatuh tempo"
          value={String(overdue.length)}
          icon={AlarmClock}
          tone={overdue.length ? "danger" : "default"}
        />
        <MetricTile label="Selesai" value={String(completed.length)} icon={CheckCircle2} />
      </div>

      <div className="flex flex-wrap gap-2">
        {(
          [
            ["tasks", "Tugas otomatis"],
            ["rules", "Rule automation"],
            ["logs", "Activity log"],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => setTab(value)}
            className={cn(
              "rounded-xl border px-3.5 py-1.5 text-sm transition",
              tab === value
                ? "border-primary/40 bg-primary/15 text-primary"
                : "border-border/50 bg-card/30 text-muted-foreground hover:text-foreground",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <GlassCard className="text-sm text-muted-foreground">Memuat automation…</GlassCard>
      ) : null}

      {tab === "tasks" ? (
        <SectionCard
          title="Tugas otomatis"
          description="Reminder & follow-up yang dibuat engine dari aktivitas bisnis."
        >
          {pending.length === 0 ? (
            <p className="text-sm text-muted-foreground">Tidak ada tugas otomatis tertunda.</p>
          ) : (
            <ul className="space-y-2">
              {pending.map((task) => (
                <li
                  key={task.id}
                  className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3 rounded-2xl border border-border/40 bg-card/30 p-3"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={cn(
                          "rounded-full border px-2 py-0.5 text-[0.65rem] uppercase tracking-[0.14em]",
                          priorityClass(task.priority),
                        )}
                      >
                        {task.priority}
                      </span>
                      <span className="text-[0.7rem] uppercase tracking-[0.14em] text-muted-foreground">
                        {CATEGORY_LABELS[ruleCategory(task.rule_key)]}
                      </span>
                    </div>
                    <p className="mt-1.5 truncate text-sm font-medium text-foreground">
                      {task.title}
                    </p>
                    {task.detail ? (
                      <p className="mt-0.5 text-xs text-muted-foreground">{task.detail}</p>
                    ) : null}
                    <p
                      className={cn(
                        "mt-1 text-[0.7rem]",
                        isOverdue(task) ? "text-destructive" : "text-muted-foreground",
                      )}
                    >
                      {relativeDue(task.due_at)} · {fmt(task.due_at)}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <button
                      type="button"
                      disabled={!canWork || taskMutation.isPending}
                      onClick={() => taskMutation.mutate({ id: task.id, status: "done" })}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-primary/40 bg-primary/15 px-2.5 py-1.5 text-xs text-primary transition hover:bg-primary/25 disabled:opacity-50"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" /> Selesai
                    </button>
                    <button
                      type="button"
                      disabled={!canWork || taskMutation.isPending}
                      onClick={() => taskMutation.mutate({ id: task.id, status: "dismissed" })}
                      className="inline-flex items-center rounded-lg border border-border/50 px-2 py-1.5 text-xs text-muted-foreground transition hover:text-foreground disabled:opacity-50"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>
      ) : null}

      {tab === "rules" ? (
        <div className="grid gap-4 xl:grid-cols-2">
          {AUTOMATION_CATEGORIES.map((category: AutomationCategory) => {
            const rules = (data?.rules ?? []).filter((r) => r.category === category);
            if (rules.length === 0) return null;
            return (
              <SectionCard
                key={category}
                title={CATEGORY_LABELS[category]}
                description={CATEGORY_DESCRIPTIONS[category]}
              >
                <ul className="space-y-2">
                  {rules.map((rule) => {
                    const configEntries = Object.entries(rule.config);
                    return (
                      <li
                        key={rule.id}
                        className="rounded-2xl border border-border/40 bg-card/30 p-3"
                      >
                        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-foreground">
                              {rule.label}
                            </p>
                            {rule.description ? (
                              <p className="mt-0.5 text-xs text-muted-foreground">
                                {rule.description}
                              </p>
                            ) : null}
                          </div>
                          <button
                            type="button"
                            disabled={!canManage || ruleMutation.isPending}
                            onClick={() =>
                              ruleMutation.mutate({ key: rule.key, enabled: !rule.enabled })
                            }
                            className={cn(
                              "shrink-0 rounded-full border px-3 py-1 text-[0.7rem] uppercase tracking-[0.14em] transition disabled:opacity-50",
                              rule.enabled
                                ? "border-primary/40 bg-primary/15 text-primary"
                                : "border-border/50 bg-muted/30 text-muted-foreground",
                            )}
                          >
                            {rule.enabled ? "Aktif" : "Nonaktif"}
                          </button>
                        </div>
                        {configEntries.length > 0 ? (
                          <div className="mt-3 flex flex-wrap gap-3">
                            {configEntries.map(([key, value]) => (
                              <label
                                key={key}
                                className="flex items-center gap-2 text-xs text-muted-foreground"
                              >
                                <span>{key}</span>
                                <input
                                  type="number"
                                  min={0}
                                  max={365}
                                  defaultValue={value}
                                  disabled={!canManage}
                                  onBlur={(event) => {
                                    const next = Number(event.currentTarget.value);
                                    if (!Number.isFinite(next) || next === value) return;
                                    ruleMutation.mutate({
                                      key: rule.key,
                                      config: { ...rule.config, [key]: Math.round(next) },
                                    });
                                  }}
                                  className="w-20 rounded-lg border border-border/50 bg-background/60 px-2 py-1 text-foreground"
                                />
                              </label>
                            ))}
                          </div>
                        ) : null}
                      </li>
                    );
                  })}
                </ul>
              </SectionCard>
            );
          })}
        </div>
      ) : null}

      {tab === "logs" ? (
        <SectionCard
          title="Automation activity log"
          description="Riwayat setiap automation yang dijalankan engine."
        >
          {(data?.logs ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground">Belum ada aktivitas automation.</p>
          ) : (
            <ul className="space-y-2">
              {(data?.logs ?? []).map((log) => (
                <li
                  key={log.id}
                  className="rounded-2xl border border-border/40 bg-card/30 p-3"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={cn(
                        "rounded-full border px-2 py-0.5 text-[0.65rem] uppercase tracking-[0.14em]",
                        logStatusClass(log.status),
                      )}
                    >
                      {log.status}
                    </span>
                    <span className="text-[0.7rem] uppercase tracking-[0.14em] text-muted-foreground">
                      {CATEGORY_LABELS[ruleCategory(log.rule_key)]}
                    </span>
                    <span className="ml-auto text-[0.7rem] text-muted-foreground">
                      {fmt(log.created_at)}
                    </span>
                  </div>
                  <p className="mt-1.5 text-sm text-foreground">{log.title}</p>
                  {log.detail ? (
                    <p className="mt-0.5 text-xs text-muted-foreground">{log.detail}</p>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </SectionCard>
      ) : null}
    </div>
  );
}
