import type { ComponentType, ReactNode } from "react";

import { cn } from "@/lib/utils";

export function GlassCard({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-3xl border border-border/40 bg-card/40 p-5 shadow-lg backdrop-blur-xl",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function SectionCard({
  title,
  description,
  action,
  className,
  children,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return (
    <GlassCard className={className}>
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-foreground">{title}</p>
          {description ? (
            <p className="mt-1 text-xs text-muted-foreground">{description}</p>
          ) : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
      <div className="mt-4">{children}</div>
    </GlassCard>
  );
}

export function Kpi({
  label,
  value,
  hint,
  icon: Icon,
  tone = "default",
}: {
  label: string;
  value: string | number;
  hint?: string;
  icon?: ComponentType<{ className?: string }>;
  tone?: "default" | "hot" | "primary";
}) {
  const toneClass =
    tone === "hot"
      ? "bg-destructive/15 text-destructive"
      : tone === "primary"
        ? "bg-primary/15 text-primary"
        : "bg-muted/30 text-muted-foreground";
  return (
    <div className="rounded-2xl border border-border/40 bg-card/40 p-4 shadow-sm backdrop-blur-xl">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
        <p className="min-w-0 truncate text-[0.65rem] uppercase tracking-[0.2em] text-muted-foreground">
          {label}
        </p>
        {Icon ? (
          <span className={cn("grid h-8 w-8 shrink-0 place-items-center rounded-xl", toneClass)}>
            <Icon className="h-4 w-4" />
          </span>
        ) : null}
      </div>
      <p className="mt-3 truncate text-2xl font-semibold tracking-tight text-foreground">{value}</p>
      {hint ? <p className="mt-1 truncate text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

/** Compact SaaS-style metric used in the dashboard metric strip. */
export function MetricTile({
  label,
  value,
  hint,
  icon: Icon,
  tone = "default",
}: {
  label: string;
  value: string | number;
  hint?: string;
  icon?: ComponentType<{ className?: string }>;
  tone?: "default" | "hot" | "primary";
}) {
  const toneClass =
    tone === "hot"
      ? "bg-destructive/15 text-destructive"
      : tone === "primary"
        ? "bg-primary/15 text-primary"
        : "bg-muted/30 text-muted-foreground";
  return (
    <div className="flex min-w-0 items-center gap-3 rounded-2xl border border-border/40 bg-card/40 px-3 py-2.5 shadow-sm backdrop-blur-xl">
      {Icon ? (
        <span className={cn("grid h-8 w-8 shrink-0 place-items-center rounded-xl", toneClass)}>
          <Icon className="h-4 w-4" />
        </span>
      ) : null}
      <div className="min-w-0">
        <p className="truncate text-[0.6rem] uppercase tracking-[0.18em] text-muted-foreground">
          {label}
        </p>
        <p className="truncate text-lg font-semibold leading-tight tracking-tight text-foreground">
          {value}
        </p>
        {hint ? <p className="truncate text-[0.65rem] text-muted-foreground">{hint}</p> : null}
      </div>
    </div>
  );
}


export function BarList({
  title,
  items,
  empty = "Belum ada data",
}: {
  title: string;
  items: { label: string; value: number }[];
  empty?: string;
}) {
  return (
    <SectionCard title={title}>
      <BarRows items={items} empty={empty} />
    </SectionCard>
  );
}

export function BarRows({
  items,
  empty = "Belum ada data",
}: {
  items: { label: string; value: number }[];
  empty?: string;
}) {
  const max = Math.max(1, ...items.map((i) => i.value));
  if (items.length === 0) return <p className="text-xs text-muted-foreground">{empty}</p>;
  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div key={item.label}>
          <div className="flex items-center justify-between gap-3 text-xs">
            <span className="min-w-0 truncate text-muted-foreground">{item.label}</span>
            <span className="shrink-0 font-medium text-foreground">{item.value}</span>
          </div>
          <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-muted/30">
            <div
              className="h-full rounded-full bg-primary/70"
              style={{ width: `${(item.value / max) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export function Funnel({
  steps,
}: {
  steps: { label: string; value: number | null; hint?: string }[];
}) {
  const max = Math.max(1, ...steps.map((s) => s.value ?? 0));
  return (
    <div className="space-y-3">
      {steps.map((step, index) => {
        const value = step.value;
        const width = value === null ? 100 : Math.max(6, (value / max) * 100);
        return (
          <div key={step.label}>
            <div className="flex items-center justify-between gap-3 text-xs">
              <span className="min-w-0 truncate text-muted-foreground">
                {index + 1}. {step.label}
              </span>
              <span className="shrink-0 font-medium text-foreground">
                {value === null ? "—" : value}
              </span>
            </div>
            <div className="mt-1.5 h-2.5 w-full overflow-hidden rounded-full bg-muted/25">
              <div
                className={cn(
                  "h-full rounded-full",
                  value === null ? "bg-muted/40" : "bg-gradient-to-r from-primary/80 to-primary/35",
                )}
                style={{ width: `${width}%` }}
              />
            </div>
            {step.hint ? (
              <p className="mt-1 text-[0.65rem] text-muted-foreground">{step.hint}</p>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

export function Chip({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[0.7rem] font-medium",
        className,
      )}
    >
      {children}
    </span>
  );
}
