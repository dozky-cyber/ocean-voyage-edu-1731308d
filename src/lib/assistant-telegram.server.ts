/**
 * Telegram channel for the AI Business Assistant.
 *
 * This is NOT a separate chatbot: it reuses the exact same core
 * (memory layer + Business OS snapshot + system prompt + assistant_threads /
 * assistant_messages / assistant_memories tables) as /admin/assistant.
 * Telegram is only another interface on top of that engine.
 */
import { createHash, timingSafeEqual } from "crypto";
import { generateText } from "ai";

import { ASSISTANT_MODEL, createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";
import { isMemoryCategory } from "@/lib/assistant/memory";
import {
  appendMessage,
  buildBusinessSnapshot,
  buildMemoryContext,
  buildSystemPrompt,
  clearThreadMessages,
  loadThreadMessages,
  renameThread,
  saveMemory,
} from "@/lib/assistant.server";
import { escapeHtml, sendTelegramMessage } from "@/lib/telegram.server";

const THREAD_PREFIX = "Telegram";

export function telegramWebhookSecret(): string | null {
  const token = process.env["TELEGRAM_BOT_TOKEN"];
  if (!token) return null;
  return createHash("sha256").update(`telegram-webhook:${token}`).digest("base64url");
}

export function verifyWebhookSecret(received: string): boolean {
  const expected = telegramWebhookSecret();
  if (!expected) return false;
  const a = Buffer.from(received);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

/** Only chat IDs listed in TELEGRAM_CHAT_ID (comma separated) may talk to the assistant. */
export function isAuthorizedChat(chatId: number | string): boolean {
  const allowed = (process.env["TELEGRAM_CHAT_ID"] ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  return allowed.includes(String(chatId));
}

type AdminClient = Awaited<
  typeof import("@/integrations/supabase/client.server")
>["supabaseAdmin"];

/** Workspace identity the Telegram conversation acts as (owner, else admin). */
async function resolveWorkspaceUser(supabase: AdminClient): Promise<string | null> {
  const { data } = await supabase
    .from("user_roles")
    .select("user_id, role")
    .in("role", ["owner", "admin"])
    .order("role", { ascending: true })
    .limit(50);
  const rows = data ?? [];
  const owner = rows.find((row) => row.role === "owner");
  return (owner ?? rows[0])?.user_id ?? null;
}

/** One persistent conversation thread per Telegram chat, reused across messages. */
async function getOrCreateThread(supabase: AdminClient, chatId: string, userId: string) {
  const title = `${THREAD_PREFIX} · ${chatId}`;
  const { data: existing } = await supabase
    .from("assistant_threads")
    .select("id, title")
    .eq("created_by", userId)
    .eq("title", title)
    .maybeSingle();
  if (existing) return existing;

  const { data, error } = await supabase
    .from("assistant_threads")
    .insert({ created_by: userId, title })
    .select("id, title")
    .single();
  if (error) throw new Error("Gagal membuat percakapan Telegram.");
  return data;
}

async function extractMemories(
  supabase: AdminClient,
  model: ReturnType<ReturnType<typeof createLovableAiGatewayProvider>>,
  input: { question: string; answer: string; threadId: string; userId: string },
) {
  try {
    const { text } = await generateText({
      model,
      system:
        "Ekstrak fakta bisnis jangka panjang dari percakapan berikut untuk disimpan sebagai memory asisten bisnis. " +
        'Balas HANYA JSON: {"memories":[{"category":"business|sales|project|operational","title":"...","content":"...","importance":1-5}]}. ' +
        "Kategori: business = info perusahaan, layanan, paket, strategi harga, keputusan bisnis. sales = lead penting, diskusi pelanggan, strategi sales. project = diskusi project, preferensi klien, keputusan, kendala. operational = workflow tim, aturan automation, rekomendasi yang diberikan. " +
        'Simpan maksimal 3 memory, hanya yang benar-benar layak diingat lama. Jika tidak ada, balas {"memories":[]}.',
      prompt: `PERTANYAAN USER:\n${input.question}\n\nJAWABAN ASISTEN:\n${input.answer}`,
    });
    const parsed = JSON.parse(text.replace(/```json|```/g, "").trim()) as {
      memories?: Array<{ category?: string; title?: string; content?: string; importance?: number }>;
    };
    for (const item of (parsed.memories ?? []).slice(0, 3)) {
      if (!item.title || !item.content || !isMemoryCategory(item.category)) continue;
      await saveMemory(
        supabase,
        {
          category: item.category,
          title: item.title,
          content: item.content,
          importance: item.importance,
          sourceThreadId: input.threadId,
        },
        input.userId,
      );
    }
  } catch (error) {
    console.error("[telegram-assistant] memory extraction", error);
  }
}

const WELCOME = [
  "🤖 <b>KERJAKU AI Business Assistant</b>",
  "",
  "Tanyakan apa saja soal bisnis kamu, contoh:",
  "• berapa lead masuk hari ini?",
  "• project mana yang terlambat?",
  "• siapa yang harus saya follow up?",
  "• berapa pemasukan bulan ini?",
  "",
  "Ketik /reset untuk memulai percakapan baru.",
].join("\n");

/** Processes one Telegram update end-to-end. Never throws. */
export async function handleTelegramUpdate(update: unknown): Promise<void> {
  const message = (update as { message?: unknown; edited_message?: unknown }).message ??
    (update as { edited_message?: unknown }).edited_message;
  const parsed = message as
    | { chat?: { id?: number }; text?: string; from?: { first_name?: string } }
    | undefined;
  const chatId = parsed?.chat?.id;
  const text = parsed?.text?.trim();
  if (!chatId || !text) return;

  if (!isAuthorizedChat(chatId)) {
    console.warn("[telegram-assistant] unauthorized chat");
    return;
  }

  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  try {
    const userId = await resolveWorkspaceUser(supabaseAdmin);
    if (!userId) {
      await sendTelegramMessage("⚠️ Belum ada akun owner/admin workspace yang terhubung.");
      return;
    }

    const thread = await getOrCreateThread(supabaseAdmin, String(chatId), userId);

    if (text === "/start") {
      await sendTelegramMessage(WELCOME);
      return;
    }
    if (text === "/reset") {
      await clearThreadMessages(supabaseAdmin, thread.id);
      await renameThread(supabaseAdmin, thread.id, `${THREAD_PREFIX} · ${chatId}`);
      await sendTelegramMessage("🧹 Riwayat percakapan Telegram dibersihkan. Memory bisnis tetap tersimpan.");
      return;
    }

    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) {
      await sendTelegramMessage("⚠️ AI belum dikonfigurasi (LOVABLE_API_KEY).");
      return;
    }

    const [memoryContext, businessSnapshot, history] = await Promise.all([
      buildMemoryContext(supabaseAdmin, thread.id),
      buildBusinessSnapshot(supabaseAdmin),
      loadThreadMessages(supabaseAdmin, thread.id),
    ]);

    const { ASSISTANT_ACTION_GUIDE, buildAssistantTools } = await import(
      "@/lib/assistant-tools.server"
    );
    const { stepCountIs } = await import("ai");

    const system = [
      buildSystemPrompt(memoryContext, businessSnapshot),
      "",
      ASSISTANT_ACTION_GUIDE,
      "",
      "KANAL SAAT INI: Telegram. Jawab maksimal ~1200 karakter, gunakan bullet pendek, tanpa tabel, tanpa markdown heading.",
    ].join("\n");

    const model = createLovableAiGatewayProvider(apiKey)(ASSISTANT_MODEL);
    const { text: answer } = await generateText({
      model,
      system,
      tools: buildAssistantTools({ supabase: supabaseAdmin, userId, role: "owner" }),
      stopWhen: stepCountIs(50),
      messages: [
        ...history.slice(-16).map((row) => ({
          role: row.role === "assistant" ? ("assistant" as const) : ("user" as const),
          content: row.content,
        })),
        { role: "user" as const, content: text },
      ],
    });


    const reply = answer.trim() || "Maaf, saya belum bisa menjawab itu.";

    await appendMessage(supabaseAdmin, { threadId: thread.id, role: "user", content: text, userId });
    await appendMessage(supabaseAdmin, {
      threadId: thread.id,
      role: "assistant",
      content: reply,
      userId,
    });

    await sendTelegramMessage(toTelegramHtml(reply));
    await extractMemories(supabaseAdmin, model, {
      question: text,
      answer: reply,
      threadId: thread.id,
      userId,
    });
  } catch (error) {
    console.error("[telegram-assistant] failed", error);
    await sendTelegramMessage("⚠️ Terjadi kendala saat memproses pertanyaan. Coba lagi sebentar lagi.");
  }
}

/** Converts the assistant's light markdown into Telegram-safe HTML. */
export function toTelegramHtml(markdown: string): string {
  const escaped = escapeHtml(markdown)
    .replace(/^#{1,6}\s*/gm, "")
    .replace(/^\s*[-*]\s+/gm, "• ");
  return escaped
    .replace(/\*\*(.+?)\*\*/gs, "<b>$1</b>")
    .replace(/(^|\s)\*(?!\s)(.+?)\*(?=\s|$)/gs, "$1<i>$2</i>")
    .slice(0, 3900);
}
