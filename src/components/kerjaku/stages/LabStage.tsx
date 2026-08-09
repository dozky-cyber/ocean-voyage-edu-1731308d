import { motion, useScroll, useTransform } from "framer-motion";
import { useRef, useState, type FormEvent } from "react";
import { ArrowUp, Bot, Sparkle, Workflow } from "lucide-react";
import { lab, buildDemoAnswer } from "@/lib/site-content";
import { useJourney } from "../JourneyProvider";
import { OceanButton } from "../OceanButton";
import { Reveal } from "../Reveal";

const cardIcons = [Sparkle, Workflow, Bot];

export function LabStage() {
  const ref = useRef<HTMLElement | null>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const cardsY = useTransform(scrollYProgress, [0, 1], [60, -60]);

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
    <section id="lab" ref={ref} className="relative px-5 py-28 sm:px-8">
      <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-center">
        <motion.div style={{ y: cardsY }} className="relative mx-auto w-full max-w-md space-y-4">
          <div
            aria-hidden="true"
            className="absolute -inset-10 rounded-full bg-[radial-gradient(circle_at_50%_40%,color-mix(in_oklab,var(--violet-deep)_55%,transparent),transparent_70%)] blur-2xl"
          />
          {lab.cards.map((c, i) => {
            const Icon = cardIcons[i % cardIcons.length];
            return (
              <motion.div
                key={c.title}
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 8 + i, repeat: Infinity, ease: "easeInOut" }}
                className="relative flex items-start gap-4 rounded-[2rem] glass-panel p-5"
              >
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-primary/15 text-primary ring-1 ring-primary/30">
                  <Icon className="h-5 w-5" />
                </span>
                <span>
                  <span className="block font-display text-xl leading-tight">{c.title}</span>
                  <span className="mt-1 block text-sm text-muted-foreground">{c.note}</span>
                </span>
              </motion.div>
            );
          })}
        </motion.div>

        <div>
          <Reveal>
            <p className="text-[11px] uppercase tracking-[0.42em] text-primary/90">{lab.eyebrow}</p>
          </Reveal>
          <Reveal delay={0.1}>
            <h2 className="mt-6 text-balance font-display text-[clamp(2.2rem,6vw,3.6rem)] leading-[1.05]">
              {lab.title}
            </h2>
          </Reveal>
          <Reveal delay={0.14}>
            <p className="mt-3 text-sm uppercase tracking-[0.2em] text-primary/80">
              {lab.subtitle}
            </p>
          </Reveal>
          <Reveal delay={0.18}>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground">
              {lab.body}
            </p>
          </Reveal>

          <Reveal delay={0.28}>
            <form
              onSubmit={onSubmit}
              className="mt-8 rounded-[2rem] glass-panel p-4 sm:p-5"
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
