/** KERJAKU Team Management — client-safe constants and pure helpers. */

export const TEAM_ROLES = [
  "Owner",
  "Project Manager",
  "Developer",
  "Designer",
  "Sales",
] as const;
export type TeamRole = (typeof TEAM_ROLES)[number];

export function isTeamRole(value: unknown): value is TeamRole {
  return typeof value === "string" && (TEAM_ROLES as readonly string[]).includes(value);
}

export function teamRoleClass(role: string): string {
  switch (role) {
    case "Owner":
      return "border-primary/40 bg-primary/15 text-primary";
    case "Project Manager":
      return "border-accent/40 bg-accent/20 text-accent-foreground";
    case "Developer":
      return "border-cyan-400/30 bg-cyan-400/10 text-cyan-300";
    case "Designer":
      return "border-fuchsia-400/30 bg-fuchsia-400/10 text-fuchsia-300";
    case "Sales":
      return "border-amber-500/30 bg-amber-500/10 text-amber-300";
    default:
      return "border-border/60 bg-muted/40 text-muted-foreground";
  }
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p.charAt(0).toUpperCase()).join("") || "?";
}

export const OVERLOAD_THRESHOLD = 100;

export function workloadTone(percent: number): "ok" | "busy" | "over" {
  if (percent >= OVERLOAD_THRESHOLD) return "over";
  if (percent >= 70) return "busy";
  return "ok";
}

export function workloadClass(percent: number): string {
  switch (workloadTone(percent)) {
    case "over":
      return "bg-destructive";
    case "busy":
      return "bg-amber-400";
    default:
      return "bg-primary";
  }
}

export function workloadLabel(percent: number): string {
  switch (workloadTone(percent)) {
    case "over":
      return "Overloaded";
    case "busy":
      return "High load";
    default:
      return "Healthy";
  }
}
