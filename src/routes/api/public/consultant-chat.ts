import { createFileRoute } from "@tanstack/react-router";
import { convertToModelMessages, streamText, stepCountIs, tool, type UIMessage } from "ai";
import { z } from "zod";

import { ASSISTANT_MODEL, createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";
import {
  formatQualifiedTelegram,
  qualifyConversation,
  saveDraftConversation,
  scoreConversation,
  type ConversationTurn,
} from "@/lib/ai-conversation.server";
import { sendTelegramMessage } from "@/lib/telegram.server";

type Body = { messages?: unknown; sessionId?: unknown };

const SYSTEM = `Kamu adalah "AI Consultant KERJAKU" — konsultan digital yang ramah, tajam, dan berpengalaman.
KERJAKU adalah digital solution & business automation agency (Indonesia) dengan keahlian:
- Website profesional, company profile, landing page
- Custom business system (CRM, ERP ringan, sistem operasional, database)
- Dashboard & business intelligence
- Workflow automation (notifikasi, laporan otomatis, integrasi WhatsApp/Telegram/email)
- AI integration (AI assistant, analisa data, dokumen, rekomendasi)
- Digital transformation untuk UMKM sampai enterprise

Paket solusi KERJAKU:
1. Basic System — website profesional, company profile, SEO dasar.
2. Professional System — website bisnis, katalog, lead form, analytics.
3. Digital Workflow Solution — dashboard operasional, database, laporan otomatis, automation.
4. Enterprise Digital Transformation — platform custom, multi-role, integrasi API, AI intelligence.

CARA BICARA:
- Bahasa Indonesia, hangat, profesional, ringkas (maksimal 2-4 kalimat per balasan).
- Ini percakapan bebas, BUKAN formulir. Jangan pernah menampilkan atau meminta pengisian form,
  questionnaire, atau langkah bernomor seperti "pertanyaan 1/6".
- Tanya SATU pertanyaan per pesan, mengalir natural mengikuti jawaban pengguna.
- Gali secara natural: jenis bisnis → masalah/hambatan utama → proses yang ingin dibenahi →
  kebutuhan sistem → skala pengguna → target waktu & kesiapan anggaran.
- Jangan menyebut harga angka. Bicara tentang arah solusi dan kompleksitas.
- JANGAN meminta nama, email, atau nomor WhatsApp. Kalau pengguna memberikannya sendiri secara
  sukarela, catat lewat tool.

DETEKSI INTENT (penting):
Jangan menganggap setiap penanya sebagai calon klien. Orang yang hanya mencoba fitur atau
bertanya satu hal umum belum punya intent.
Panggil tool "qualify_conversation" HANYA jika kamu sudah cukup memahami bisnis, masalah, dan
kebutuhan project pengguna, DAN ada sinyal serius seperti: minta dibuatkan
website/sistem/aplikasi, membahas fitur, budget, timeline, estimasi, minta dihubungi tim, atau
memberi kontak sendiri. Set intent "high" jika sinyalnya kuat, "medium" jika masih menimbang.
Jika informasi belum cukup, JANGAN panggil tool — lanjutkan percakapan saja.

Setelah tool dipanggil, tulis satu paragraf singkat berisi rekomendasi arah solusi dan
sampaikan bahwa tim KERJAKU akan menindaklanjuti pembahasan ini.`;

const qualifySchema = z.object({
  businessCategory: z.string().describe("Jenis/bidang bisnis pengguna"),
  problems: z.array(z.string()).describe("Masalah utama yang disebutkan pengguna"),
  requirements: z.array(z.string()).describe("Kebutuhan sistem yang teridentifikasi"),
  packageName: z
    .enum([
      "Basic System",
      "Professional System",
      "Digital Workflow Solution",
      "Enterprise Digital Transformation",
    ])
    .describe("Paket KERJAKU yang direkomendasikan"),
  features: z.array(z.string()).describe("Fitur utama yang direkomendasikan"),
  complexity: z.enum(["Low", "Medium", "High"]),
  intent: z.enum(["low", "medium", "high"]).describe("Kekuatan intent project pengguna"),
  budget: z.string().describe("Kesiapan anggaran, atau 'Belum ditentukan'"),
  timeline: z.string().describe("Target waktu, atau 'Belum ditentukan'"),
  users: z.string().describe("Perkiraan skala pengguna, atau 'Belum ditentukan'"),
  summary: z.string().describe("Ringkasan kebutuhan project dalam 2-4 kalimat"),
  contactName: z.string().describe("Nama jika diberikan sukarela, jika tidak kosongkan"),
  contactEmail: z.string().describe("Email jika diberikan sukarela, jika tidak kosongkan"),
  contactWhatsapp: z.string().describe("Nomor WhatsApp jika diberikan sukarela, jika tidak kosongkan"),
});

function toTurns(messages: UIMessage[]): ConversationTurn[] {
  return messages
    .map((message) => ({
      role: message.role === "user" ? ("user" as const) : ("assistant" as const),
      text: (message.parts ?? [])
        .map((part) => (part.type === "text" ? part.text : ""))
        .join("")
        .trim(),
    }))
    .filter((turn) => turn.text.length > 0);
}

export const Route = createFileRoute("/api/public/consultant-chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = (await request.json()) as Body;
        const messages = Array.isArray(body.messages) ? (body.messages as UIMessage[]) : null;
        const sessionId =
          typeof body.sessionId === "string" ? body.sessionId.slice(0, 64) : "";
        if (!messages) return new Response("Bad request", { status: 400 });
        if (messages.length > 60) return new Response("Conversation too long", { status: 400 });

        const apiKey = process.env["LOVABLE_API_KEY"];
        if (!apiKey) return new Response("Missing LOVABLE_API_KEY", { status: 500 });

        const gateway = createLovableAiGatewayProvider(apiKey);

        const result = streamText({
          model: gateway(ASSISTANT_MODEL),
          system: SYSTEM,
          messages: await convertToModelMessages(messages),
          stopWhen: stepCountIs(50),
          tools: {
            qualify_conversation: tool({
              description:
                "Tandai percakapan ini sebagai qualified lead ketika kebutuhan project sudah jelas dan intent-nya serius.",
              inputSchema: qualifySchema,
              execute: async (input) => {
                const turns = toTurns(messages);
                const score = scoreConversation(input);
                const outcome = await qualifyConversation(sessionId, input, turns);
                if (outcome.ok && outcome.isNew) {
                  void sendTelegramMessage(
                    formatRequirementTelegram(
                      {
                        business: input.businessCategory,
                        project: outcome.project,
                        features: input.features,
                        problems: input.problems,
                        packageName: input.packageName,
                        timeline: input.timeline,
                        budget: input.budget,
                        usersScale: input.users,
                        intent: input.intent,
                        score,
                        contactName: input.contactName || null,
                        contactEmail: input.contactEmail || null,
                        contactWhatsapp: input.contactWhatsapp || null,
                        summary: input.summary,
                      },
                      outcome.requirementVersion ?? 1,
                    ),
                  );
                }
                return { ...input, score };
              },
            }),
          },
          onFinish: async ({ text }) => {
            const turns = toTurns(messages);
            if (text.trim()) turns.push({ role: "assistant", text: text.trim() });
            await saveDraftConversation(sessionId, turns);
          },
        });

        return result.toUIMessageStreamResponse({ originalMessages: messages });
      },
    },
  },
});
