/**
 * AI Business Assistant — server-only context, memory, and persistence layer.
 *
 * Every function receives an authenticated Supabase client so RLS applies and
 * the assistant can only ever read business data the caller is allowed to see.
 */
import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/integrations/supabase/types";
import {
  MEMORY_CATEGORIES,
  isMemoryCategory,
  type AssistantMemory,
  type MemoryCategory,
} from "@/lib/assistant/memory";

type Client = SupabaseClient<Database>;

const money = (amount: number, currency = "IDR") =>
  `${currency} ${new Intl.NumberFormat("id-ID").format(Math.round(amount))}`;

/* --------------------------------- Memory -------------------------------- */

export async function listMemories(
  supabase: Client,
  category?: MemoryCategory,
): Promise<AssistantMemory[]> {
  let query = supabase
    .from("assistant_memories")
    .select("id, category, title, content, importance, source_thread_id, created_at, updated_at")
    .order("importance", { ascending: false })
    .order("updated_at", { ascending: false })
    .limit(200);
  if (category) query = query.eq("category", category);
  const { data, error } = await query;
  if (error) throw new Error("Tidak dapat memuat memory assistant.");
  return (data ?? []).map((row) => ({
    ...row,
    category: isMemoryCategory(row.category) ? row.category : "business",
  })) as AssistantMemory[];
}

export async function saveMemory(
  supabase: Client,
  input: {
    id?: string;
    category: MemoryCategory;
    title: string;
    content: string;
    importance?: number;
    sourceThreadId?: string | null;
  },
  userId: string,
) {
  const payload = {
    category: input.category,
    title: input.title.slice(0, 200),
    content: input.content.slice(0, 4000),
    importance: Math.min(5, Math.max(1, input.importance ?? 3)),
    source_thread_id: input.sourceThreadId ?? null,
    created_by: userId,
  };
  if (input.id) {
    const { error } = await supabase
      .from("assistant_memories")
      .update(payload)
      .eq("id", input.id);
    if (error) throw new Error("Gagal memperbarui memory.");
    return { id: input.id };
  }
  const { data, error } = await supabase
    .from("assistant_memories")
    .insert(payload)
    .select("id")
    .single();
  if (error) throw new Error("Gagal menyimpan memory.");
  return { id: data.id };
}

export async function deleteMemory(supabase: Client, id: string) {
  const { error } = await supabase.from("assistant_memories").delete().eq("id", id);
  if (error) throw new Error("Gagal menghapus memory.");
  return { ok: true };
}

export async function clearMemories(supabase: Client, category?: MemoryCategory) {
  let query = supabase.from("assistant_memories").delete();
  query = category ? query.eq("category", category) : query.not("id", "is", null);
  const { error } = await query;
  if (error) throw new Error("Gagal menghapus memory.");
  return { ok: true };
}

/* --------------------------------- Threads -------------------------------- */

export async function listThreads(supabase: Client, userId: string) {
  const { data, error } = await supabase
    .from("assistant_threads")
    .select("id, title, last_message_at, created_at")
    .eq("created_by", userId)
    .order("last_message_at", { ascending: false })
    .limit(60);
  if (error) throw new Error("Tidak dapat memuat percakapan.");
  return data ?? [];
}

export async function createThread(supabase: Client, userId: string, title?: string) {
  const { data, error } = await supabase
    .from("assistant_threads")
    .insert({ created_by: userId, title: title?.slice(0, 120) || "Percakapan baru" })
    .select("id, title, last_message_at, created_at")
    .single();
  if (error) throw new Error("Gagal membuat percakapan baru.");
  return data;
}

export async function renameThread(supabase: Client, id: string, title: string) {
  const { error } = await supabase
    .from("assistant_threads")
    .update({ title: title.slice(0, 120) || "Percakapan baru" })
    .eq("id", id);
  if (error) throw new Error("Gagal mengganti judul percakapan.");
  return { ok: true };
}

export async function deleteThread(supabase: Client, id: string) {
  const { error } = await supabase.from("assistant_threads").delete().eq("id", id);
  if (error) throw new Error("Gagal menghapus percakapan.");
  return { ok: true };
}

