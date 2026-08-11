/**
 * KERJAKU Project Delivery — client-safe constants and pure helpers.
 *
 * The delivery workspace reuses the existing `client_projects` row created by
 * the payment → client conversion flow. Templates only describe the milestone
 * shape; they never create duplicate project or client records.
 */

import { parseTimeline, timelineProgress, type TimelineStep } from "@/lib/admin/payments";

export const TASK_PRIORITIES = ["Low", "Medium", "High", "Urgent"] as const;
export type TaskPriority = (typeof TASK_PRIORITIES)[number];

/** Includes the legacy "Critical" value so older rows keep validating. */
export const TASK_PRIORITY_VALUES = [...TASK_PRIORITIES, "Critical"] as const;

export const TASK_STATUSES = ["Todo", "In Progress", "Review", "Revision", "Completed"] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

export function taskPriorityClass(priority: string): string {
  switch (priority) {
    case "Urgent":
    case "Critical":
      return "bg-destructive/15 text-destructive border-destructive/30";
    case "High":
      return "bg-amber-500/15 text-amber-300 border-amber-500/30";
    case "Medium":
      return "bg-primary/15 text-primary border-primary/30";
    default:
      return "bg-secondary/40 text-secondary-foreground border-border/60";
  }
}


export function taskStatusClass(status: string): string {
  switch (status) {
    case "Completed":
      return "bg-primary/15 text-primary border-primary/30";
    case "In Progress":
      return "bg-accent/20 text-accent-foreground border-accent/30";
    case "Review":
      return "bg-amber-500/15 text-amber-300 border-amber-500/30";
    case "Revision":
      return "bg-destructive/15 text-destructive border-destructive/30";
    default:
      return "bg-secondary/40 text-secondary-foreground border-border/60";
  }
}

/* -------------------------------- Templates ------------------------------- */

export type ProjectTemplate = {
  id: string;
  label: string;
  description: string;
  steps: { title: string; detail: string }[];
};

export const PROJECT_TEMPLATES: ProjectTemplate[] = [
  {
    id: "website_development",
    label: "Website Development",
    description: "Company profile, landing page, dan website konversi.",
    steps: [
      { title: "Requirement Gathering", detail: "Menggali tujuan bisnis, konten, dan kebutuhan halaman." },
      { title: "UI/UX Design", detail: "Wireframe dan desain visual disetujui klien." },
      { title: "Development", detail: "Implementasi halaman, konten, dan integrasi." },
      { title: "Testing", detail: "QA lintas perangkat, performa, dan SEO dasar." },
      { title: "Deployment", detail: "Rilis ke domain produksi dan konfigurasi analytics." },
      { title: "Handover", detail: "Serah terima aset, dokumentasi, dan panduan pemakaian." },
    ],
  },
  {
    id: "custom_business_system",
    label: "Custom Business System",
    description: "Sistem internal, dashboard, dan aplikasi operasional.",
    steps: [
      { title: "Analysis", detail: "Analisa proses bisnis dan titik masalah operasional." },
      { title: "System Design", detail: "Arsitektur data, alur peran, dan rancangan modul." },
      { title: "Development", detail: "Pembangunan modul inti dan aturan bisnis." },
      { title: "Integration", detail: "Integrasi layanan, notifikasi, dan migrasi data." },
      { title: "Testing", detail: "UAT bersama tim klien dan perbaikan temuan." },
      { title: "Training", detail: "Pelatihan pengguna dan pendampingan awal." },
    ],
  },
  {
    id: "digital_workflow_solution",
    label: "Digital Workflow Solution",
    description: "Automasi alur kerja, dashboard, dan smart tools.",
    steps: [
      { title: "Workflow Mapping", detail: "Pemetaan alur kerja manual yang akan diotomasi." },
      { title: "Dashboard Setup", detail: "Penyusunan dashboard monitoring dan metrik." },
      { title: "Automation Setup", detail: "Konfigurasi automasi, trigger, dan notifikasi." },
      { title: "User Testing", detail: "Uji pakai bersama tim dan penyesuaian akhir." },
    ],
  },
];

export function templateMeta(id: string): ProjectTemplate {
  return PROJECT_TEMPLATES.find((t) => t.id === id) ?? PROJECT_TEMPLATES[0]!;
}

export function templateTimeline(id: string): TimelineStep[] {
  return templateMeta(id).steps.map((step, index) => ({
    title: step.title,
    detail: step.detail,
    done: index === 0,
    date: null,
  }));
}

/** Chooses the closest template from free-text lead/project wording. */
export function suggestTemplate(...hints: (string | null | undefined)[]): string {
  const text = hints.filter(Boolean).join(" ").toLowerCase();
  if (/(automasi|automation|workflow|dashboard|integrasi|bot|smart tool)/.test(text)) {
    return "digital_workflow_solution";
  }
  if (/(sistem|system|aplikasi|app|erp|crm|pos|internal|platform)/.test(text)) {
    return "custom_business_system";
  }
  return "website_development";
}

/* --------------------------------- Helpers -------------------------------- */

export function currentPhase(timeline: TimelineStep[]): string {
  const next = timeline.find((step) => !step.done);
  if (next) return next.title;
  return timeline.length > 0 ? "Handover" : "Kickoff & Onboarding";
}

export function projectProgress(timeline: unknown): number {
  return timelineProgress(parseTimeline(timeline));
}

export function parseTeam(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((v): v is string => typeof v === "string" && v.trim().length > 0);
}

export function daysUntil(date: string | null | undefined): number | null {
  if (!date) return null;
  const target = new Date(`${date}T00:00:00`).getTime();
  if (Number.isNaN(target)) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((target - today.getTime()) / 86_400_000);
}

export function deadlineTone(date: string | null | undefined, status: string): "ok" | "soon" | "late" {
  if (status === "Completed") return "ok";
  const days = daysUntil(date);
  if (days === null) return "ok";
  if (days < 0) return "late";
  if (days <= 7) return "soon";
  return "ok";
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value.length <= 10 ? `${value}T00:00:00` : value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
}
