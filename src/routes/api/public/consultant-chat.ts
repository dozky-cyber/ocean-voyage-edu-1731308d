import { createFileRoute } from "@tanstack/react-router";
import { convertToModelMessages, streamText, stepCountIs, tool, type UIMessage } from "ai";
import { z } from "zod";

import { ASSISTANT_MODEL, createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";

type Body = { messages?: unknown };

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
- Buka dengan sapaan singkat lalu SATU pertanyaan.
- Tanya SATU pertanyaan per pesan. Jangan pernah memberi daftar pertanyaan sekaligus.
- Gali secara natural: jenis bisnis → masalah/hambatan utama → proses yang ingin dibenahi → kebutuhan sistem → skala pengguna → target waktu & kesiapan anggaran.
- Boleh menyimpulkan dan mengedukasi singkat, tapi jangan menggurui.
- Jangan menyebut harga angka. Bicara tentang arah solusi dan kompleksitas.
- Jangan meminta nama, email, atau nomor telepon. Form kontak muncul otomatis setelah konsultasi selesai.

PENYELESAIAN:
Setelah kamu cukup memahami bisnis, masalah, kebutuhan, dan (kalau bisa) skala/timeline —
biasanya setelah 4-6 pertanyaan — panggil tool "finalize_consultation" dengan ringkasan lengkap.
Setelah tool dipanggil, tulis satu paragraf singkat berisi rekomendasi dan ajak pengguna
mengisi kontak agar tim KERJAKU menindaklanjuti.`;

const finalizeSchema = z.object({
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
  budget: z.string().describe("Kesiapan anggaran, atau 'Belum ditentukan'"),
  timeline: z.string().describe("Target waktu, atau 'Belum ditentukan'"),
  users: z.string().describe("Perkiraan skala pengguna, atau 'Belum ditentukan'"),
  summary: z.string().describe("Ringkasan kebutuhan project dalam 2-4 kalimat"),
});

export const Route = createFileRoute("/api/public/consultant-chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = (await request.json()) as Body;
        const messages = Array.isArray(body.messages) ? (body.messages as UIMessage[]) : null;
        if (!messages) return new Response("Bad request", { status: 400 });
        if (messages.length > 60) return new Response("Conversation too long", { status: 400 });

        const apiKey = process.env["LOVABLE_API_KEY"];
        if (!apiKey) return new Response("Missing LOVABLE_API_KEY", { status: 500 });

        const gateway = createLovableAiGatewayProvider(apiKey);

        const result = streamText({
          model: gateway(ASSISTANT_MODEL),
          system: SYSTEM,
          messages: convertToModelMessages(messages),
          stopWhen: stepCountIs(50),
          tools: {
            finalize_consultation: tool({
              description:
                "Selesaikan konsultasi dan kirim ringkasan kebutuhan + rekomendasi paket KERJAKU.",
              inputSchema: finalizeSchema,
              execute: async (input) => input,
            }),
          },
        });

        return result.toUIMessageStreamResponse({ originalMessages: messages });
      },
    },
  },
});
