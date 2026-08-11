import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Bot, Check, ChevronLeft, RotateCcw, Sparkle } from "lucide-react";
import {
  aiConsultantSection,
  buildRecommendation,
  consultantSteps,
  emptyAnswers,
  type ConsultantAnswers,
  type ConsultantResult,
} from "@/lib/ai-consultant";
import { analytics } from "@/lib/analytics";
import { saveAiConsultation } from "@/lib/lead-journey";
import { cn } from "@/lib/utils";
import { OceanButton } from "./OceanButton";

type Props = {
  source: "section" | "floating";
  onDiscuss?: () => void;
  compact?: boolean;
};

function scrollToConsultation() {
  if (typeof document === "undefined") return;
  document.getElementById("konsultasi")?.scrollIntoView({ behavior: "smooth", block: "start" });
}

export function AiConsultantChat({ source, onDiscuss, compact = false }: Props) {
  const [started, setStarted] = useState(false);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<ConsultantAnswers>(emptyAnswers);
  const [result, setResult] = useState<ConsultantResult | null>(null);

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

            <div className="flex flex-wrap items-center gap-3">
              <OceanButton onClick={discuss}>Diskusikan Project</OceanButton>
              <OceanButton variant="ghost" size="sm" onClick={reset}>
                <RotateCcw className="h-4 w-4" /> Ulangi
              </OceanButton>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
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
