import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { motion } from "framer-motion";
import { Bot, Check, RotateCcw, Sparkle } from "lucide-react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";

import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import { Message, MessageContent, MessageResponse } from "@/components/ai-elements/message";
import {
  PromptInput,
  PromptInputFooter,
  PromptInputSubmit,
  PromptInputTextarea,
  type PromptInputMessage,
} from "@/components/ai-elements/prompt-input";
import { Shimmer } from "@/components/ai-elements/shimmer";
import { analytics } from "@/lib/analytics";
import { consultationFormSchema } from "@/lib/consultation-schema";
import { submitConsultationLead } from "@/lib/consultation.functions";
import { getLeadTracking, saveAiConsultation } from "@/lib/lead-journey";
import { cn } from "@/lib/utils";
import { OceanButton } from "./OceanButton";

type Props = {
  source: "section" | "floating";
  onDiscuss?: () => void;
  compact?: boolean;
};

type Recommendation = {
  businessCategory: string;
  problems: string[];
  requirements: string[];
  packageName: string;
  features: string[];
  complexity: "Low" | "Medium" | "High";
  budget: string;
  timeline: string;
  users: string;
  summary: string;
};

const contactSchema = consultationFormSchema.pick({ name: true, email: true, whatsapp: true });

const projectTypeByPackage: Record<string, string> = {
  "Basic System": "Website Company Profile",
  "Professional System": "Website Bisnis",
  "Digital Workflow Solution": "Dashboard Sistem",
  "Enterprise Digital Transformation": "Aplikasi Custom",
};

const SUGGESTIONS = [
  "Saya butuh website untuk bisnis saya",
  "Operasional saya masih manual, bisa dibantu?",
  "Saya ingin dashboard & laporan otomatis",
  "Bisa integrasi AI ke sistem saya?",
];

const inputClass =
  "w-full rounded-2xl border border-border bg-card/70 px-4 py-3 text-sm text-foreground outline-none backdrop-blur-md transition-colors placeholder:text-muted-foreground/70 focus:border-primary/60";

const GREETING: UIMessage = {
  id: "greeting",
  role: "assistant",
  parts: [
    {
      type: "text",
      text: "Halo! Saya AI Consultant KERJAKU. Ceritakan sedikit soal bisnis Anda — bidangnya apa dan kendala apa yang paling terasa saat ini?",
    },
  ],
};

function scoreOf(rec: Recommendation): number {
  const complexity = rec.complexity === "High" ? 22 : rec.complexity === "Medium" ? 14 : 8;
  const known = (value: string) =>
    value && !/belum|tidak tahu|-/i.test(value) ? 18 : 6;
  return Math.min(
    100,
    20 +
      complexity +
      known(rec.budget) +
      known(rec.timeline) +
      Math.min(12, rec.requirements.length * 4) +
      Math.min(10, rec.problems.length * 3),
  );
}

function qualificationOf(score: number) {
  return score >= 70 ? "Hot Lead" : score >= 40 ? "Warm Lead" : ("Cold Lead" as const);
}

function scrollToConsultation() {
  if (typeof document === "undefined") return;
  document.getElementById("konsultasi")?.scrollIntoView({ behavior: "smooth", block: "start" });
}

