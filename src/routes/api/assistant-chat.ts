import { createFileRoute } from "@tanstack/react-router";
import { convertToModelMessages, streamText, generateText, type UIMessage } from "ai";

import { ASSISTANT_MODEL, createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";

type Body = { messages?: unknown; threadId?: unknown };

function textOf(message: UIMessage): string {
  return (message.parts ?? [])
    .map((part) => (part.type === "text" ? part.text : ""))
    .join("")
    .trim();
}

export const Route = createFileRoute("/api/assistant-chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { authenticateRequest } = await import("@/lib/assistant-auth.server");
        const auth = await authenticateRequest(request).catch(() => null);
        if (!auth) return new Response("Unauthorized", { status: 401 });

        const { assertWorkspace } = await import("@/lib/admin.server");
        try {
          await assertWorkspace(auth.supabase, auth.userId);
        } catch {
          return new Response("Forbidden", { status: 403 });
        }

        const body = (await request.json()) as Body;
        const messages = Array.isArray(body.messages) ? (body.messages as UIMessage[]) : null;
        const threadId = typeof body.threadId === "string" ? body.threadId : null;
        if (!messages || !threadId) return new Response("Bad request", { status: 400 });

        const { data: thread } = await auth.supabase
          .from("assistant_threads")
          .select("id, title, created_by")
          .eq("id", threadId)
          .maybeSingle();
        if (!thread || thread.created_by !== auth.userId) {
          return new Response("Thread not found", { status: 404 });
        }

        const apiKey = process.env["LOVABLE_API_KEY"];
        if (!apiKey) return new Response("Missing LOVABLE_API_KEY", { status: 500 });

        const assistant = await import("@/lib/assistant.server");
        const [memoryContext, businessSnapshot] = await Promise.all([
          assistant.buildMemoryContext(auth.supabase, threadId),
          assistant.buildBusinessSnapshot(auth.supabase),
        ]);
        const system = assistant.buildSystemPrompt(memoryContext, businessSnapshot);

        const lastUser = [...messages].reverse().find((m) => m.role === "user");
        const question = lastUser ? textOf(lastUser) : "";
        if (question) {
          await assistant
            .appendMessage(auth.supabase, {
              threadId,
              role: "user",
              content: question,
              userId: auth.userId,
            })
            .catch((error: unknown) => console.error("[assistant] save user message", error));
        }

        const gateway = createLovableAiGatewayProvider(apiKey);
        const model = gateway(ASSISTANT_MODEL);

        const result = streamText({
          model,
          system,
          messages: await convertToModelMessages(messages),
        });

        return result.toUIMessageStreamResponse({
          originalMessages: messages,
          onFinish: async ({ responseMessage }) => {
            const answer = textOf(responseMessage as UIMessage);
            if (!answer) return;
            try {
              await assistant.appendMessage(auth.supabase, {
                threadId,
                role: "assistant",
                content: answer,
                userId: auth.userId,
              });

              if (!thread.title || thread.title === "Percakapan baru") {
                const title = question.replace(/\s+/g, " ").slice(0, 70);
                if (title) await assistant.renameThread(auth.supabase, threadId, title);
              }

              // Extract durable business memory from this exchange.
              const { text } = await generateText({
                model,
                system:
                  "Ekstrak fakta bisnis jangka panjang dari percakapan berikut untuk disimpan sebagai memory asisten bisnis. " +
                  'Balas HANYA JSON: {"memories":[{"category":"business|sales|project|operational","title":"...","content":"...","importance":1-5}]}. ' +
                  "Kategori: business = info perusahaan, layanan, paket, strategi harga, keputusan bisnis. sales = lead penting, diskusi pelanggan, strategi sales. project = diskusi project, preferensi klien, keputusan, kendala. operational = workflow tim, aturan automation, rekomendasi yang diberikan. " +
                  "Simpan maksimal 3 memory, hanya yang benar-benar layak diingat lama (keputusan, preferensi, strategi, rekomendasi). Jika tidak ada, balas {\"memories\":[]}.",
                prompt: `PERTANYAAN USER:\n${question}\n\nJAWABAN ASISTEN:\n${answer}`,
              });

              const parsed = JSON.parse(text.replace(/```json|```/g, "").trim()) as {
                memories?: Array<{
                  category?: string;
                  title?: string;
                  content?: string;
                  importance?: number;
                }>;
              };
              const { isMemoryCategory } = await import("@/lib/assistant/memory");
              for (const item of (parsed.memories ?? []).slice(0, 3)) {
                if (!item.title || !item.content || !isMemoryCategory(item.category)) continue;
                await assistant.saveMemory(
                  auth.supabase,
                  {
                    category: item.category,
                    title: item.title,
                    content: item.content,
                    importance: item.importance,
                    sourceThreadId: threadId,
                  },
                  auth.userId,
                );
              }
            } catch (error) {
              console.error("[assistant] finish handler", error);
            }
          },
        });
      },
    },
  },
});
