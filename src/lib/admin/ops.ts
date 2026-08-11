/**
 * KERJAKU Project Operations Center — client-safe constants and pure helpers.
 *
 * The delivery stage lives alongside the existing detailed `status` field so
 * nothing in the payment/portal flow breaks; the stage is the daily execution
 * pipeline the team works from.
 */

import { daysUntil } from "@/lib/admin/projects";

export const DELIVERY_STAGES = [
  "Planning",
  "In Progress",
  "Review",
  "Client Approval",
  "Completed",
] as const;

export type DeliveryStage = (typeof DELIVERY_STAGES)[number];

export function isDeliveryStage(value: unknown): value is DeliveryStage {
  return typeof value === "string" && (DELIVERY_STAGES as readonly string[]).includes(value);
}

export function normalizeStage(value: unknown): DeliveryStage {
  return isDeliveryStage(value) ? value : "Planning";
}

export function stageClass(stage: string): string {
  switch (stage) {
    case "Completed":
      return "border-primary/30 bg-primary/15 text-primary";
    case "Client Approval":
      return "border-cyan-400/30 bg-cyan-400/10 text-cyan-300";
    case "Review":
      return "border-amber-500/30 bg-amber-500/10 text-amber-300";
    case "In Progress":
      return "border-accent/40 bg-accent/20 text-accent-foreground";
    default:
      return "border-border/60 bg-muted/30 text-muted-foreground";
  }
}

/* --------------------------------- Health --------------------------------- */

export const PROJECT_HEALTHS = ["On Track", "At Risk", "Delayed"] as const;
export type ProjectHealth = (typeof PROJECT_HEALTHS)[number];

export function healthClass(health: string): string {
  switch (health) {
    case "Delayed":
      return "border-destructive/30 bg-destructive/15 text-destructive";
    case "At Risk":
      return "border-amber-500/30 bg-amber-500/10 text-amber-300";
    default:
      return "border-primary/30 bg-primary/15 text-primary";
  }
}

export function isOverdue(dueDate: string | null | undefined, status: string): boolean {
  if (!dueDate || status === "Completed") return false;
  const days = daysUntil(dueDate);
  return days !== null && days < 0;
}

/**
 * Health is derived from the deadline, the progress made so far and the number
 * of overdue tasks — no extra database state is required.
 */
export function projectHealth(input: {
  stage: string;
  progress: number;
  target_date: string | null;
  overdue_tasks: number;
}): ProjectHealth {
  if (input.stage === "Completed") return "On Track";
  const days = daysUntil(input.target_date);
  if (days !== null && days < 0) return "Delayed";
  if (input.overdue_tasks > 0) return input.overdue_tasks >= 3 ? "Delayed" : "At Risk";
  if (days !== null && days <= 7 && input.progress < 70) return "At Risk";
  if (days !== null && days <= 14 && input.progress < 35) return "At Risk";
  return "On Track";
}

export function healthReason(input: {
  stage: string;
  progress: number;
  target_date: string | null;
  overdue_tasks: number;
}): string {
  const health = projectHealth(input);
  const days = daysUntil(input.target_date);
  if (input.stage === "Completed") return "Project selesai.";
  if (health === "Delayed") {
    if (days !== null && days < 0) return `Melewati target ${Math.abs(days)} hari.`;
    return `${input.overdue_tasks} task melewati due date.`;
  }
  if (health === "At Risk") {
    if (input.overdue_tasks > 0) return `${input.overdue_tasks} task terlambat.`;
    return `Deadline ${days ?? 0} hari lagi, progres ${input.progress}%.`;
  }
  return days === null ? "Berjalan sesuai rencana." : `Deadline ${days} hari lagi.`;
}
