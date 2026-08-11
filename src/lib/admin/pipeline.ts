/** Client-safe constants for the KERJAKU Business OS admin workspace. */

export const PIPELINE_STAGES = [
  "New Lead",
  "Contacted",
  "Consultation",
  "Proposal Sent",
  "Negotiation",
  "Payment",
  "Project Development",
  "Completed",
  "Closed",
] as const;

export type PipelineStage = (typeof PIPELINE_STAGES)[number];

export function isPipelineStage(value: unknown): value is PipelineStage {
  return typeof value === "string" && (PIPELINE_STAGES as readonly string[]).includes(value);
}

export function normalizeStage(value: unknown): PipelineStage {
  if (isPipelineStage(value)) return value;
  return "New Lead";
}

export const TEMPERATURES = ["Hot Lead", "Warm Lead", "Cold Lead"] as const;
export type Temperature = (typeof TEMPERATURES)[number];

export function temperatureClass(t: string | null | undefined): string {
  if (t === "Hot Lead") return "bg-destructive/15 text-destructive border-destructive/30";
  if (t === "Warm Lead") return "bg-primary/15 text-primary border-primary/30";
  return "bg-muted/40 text-muted-foreground border-border/60";
}

export function stageClass(stage: string): string {
  switch (stage) {
    case "Completed":
    case "Payment":
      return "bg-primary/15 text-primary border-primary/30";
    case "Closed":
      return "bg-muted/40 text-muted-foreground border-border/60";
    case "Proposal Sent":
    case "Negotiation":
    case "Project Development":
      return "bg-accent/20 text-accent-foreground border-accent/30";
    default:
      return "bg-secondary/40 text-secondary-foreground border-border/60";
  }
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "-";
  return new Date(iso).toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function leadSourceLabel(source: string | null | undefined): string {
  if (source === "ai_consultant") return "AI Consultant";
  if (source === "manual_form") return "Manual Form";
  return source || "Unknown";
}
