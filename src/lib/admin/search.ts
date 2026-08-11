/** Client-safe model for KERJAKU global search + notification center. */

export const SEARCH_CATEGORIES = [
  "lead",
  "client",
  "project",
  "proposal",
  "invoice",
  "task",
  "portfolio",
] as const;
export type SearchCategory = (typeof SEARCH_CATEGORIES)[number];

export const SEARCH_CATEGORY_LABELS: Record<SearchCategory, string> = {
  lead: "Leads",
  client: "Clients",
  project: "Projects",
  proposal: "Proposals",
  invoice: "Invoices",
  task: "Tasks",
  portfolio: "Portfolio",
};

export type SearchResult = {
  id: string;
  category: SearchCategory;
  title: string;
  subtitle: string;
  meta: string | null;
  /** Router path to the detail page. */
  href: string;
};

export const NOTIFICATION_KINDS = [
  "new_lead",
  "hot_lead",
  "proposal_update",
  "invoice_paid",
  "project_deadline",
  "task_overdue",
  "client_approval",
  "automation",
] as const;
export type NotificationKind = (typeof NOTIFICATION_KINDS)[number];

export const NOTIFICATION_LABELS: Record<NotificationKind, string> = {
  new_lead: "Lead baru",
  hot_lead: "Hot lead",
  proposal_update: "Proposal",
  invoice_paid: "Pembayaran",
  project_deadline: "Deadline project",
  task_overdue: "Task terlambat",
  client_approval: "Approval klien",
  automation: "Automation",
};

export function notificationToneClass(kind: NotificationKind): string {
  switch (kind) {
    case "hot_lead":
    case "task_overdue":
      return "border-destructive/40 bg-destructive/10 text-destructive";
    case "invoice_paid":
    case "client_approval":
      return "border-emerald-500/40 bg-emerald-500/10 text-emerald-400";
    case "project_deadline":
      return "border-amber-500/40 bg-amber-500/10 text-amber-400";
    default:
      return "border-primary/30 bg-primary/10 text-primary";
  }
}

export type NotificationItem = {
  id: string;
  kind: NotificationKind;
  title: string;
  detail: string | null;
  href: string;
  created_at: string;
};

const READ_KEY = "kerjaku_notifications_read";

export function loadReadIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(READ_KEY);
    const parsed = raw ? (JSON.parse(raw) as unknown) : [];
    return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === "string") : [];
  } catch {
    return [];
  }
}

export function saveReadIds(ids: string[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(READ_KEY, JSON.stringify(ids.slice(-500)));
}
