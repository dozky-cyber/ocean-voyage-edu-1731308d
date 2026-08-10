import { motion, useScroll, useTransform } from "framer-motion";
import { useRef, useState, type FormEvent } from "react";
import {
  ArrowUp,
  BarChart3,
  FileText,
  MapPin,
  MessageCircle,
  Mic,
  NotebookPen,
  Route,
  ScanSearch,
} from "lucide-react";
import { lab, buildDemoAnswer } from "@/lib/site-content";
import { useJourney } from "../JourneyProvider";
import { OceanButton } from "../OceanButton";
import { Reveal } from "../Reveal";

const cardIcons = {
  report: FileText,
  chart: BarChart3,
  notes: NotebookPen,
  voice: Mic,
  chat: MessageCircle,
  route: Route,
  location: MapPin,
  scan: ScanSearch,
} as const;

export function LabStage() {
  const ref = useRef<HTMLElement | null>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const cardsY = useTransform(scrollYProgress, [0, 1], [40, -40]);

  const { mode } = useJourney();
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<string[] | null>(null);

  const ask = (text: string) => {
    const q = text.trim();
    if (!q) return;
    setQuestion(q);
    setAnswer(buildDemoAnswer(q, mode));
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    ask(question);
  };

  return (
    <section id="lab" ref={ref} className="relative px-5 py-24 sm:px-8">
      <div className="mx-auto max-w-6xl">
        <Reveal>
          <p className="text-[11px] uppercase tracking-[0.42em] text-primary/90">{lab.eyebrow}</p>
        </Reveal>
        <Reveal delay={0.1}>
          <h2 className="mt-6 text-balance font-display text-[clamp(2.2rem,6vw,3.6rem)] leading-[1.05]">
            {lab.title}
          </h2>
        </Reveal>
        <Reveal delay={0.14}>
          <p className="mt-3 text-sm uppercase tracking-[0.2em] text-primary/80">{lab.subtitle}</p>
        </Reveal>
        <Reveal delay={0.18}>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground">
            {lab.body}
          </p>
        </Reveal>

        <motion.div
          style={{ y: cardsY }}
          className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
        >
          {lab.cards.map((c, i) => {
            const Icon = cardIcons[c.icon];
            return (
              <Reveal key={c.title} delay={0.05 * i}>
                <div className="flex h-full flex-col rounded-[2rem] glass-panel p-5 transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-2">
                  <span className="grid h-10 w-10 place-items-center rounded-2xl bg-primary/15 text-primary ring-1 ring-primary/30">
                    <Icon className="h-4.5 w-4.5" />
                  </span>
                  <h3 className="mt-5 font-display text-xl leading-tight">{c.title}</h3>
                  <p className="mt-1 text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                    {c.subtitle}
                  </p>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{c.note}</p>
                </div>
              </Reveal>
            );
          })}
        </motion.div>

        <div className="mx-auto mt-14 max-w-3xl">
          <Reveal delay={0.1}>
            <form
              onSubmit={onSubmit}
              className="rounded-[2rem] glass-panel p-4 sm:p-5"
              aria-label="Tanya demo lokal"
            >
              <label htmlFor="lab-question" className="sr-only">
                Tulis pertanyaanmu
              </label>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                <textarea
                  id="lab-question"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  rows={2}
                  placeholder="Tulis pertanyaanmu, misalnya: bagaimana mengotomatiskan laporan mingguan…"
                  className="min-h-[4.5rem] w-full resize-none rounded-2xl bg-secondary/40 px-4 py-3 text-sm text-foreground outline-none ring-1 ring-border transition focus:ring-primary/60"
                />
                <OceanButton
                  type="submit"
                  className="h-12 w-full sm:w-12 sm:min-w-0 sm:px-0"
                  aria-label="Kirim pertanyaan"
                  disabled={!question.trim()}
                >
                  <ArrowUp className="h-4 w-4" />
                </OceanButton>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {lab.examples.map((ex) => (
                  <button
                    key={ex}
                    type="button"
                    onClick={() => ask(ex)}
                    className="rounded-full border border-border px-3 py-1.5 text-[11px] text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground"
                  >
                    {ex}
                  </button>
                ))}
              </div>
            </form>
          </Reveal>

          {answer && (
            <motion.div
              initial={{ opacity: 0, y: 16, filter: "blur(8px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="mt-4 rounded-[2rem] glass-panel p-5"
              aria-live="polite"
            >
              <p className="text-[10px] uppercase tracking-[0.3em] text-primary/90">
                Jawaban demo lokal
              </p>
              <div className="mt-4 space-y-3">
                {answer.map((line, i) => (
                  <motion.p
                    key={line}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.45, delay: i * 0.12, ease: [0.22, 1, 0.36, 1] }}
                    className="text-sm leading-relaxed text-muted-foreground"
                  >
                    {line}
                  </motion.p>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </section>
  );
}