export async function clearThreadMessages(supabase: Client, id: string) {
  const { error } = await supabase.from("assistant_messages").delete().eq("thread_id", id);
  if (error) throw new Error("Gagal menghapus riwayat percakapan.");
  return { ok: true };
}

export async function loadThreadMessages(supabase: Client, threadId: string) {
  const { data, error } = await supabase
    .from("assistant_messages")
    .select("id, role, content, created_at")
    .eq("thread_id", threadId)
    .order("created_at", { ascending: true })
    .limit(200);
  if (error) throw new Error("Tidak dapat memuat riwayat percakapan.");
  return data ?? [];
}

export async function appendMessage(
  supabase: Client,
  input: { threadId: string; role: "user" | "assistant"; content: string; userId: string },
) {
  const { error } = await supabase.from("assistant_messages").insert({
    thread_id: input.threadId,
    role: input.role,
    content: input.content,
    created_by: input.userId,
  });
  if (error) throw new Error("Gagal menyimpan pesan percakapan.");
  await supabase
    .from("assistant_threads")
    .update({ last_message_at: new Date().toISOString() })
    .eq("id", input.threadId);
}

/* --------------------------- Business OS snapshot -------------------------- */

export async function buildBusinessSnapshot(supabase: Client): Promise<string> {
  const today = new Date().toISOString().slice(0, 10);
  const [leads, proposals, invoices, projects, tasks, clients, team] = await Promise.all([
    supabase
      .from("consultations")
      .select(
        "name, company, project_type, budget, status, lead_score, lead_temperature, ai_recommended_package, created_at",
      )
      .order("created_at", { ascending: false })
      .limit(15),
    supabase
      .from("proposals")
      .select("title, client_name, status, recommended_package, updated_at")
      .order("updated_at", { ascending: false })
      .limit(10),
    supabase
      .from("invoices")
      .select("number, client_name, amount, currency, status, due_date, paid_at")
      .order("created_at", { ascending: false })
      .limit(15),
    supabase
      .from("client_projects")
      .select("name, status, stage, phase, progress, target_date")
      .order("updated_at", { ascending: false })
      .limit(12),
    supabase
      .from("project_tasks")
      .select("title, status, assignee, priority, due_date")
      .neq("status", "done")
      .order("due_date", { ascending: true })
      .limit(15),
    supabase.from("clients").select("name, company, package, status").limit(15),
    supabase.from("team_members").select("name, role, active, capacity").eq("active", true).limit: undefined as never,
  ]);

  void team;
  const lines: string[] = [`Tanggal hari ini: ${today}`];

  const leadRows = leads.data ?? [];
  lines.push(
    `\n[LEADS TERBARU] (${leadRows.length})\n` +
      leadRows
        .map(
          (l) =>
            `- ${l.name} (${l.company ?? "tanpa perusahaan"}) · ${l.project_type} · budget ${l.budget} · status ${l.status} · skor ${l.lead_score} ${l.lead_temperature} · rekomendasi ${l.ai_recommended_package ?? "-"}`,
        )
        .join("\n"),
  );

  const proposalRows = proposals.data ?? [];
  lines.push(
    `\n[PROPOSAL] (${proposalRows.length})\n` +
      proposalRows
        .map((p) => `- ${p.title} · ${p.client_name ?? "-"} · ${p.status} · paket ${p.recommended_package ?? "-"}`)
        .join("\n"),
  );

  const invoiceRows = invoices.data ?? [];
  const paid = invoiceRows.filter((i) => i.status === "paid");
  const outstanding = invoiceRows.filter((i) => i.status !== "paid" && i.status !== "cancelled");
  lines.push(
    `\n[INVOICE] dibayar ${paid.length} (${money(paid.reduce((s, i) => s + Number(i.amount ?? 0), 0))}), outstanding ${outstanding.length} (${money(outstanding.reduce((s, i) => s + Number(i.amount ?? 0), 0))})\n` +
      invoiceRows
        .map(
          (i) =>
            `- ${i.number} · ${i.client_name ?? "-"} · ${money(Number(i.amount ?? 0), i.currency ?? "IDR")} · ${i.status}${i.due_date ? ` · jatuh tempo ${i.due_date}` : ""}`,
        )
        .join("\n"),
  );

  const projectRows = projects.data ?? [];
  lines.push(
    `\n[PROJECT AKTIF] (${projectRows.length})\n` +
      projectRows
        .map(
          (p) =>
            `- ${p.name} · stage ${p.stage ?? p.phase} · ${p.status} · progress ${p.progress}%${p.target_date ? ` · target ${p.target_date}` : ""}`,
        )
        .join("\n"),
  );

  const taskRows = tasks.data ?? [];
  lines.push(
    `\n[TASK BELUM SELESAI] (${taskRows.length})\n` +
      taskRows
        .map(
          (t) =>
            `- ${t.title} · ${t.assignee?.trim() || "belum ditugaskan"} · ${t.status} · prioritas ${t.priority}${t.due_date ? ` · due ${t.due_date}` : ""}`,
        )
        .join("\n"),
  );

  const clientRows = clients.data ?? [];
  lines.push(
    `\n[CLIENT] (${clientRows.length})\n` +
      clientRows
        .map((c) => `- ${c.name} · ${c.company ?? "-"} · paket ${c.package ?? "-"} · ${c.status}`)
        .join("\n"),
  );

  return lines.join("\n");
}

