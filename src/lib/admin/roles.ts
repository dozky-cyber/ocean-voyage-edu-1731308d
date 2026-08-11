/** Client-safe role model for the KERJAKU Business OS workspace. */

export const WORKSPACE_ROLES = ["owner", "admin", "sales", "viewer"] as const;
export type WorkspaceRole = (typeof WORKSPACE_ROLES)[number];

export const ROLE_LABELS: Record<WorkspaceRole, string> = {
  owner: "Owner",
  admin: "Admin",
  sales: "Sales",
  viewer: "Viewer",
};

export const ROLE_DESCRIPTIONS: Record<WorkspaceRole, string> = {
  owner: "Akses penuh termasuk mengelola tim.",
  admin: "Kelola seluruh data bisnis dan proposal.",
  sales: "Kelola lead dan alat sales, tanpa hapus proposal.",
  viewer: "Hanya membaca data.",
};

export function isWorkspaceRole(value: unknown): value is WorkspaceRole {
  return typeof value === "string" && (WORKSPACE_ROLES as readonly string[]).includes(value);
}

/** Highest privilege wins when a user holds several roles. */
export function highestRole(roles: readonly string[]): WorkspaceRole | null {
  for (const role of WORKSPACE_ROLES) {
    if (roles.includes(role)) return role;
  }
  return null;
}

export function canManageBusiness(role: WorkspaceRole | null): boolean {
  return role === "owner" || role === "admin";
}

export function canWorkLeads(role: WorkspaceRole | null): boolean {
  return role === "owner" || role === "admin" || role === "sales";
}

export function roleBadgeClass(role: WorkspaceRole | null): string {
  switch (role) {
    case "owner":
      return "border-primary/40 bg-primary/15 text-primary";
    case "admin":
      return "border-accent/40 bg-accent/20 text-accent-foreground";
    case "sales":
      return "border-border/60 bg-secondary/40 text-secondary-foreground";
    default:
      return "border-border/60 bg-muted/40 text-muted-foreground";
  }
}