export function AiConsultantChat({ source, onDiscuss, compact = false }: Props) {
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [contact, setContact] = useState({ name: "", email: "", whatsapp: "" });
  const [contactErrors, setContactErrors] = useState<Record<string, string>>({});
  const [honeypot, setHoneypot] = useState("");
  const [mountedAt] = useState(() => Date.now());
  const [sending, setSending] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [started, setStarted] = useState(false);
  const [chatKey, setChatKey] = useState(0);
  const submitLead = useServerFn(submitConsultationLead);

  const { messages, sendMessage, status, error, setMessages } = useChat({
    id: `kerjaku-consultant-${chatKey}`,
    messages: [GREETING],
    transport: new DefaultChatTransport({ api: "/api/public/consultant-chat" }),
    onError: (err) => toast.error(err.message || "AI Consultant sedang tidak tersedia."),
  });

  const busy = status === "submitted" || status === "streaming";

  const recommendation = useMemo<Recommendation | null>(() => {
    for (let i = messages.length - 1; i >= 0; i -= 1) {
      for (const part of messages[i]!.parts ?? []) {
        const anyPart = part as { type: string; state?: string; output?: unknown };
        if (
          anyPart.type === "tool-finalize_consultation" &&
          anyPart.state === "output-available" &&
          anyPart.output
        ) {
          return anyPart.output as Recommendation;
        }
      }
    }
    return null;
  }, [messages]);

  const trackedRef = useRef(false);
  useEffect(() => {
    if (!recommendation || trackedRef.current) return;
    trackedRef.current = true;
    const score = scoreOf(recommendation);
    const qualification = qualificationOf(score);
    saveAiConsultation({
      businessCategory: recommendation.businessCategory,
      problems: recommendation.problems,
      requirements: recommendation.requirements,
      packageName: recommendation.packageName,
      complexity: recommendation.complexity,
      score,
      qualification,
      summary: recommendation.summary,
      budget: recommendation.budget,
      timeline: recommendation.timeline,
      users: recommendation.users,
      conversation: messages.slice(0, 20).map((message) => ({
        q: message.role,
        a: (message.parts ?? [])
          .map((part) => (part.type === "text" ? part.text : ""))
          .join("")
          .slice(0, 600),
      })),
    });
    analytics.aiConsultationComplete({
      recommended_package: recommendation.packageName,
      business_category: recommendation.businessCategory,
      complexity: recommendation.complexity,
      ai_score: score,
      qualification,
    });
    analytics.aiPreviewView({
      recommended_package: recommendation.packageName,
      ai_score: score,
    });
  }, [recommendation, messages]);

  useEffect(() => {
    if (!busy) inputRef.current?.focus();
  }, [busy]);

  function send(text: string) {
    const value = text.trim();
    if (!value || busy) return;
    if (!started) {
      setStarted(true);
      analytics.aiConsultationStart(source);
    }
    void sendMessage({ text: value });
  }

  function submit(message: PromptInputMessage) {
    send(message.text ?? "");
  }

  function reset() {
    trackedRef.current = false;
    setSubmitted(false);
    setContact({ name: "", email: "", whatsapp: "" });
    setContactErrors({});
    setStarted(false);
    setMessages([GREETING]);
    setChatKey((value) => value + 1);
  }

  function discuss() {
    analytics.aiToConsultation(recommendation?.packageName ?? "");
    analytics.consultationButtonClick(`ai_consultant_${source}`, "Diskusikan Project");
    onDiscuss?.();
    scrollToConsultation();
  }

  async function submitContact(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!recommendation || sending || submitted) return;

    const parsed = contactSchema.safeParse(contact);
    if (!parsed.success) {
      const next: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0]);
        if (!next[key]) next[key] = issue.message;
      }
      setContactErrors(next);
      return;
    }
    setContactErrors({});
    setSending(true);
    const score = scoreOf(recommendation);
    const qualification = qualificationOf(score);
    analytics.aiContactSubmit({
      recommended_package: recommendation.packageName,
      ai_score: score,
    });

    try {
      const tracking = getLeadTracking();
      await submitLead({
        data: {
          form: {
            ...parsed.data,
            projectType: projectTypeByPackage[recommendation.packageName] ?? "Lainnya",
            requirement: recommendation.summary,
            budget: recommendation.budget || "Belum ditentukan",
            timeline: recommendation.timeline || "Belum ditentukan",
            businessName: "",
            features: recommendation.features.join(", "),
            notes: `Skala pengguna: ${recommendation.users || "-"}`,
          },
          tracking,
          ai: {
            businessCategory: recommendation.businessCategory,
            problems: recommendation.problems,
            requirements: recommendation.requirements,
            packageName: recommendation.packageName,
            complexity: recommendation.complexity,
            score,
            qualification,
            summary: recommendation.summary,
            budget: recommendation.budget,
            timeline: recommendation.timeline,
            users: recommendation.users,
            conversation: messages.slice(0, 20).map((message) => ({
              q: message.role,
              a: (message.parts ?? [])
                .map((part) => (part.type === "text" ? part.text : ""))
                .join("")
                .slice(0, 600),
            })),
          },
          leadSource: "ai_consultant",
          honeypot,
          elapsedMs: Date.now() - mountedAt,
        },
      });
      setSubmitted(true);
      analytics.aiConsultationConversion({
        recommended_package: recommendation.packageName,
        ai_score: score,
        qualification,
      });
      toast.success("Konsultasi terkirim. Tim KERJAKU akan menghubungi Anda.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal mengirim. Coba lagi.");
    } finally {
      setSending(false);
    }
  }

  const score = recommendation ? scoreOf(recommendation) : 0;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/15 text-primary">
          <Bot className="h-4.5 w-4.5" strokeWidth={1.5} />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-medium text-foreground">KERJAKU AI Consultant</p>
          <p className="truncate text-[11px] uppercase tracking-[0.24em] text-muted-foreground">
            Digital solution advisor
          </p>
        </div>
        <span className="ml-auto flex items-center gap-1.5 text-[11px] uppercase tracking-[0.2em] text-primary/90">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" /> Online
        </span>
      </div>

      <div className="rounded-2xl border border-border/70 bg-card/40 backdrop-blur-md">
        <Conversation
          className={cn("min-h-0", compact ? "h-[19rem]" : "h-[26rem]")}
          style={{ overflowY: "auto" }}
        >
          <ConversationContent className="gap-5 p-4">
            {messages.map((message) => {
              const text = (message.parts ?? [])
                .map((part) => (part.type === "text" ? part.text : ""))
                .join("");
              if (!text.trim()) return null;
              return (
                <Message from={message.role} key={message.id}>
                  <MessageContent>
                    {message.role === "assistant" ? (
                      <MessageResponse>{text}</MessageResponse>
                    ) : (
                      <p className="whitespace-pre-wrap">{text}</p>
                    )}
                  </MessageContent>
                </Message>
              );
            })}
            {busy && (
              <Message from="assistant">
                <MessageContent>
                  <Shimmer>AI Consultant sedang menganalisa…</Shimmer>
                </MessageContent>
              </Message>
            )}
          </ConversationContent>
          <ConversationScrollButton />
        </Conversation>
      </div>

      {error && (
        <p className="text-xs text-destructive">
          Koneksi AI bermasalah. Coba kirim ulang pesan Anda.
        </p>
      )}

      {messages.length <= 1 && !busy && (
        <div className="flex flex-wrap gap-2">
          {SUGGESTIONS.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => send(suggestion)}
              className="rounded-full border border-border bg-card/50 px-3.5 py-2 text-xs text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground"
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}

      <PromptInput onSubmit={submit}>
        <PromptInputTextarea
          ref={inputRef}
          placeholder="Tulis pesan untuk AI Consultant…"
          disabled={submitted}
        />
        <PromptInputFooter className="justify-end">
          <PromptInputSubmit status={status} disabled={busy || submitted} />
        </PromptInputFooter>
      </PromptInput>

      {recommendation && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="space-y-4"
        >
          <div className="rounded-2xl border border-primary/40 bg-primary/[0.07] p-5">
            <p className="flex items-center gap-2 text-[11px] uppercase tracking-[0.28em] text-primary/90">
              <Sparkle className="h-3.5 w-3.5" /> Rekomendasi KERJAKU
            </p>
            <h3 className="mt-3 font-display text-xl leading-tight text-foreground">
              {recommendation.packageName}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {recommendation.summary}
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <SummaryCard label="Bisnis" value={recommendation.businessCategory || "-"} />
            <SummaryCard label="Estimasi Kompleksitas" value={recommendation.complexity} />
            <SummaryCard label="Masalah" value={recommendation.problems.join(", ") || "-"} />
            <SummaryCard label="Kebutuhan" value={recommendation.requirements.join(", ") || "-"} />
          </div>

          {recommendation.features.length > 0 && (
            <div className="rounded-2xl border border-border bg-card/50 p-4">
              <p className="text-[11px] uppercase tracking-[0.28em] text-muted-foreground">
                Fitur Utama
              </p>
              <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                {recommendation.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm text-foreground">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-card/50 px-4 py-3">
            <span className="text-[11px] uppercase tracking-[0.24em] text-muted-foreground">
              Kualifikasi
            </span>
            <span className="text-sm text-foreground">
              {qualificationOf(score)} · {score}/100
            </span>
          </div>

          {submitted ? (
            <div className="space-y-3">
              <p className="rounded-2xl border border-primary/40 bg-primary/10 px-5 py-4 text-sm leading-relaxed text-foreground">
                Terima kasih. Ringkasan konsultasi Anda sudah terkirim ke tim KERJAKU. Kami akan
                menghubungi Anda melalui WhatsApp atau email.
              </p>
              <OceanButton variant="ghost" size="sm" onClick={reset}>
                <RotateCcw className="h-4 w-4" /> Mulai Percakapan Baru
              </OceanButton>
            </div>
          ) : (
            <form onSubmit={submitContact} className="space-y-3" noValidate>
              {/* Honeypot: hidden from users, filled only by bots. */}
              <input
                type="text"
                name="company_website"
                tabIndex={-1}
                autoComplete="off"
                aria-hidden="true"
                className="hidden"
                value={honeypot}
                onChange={(e) => setHoneypot(e.target.value)}
              />
              <p className="text-sm leading-relaxed text-muted-foreground">
                Konsultasi selesai. Masukkan kontak agar tim KERJAKU dapat menyiapkan rekomendasi
                dan estimasi project Anda.
              </p>
              <div className="grid gap-3">
                <ContactField label="Nama" error={contactErrors["name"]}>
                  <input
                    className={inputClass}
                    value={contact.name}
                    onChange={(e) => setContact((v) => ({ ...v, name: e.target.value }))}
                    placeholder="Nama Anda"
                    autoComplete="name"
                  />
                </ContactField>
                <ContactField label="Email" error={contactErrors["email"]}>
                  <input
                    className={inputClass}
                    type="email"
                    value={contact.email}
                    onChange={(e) => setContact((v) => ({ ...v, email: e.target.value }))}
                    placeholder="nama@email.com"
                    autoComplete="email"
                  />
                </ContactField>
                <ContactField label="WhatsApp" error={contactErrors["whatsapp"]}>
                  <input
                    className={inputClass}
                    inputMode="tel"
                    value={contact.whatsapp}
                    onChange={(e) => setContact((v) => ({ ...v, whatsapp: e.target.value }))}
                    placeholder="08xxxxxxxxxx"
                    autoComplete="tel"
                  />
                </ContactField>
              </div>
              <div className="flex flex-wrap items-center gap-3 pt-1">
                <OceanButton type="submit" disabled={sending}>
                  {sending ? "Mengirim…" : "Kirim Konsultasi"}
                </OceanButton>
                <OceanButton type="button" variant="ghost" size="sm" onClick={discuss}>
                  Isi Form Lengkap
                </OceanButton>
                <OceanButton type="button" variant="ghost" size="sm" onClick={reset}>
                  <RotateCcw className="h-4 w-4" /> Ulangi
                </OceanButton>
              </div>
            </form>
          )}
        </motion.div>
      )}
    </div>
  );
}

function ContactField({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="block text-xs uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </span>
      <span className="mt-2 block">{children}</span>
      {error && <span className="mt-1.5 block text-xs text-destructive">{error}</span>}
    </label>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card/50 p-4">
      <p className="text-[11px] uppercase tracking-[0.24em] text-muted-foreground">{label}</p>
      <p className="mt-2 text-sm leading-relaxed text-foreground">{value}</p>
    </div>
  );
}
