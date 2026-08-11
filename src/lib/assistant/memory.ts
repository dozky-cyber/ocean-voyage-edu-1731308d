/** Client-safe model for the AI Business Assistant memory layer. */

export const MEMORY_CATEGORIES = ["business", "sales", "project", "operational"] as const;
export type MemoryCategory = (typeof MEMORY_CATEGORIES)[number];

export const MEMORY_CATEGORY_LABELS: Record<MemoryCategory, string> = {
  business: "Business Memory",
  sales: "Sales Memory",
  project: "Project Memory",
  operational: "Operational Memory",
};

export const MEMORY_CATEGORY_HINTS: Record<MemoryCategory, string> = {
  business: "Profil perusahaan, layanan, paket, strategi harga, keputusan bisnis.",
  sales: "Lead penting, diskusi pelanggan, strategi sales.",
  project: "Diskusi project, preferensi klien, keputusan, kendala.",
  operational: "Workflow tim, aturan automation, rekomendasi sebelumnya.",
};

export function isMemoryCategory(value: unknown): value is MemoryCategory {
  return typeof value === "string" && (MEMORY_CATEGORIES as readonly string[]).includes(value);
}

export type AssistantMemory = {
  id: string;
  category: MemoryCategory;
  title: string;
  content: string;
  importance: number;
  source_thread_id: string | null;
  created_at: string;
  updated_at: string;
};

export type AssistantThread = {
  id: string;
  title: string;
  last_message_at: string;
  created_at: string;
};

export type AssistantStoredMessage = {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  created_at: string;
};

export function memoryCategoryClass(category: MemoryCategory): string {
  switch (category) {
    case "business":
      return "border-primary/40 bg-primary/15 text-primary";
    case "sales":
      return "border-accent/40 bg-accent/20 text-accent-foreground";
    case "project":
      return "border-border/60 bg-secondary/40 text-secondary-foreground";
    default:
      return "border-border/60 bg-muted/40 text-muted-foreground";
  }
}