/* --------------------------- Conversation context -------------------------- */

export async function buildMemoryContext(supabase: Client, threadId: string): Promise<string> {
  const [memories, recentThreads] = await Promise.all([
    listMemories(supabase),
    supabase
      .from("assistant_threads")
      .select("id, title, last_message_at")
      .order("last_message_at", { ascending: false })
      .limit(8),
  ]);

  const blocks: string[] = [];
  for (const category of MEMORY_CATEGORIES) {
    const rows = memories.filter((m) => m.category === category);
    if (rows.length === 0) continue;
    blocks.push(
      `\n[${category.toUpperCase()} MEMORY]\n` +
        rows.map((m) => `- ${m.title}: ${m.content}`).join("\n"),
    );
  }

  const others = (recentThreads.data ?? []).filter((t) => t.id !== threadId);
  if (others.length > 0) {
    blocks.push(
      `\n[PERCAKAPAN SEBELUMNYA]\n` +
        others.map((t) => `- ${t.title} (terakhir ${t.last_message_at.slice(0, 10)})`).join("\n"),
    );
  }

  return blocks.length > 0 ? blocks.join("\n") : "(Belum ada memory tersimpan.)";
}

export function buildSystemPrompt(memoryContext: string, businessSnapshot: string): string {
  return [
    "Kamu adalah AI Business Assistant internal KERJAKU — asisten bisnis jangka panjang untuk tim owner/admin/sales.",
    "KERJAKU adalah digital solution & business automation agency.",
    "",
    "CARA MENJAWAB:",
    "- Jawab dalam Bahasa Indonesia yang profesional, ringkas, dan actionable. Gunakan markdown.",
    "- Sebelum menjawab: pahami pertanyaan, ambil konteks dari MEMORY dan percakapan berjalan, lalu gabungkan dengan DATA BUSINESS OS di bawah.",
    "- Pertanyaan lanjutan seperti 'bagaimana yang kemarin?', 'lanjutkan yang tadi', atau 'update project itu' harus dijawab dengan merujuk konteks sebelumnya tanpa meminta user mengulang informasi.",
    "- Jika konteks benar-benar tidak ada, katakan apa yang belum kamu ketahui dan tawarkan satu pertanyaan klarifikasi singkat.",
    "- Jangan mengarang angka. Gunakan hanya data yang tersedia di bawah ini.",
    "- Akhiri dengan rekomendasi atau langkah berikutnya bila relevan.",
    "",
    "=== MEMORY JANGKA PANJANG ===",
    memoryContext,
    "",
    "=== DATA BUSINESS OS (real-time, sudah difilter sesuai izin akses user) ===",
    businessSnapshot,
  ].join("\n");
}
