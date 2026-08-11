import type { ReactNode } from "react";

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

export function Kpi({
  label,
  value,
  hint,
}: {
  label: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <GlassCard>
      <p className="text-[0.65rem] uppercase tracking-[0.25em] text-muted-foreground">{label}</p>
      <p className="mt-2 text-3xl font-semibold tracking-tight text-foreground">{value}</p>
      {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
    </GlassCard>
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
  const max = Math.max(1, ...items.map((i) => i.value));
  return (
    <GlassCard>
      <p className="text-sm font-medium text-foreground">{title}</p>
      <div className="mt-4 space-y-3">
        {items.length === 0 ? (
          <p className="text-xs text-muted-foreground">{empty}</p>
        ) : (
          items.map((item) => (
            <div key={item.label}>
              <div className="flex items-center justify-between text-xs">
                <span className="truncate text-muted-foreground">{item.label}</span>
                <span className="ml-3 font-medium text-foreground">{item.value}</span>
              </div>
              <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-muted/30">
                <div
                  className="h-full rounded-full bg-primary/70"
                  style={{ width: `${(item.value / max) * 100}%` }}
                />
              </div>
            </div>
          ))
        )}
      </div>
    </GlassCard>
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
