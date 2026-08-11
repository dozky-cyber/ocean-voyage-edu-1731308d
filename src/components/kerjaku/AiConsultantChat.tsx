import { useMemo, useState, type FormEvent } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Bot, Check, ChevronLeft, RotateCcw, Sparkle } from "lucide-react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import {
  aiConsultantSection,
  buildRecommendation,
  consultantSteps,
  emptyAnswers,
  type ConsultantAnswers,
  type ConsultantResult,
} from "@/lib/ai-consultant";
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

const contactSchema = consultationFormSchema.pick({ name: true, email: true, whatsapp: true });

const projectTypeByPackage: Record<string, string> = {
  "basic-system": "Website Company Profile",
  "professional-system": "Website Bisnis",
  "digital-workflow": "Dashboard Sistem",
  "enterprise-transformation": "Aplikasi Custom",
};

const inputClass =
  "w-full rounded-2xl border border-border bg-card/70 px-4 py-3 text-sm text-foreground outline-none backdrop-blur-md transition-colors placeholder:text-muted-foreground/70 focus:border-primary/60";

function scrollToConsultation() {
  if (typeof document === "undefined") return;
  document.getElementById("konsultasi")?.scrollIntoView({ behavior: "smooth", block: "start" });
}

export function AiConsultantChat({ source, onDiscuss, compact = false }: Props) {
  const [started, setStarted] = useState(false);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<ConsultantAnswers>(emptyAnswers);
  const [result, setResult] = useState<ConsultantResult | null>(null);
  const [contact, setContact] = useState({ name: "", email: "", whatsapp: "" });
  const [contactErrors, setContactErrors] = useState<Record<string, string>>({});
  const [honeypot, setHoneypot] = useState("");
  const [mountedAt] = useState(() => Date.now());
  const [sending, setSending] = useState(false);

  const [submitted, setSubmitted] = useState(false);
  const submitLead = useServerFn(submitConsultationLead);

  const step = consultantSteps[index]!;
  const progress = useMemo(
    () => Math.round(((result ? consultantSteps.length : index) / consultantSteps.length) * 100),
    [index, result],
  );

  const selected: string[] = (() => {
    const value = answers[step.id];
    return Array.isArray(value) ? value : value ? [value] : [];
  })();

  function start() {
    setStarted(true);
    analytics.aiConsultationStart(source);
  }

  function finish(next: ConsultantAnswers) {
    const outcome = buildRecommendation(next);
    setResult(outcome);
    saveAiConsultation({
      businessCategory: outcome.businessCategory,
      problems: outcome.problems,
      requirements: outcome.requirements,
      packageName: outcome.packageName,
      complexity: outcome.complexity,
      score: outcome.score,
      qualification: outcome.qualification,
      summary: outcome.summary,
      budget: outcome.budget,
      timeline: outcome.timeline,
      users: outcome.users,
      conversation: consultantSteps.map((s) => {
        const value = next[s.id];
        return { q: s.question, a: Array.isArray(value) ? value.join(", ") : value };
      }),
    });
    analytics.aiConsultationComplete({
      recommended_package: outcome.packageName,
      business_category: outcome.businessCategory,
      complexity: outcome.complexity,
      ai_score: outcome.score,
      qualification: outcome.qualification,
    });
    analytics.aiPreviewView({
      recommended_package: outcome.packageName,
      ai_score: outcome.score,
    });
  }

  async function submitContact(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!result || sending || submitted) return;

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
    analytics.aiContactSubmit({
      recommended_package: result.packageName,
      ai_score: result.score,
    });

    try {
      const tracking = getLeadTracking();
      await submitLead({
        data: {
          form: {
            ...parsed.data,
            projectType: projectTypeByPackage[result.packageId] ?? "Lainnya",
            requirement: result.summary,
            budget: result.budget || "Belum ditentukan",
            timeline: result.timeline || "Belum ditentukan",
            businessName: "",
            features: result.features.join(", "),
            notes: `Skala pengguna: ${result.users || "-"}`,
          },
          tracking,
          ai: {
            businessCategory: result.businessCategory,
            problems: result.problems,
            requirements: result.requirements,
            packageName: result.packageName,
            complexity: result.complexity,
            score: result.score,
            qualification: result.qualification,
            summary: result.summary,
            budget: result.budget,
            timeline: result.timeline,
            users: result.users,
            conversation: consultantSteps.map((s) => {
              const value = answers[s.id];
              return { q: s.question, a: Array.isArray(value) ? value.join(", ") : value };
            }),
          },
          leadSource: "ai_consultant",
          honeypot,
          elapsedMs: Date.now() - mountedAt,

        },
      });
      setSubmitted(true);
      analytics.aiConsultationConversion({
        recommended_package: result.packageName,
        ai_score: result.score,
        qualification: result.qualification,
      });
      toast.success("Konsultasi terkirim. Tim KERJAKU akan menghubungi Anda.");
    } catch {
      toast.error("Gagal mengirim. Coba lagi beberapa saat lagi.");
    } finally {
      setSending(false);
    }
  }

  function choose(optionId: string) {
    const next: ConsultantAnswers = { ...answers };
    if (step.multi) {
      const list = new Set(next[step.id] as string[]);
      if (list.has(optionId)) list.delete(optionId);
      else list.add(optionId);
      next[step.id] = [...list] as never;
      setAnswers(next);
      return;
    }
    next[step.id] = optionId as never;
    setAnswers(next);
    analytics.aiConsultationStep(step.id, optionId);
    if (index === consultantSteps.length - 1) finish(next);
    else setIndex(index + 1);
  }

  function nextMulti() {
    analytics.aiConsultationStep(step.id, (answers[step.id] as string[]).join(","));
    if (index === consultantSteps.length - 1) finish(answers);
    else setIndex(index + 1);
  }

  function reset() {
    setAnswers(emptyAnswers);
    setResult(null);
    setIndex(0);
    setContact({ name: "", email: "", whatsapp: "" });
    setContactErrors({});
    setSubmitted(false);
  }

  function discuss() {
    analytics.aiToConsultation(result?.packageName ?? "");
    analytics.consultationButtonClick(`ai_consultant_${source}`, "Diskusikan Project");
    onDiscuss?.();
    scrollToConsultation();
  }

  return (
    <div className={cn("flex flex-col", compact ? "gap-4" : "gap-5")}>
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
      </div>

      <div className="h-1 w-full overflow-hidden rounded-full bg-border/60">
        <motion.div
          className="h-full rounded-full bg-primary"
          animate={{ width: `${started ? Math.max(progress, 8) : 0}%` }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>

      <AnimatePresence mode="wait" initial={false}>
        {!started && (
          <motion.div
            key="intro"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
            className="space-y-5"
          >
            <p className="rounded-2xl border border-border bg-card/60 p-4 text-sm leading-relaxed text-muted-foreground">
              {aiConsultantSection.intro}
            </p>
            <div className="rounded-2xl border border-primary/30 bg-primary/[0.06] p-4">
              <p className="text-[11px] uppercase tracking-[0.28em] text-primary/90">
                {aiConsultantSection.disclosureTitle}
              </p>
              <ul className="mt-3 space-y-2">
                {aiConsultantSection.disclosurePoints.map((point) => (
                  <li key={point} className="flex gap-2.5 text-sm leading-relaxed text-muted-foreground">
                    <Sparkle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" strokeWidth={1.5} />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-xs leading-relaxed text-muted-foreground/80">
                {aiConsultantSection.disclosureFooter}
              </p>
            </div>

            <OceanButton className="w-full sm:w-auto" onClick={start}>
              {aiConsultantSection.cta}
            </OceanButton>
          </motion.div>
        )}

        {started && !result && (
          <motion.div
            key={step.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
            className="space-y-4"
          >
            <div className="rounded-2xl border border-border bg-card/60 p-4">
              <p className="text-[11px] uppercase tracking-[0.28em] text-primary/90">
                Langkah {index + 1} / {consultantSteps.length}
              </p>
              <p className="mt-2 text-sm leading-relaxed text-foreground">{step.question}</p>
              {step.hint && (
                <p className="mt-1 text-xs text-muted-foreground">{step.hint}</p>
              )}
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              {step.options.map((option) => {
                const active = selected.includes(option.id);
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => choose(option.id)}
                    className={cn(
                      "flex items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-left text-sm transition-all duration-200",
                      active
                        ? "border-primary/60 bg-primary/10 text-foreground"
                        : "border-border bg-card/50 text-muted-foreground hover:border-primary/40 hover:text-foreground",
                    )}
                  >
                    <span className="min-w-0">{option.label}</span>
                    {active && <Check className="h-4 w-4 shrink-0 text-primary" />}
                  </button>
                );
              })}
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {index > 0 && (
                <OceanButton variant="ghost" size="sm" onClick={() => setIndex(index - 1)}>
                  <ChevronLeft className="h-4 w-4" /> Kembali
                </OceanButton>
              )}
              {step.multi && (
                <OceanButton
                  size="sm"
                  disabled={selected.length === 0}
                  onClick={nextMulti}
                  className="ml-auto"
                >
                  Lanjut
                </OceanButton>
              )}
            </div>
          </motion.div>
        )}

        {result && (
          <motion.div
            key="result"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="space-y-4"
          >
            <div className="rounded-2xl border border-primary/40 bg-primary/[0.07] p-5">
              <p className="flex items-center gap-2 text-[11px] uppercase tracking-[0.28em] text-primary/90">
                <Sparkle className="h-3.5 w-3.5" /> Rekomendasi KERJAKU
              </p>
              <h3 className="mt-3 font-display text-xl leading-tight text-foreground">
                {result.packageName}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {result.packageTagline}
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <SummaryCard label="Bisnis" value={result.businessCategory || "-"} />
              <SummaryCard label="Estimasi Kompleksitas" value={result.complexity} />
              <SummaryCard label="Masalah" value={result.problems.join(", ") || "-"} />
              <SummaryCard label="Kebutuhan" value={result.requirements.join(", ") || "-"} />
            </div>

            <div className="rounded-2xl border border-border bg-card/50 p-4">
              <p className="text-[11px] uppercase tracking-[0.28em] text-muted-foreground">
                Fitur Utama
              </p>
              <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                {result.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm text-foreground">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-card/50 px-4 py-3">
              <span className="text-[11px] uppercase tracking-[0.24em] text-muted-foreground">
                Kualifikasi
              </span>
              <span className="text-sm text-foreground">
                {result.qualification} · {result.score}/100
              </span>
            </div>

            <div className="rounded-2xl border border-border bg-card/50 p-4">
              <p className="text-[11px] uppercase tracking-[0.24em] text-muted-foreground">
                Arah Project
              </p>
              <p className="mt-2 text-sm leading-relaxed text-foreground">
                {result.packageTagline} Kesiapan budget: {result.budget || "-"} · Target waktu:{" "}
                {result.timeline || "-"} · Skala pengguna: {result.users || "-"}.
              </p>
            </div>

            {submitted ? (
              <div className="space-y-3">
                <p className="rounded-2xl border border-primary/40 bg-primary/10 px-5 py-4 text-sm leading-relaxed text-foreground">
                  Terima kasih. Rekomendasi dan data kebutuhan Anda sudah terkirim ke tim KERJAKU.
                  Kami akan menghubungi Anda melalui WhatsApp atau email.
                </p>
                <OceanButton variant="ghost" size="sm" onClick={reset}>
                  <RotateCcw className="h-4 w-4" /> Mulai Ulang
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
                  Analisa kebutuhan Anda sudah selesai. Masukkan kontak agar tim KERJAKU dapat
                  menyiapkan rekomendasi dan estimasi project.
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
      </AnimatePresence>
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
