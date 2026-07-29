import { motion, useScroll, useTransform } from "framer-motion";
import { useRef, useState, type FormEvent } from "react";
import { ArrowUp, Waves } from "lucide-react";
import portrait from "@/assets/ai-mentor-portrait.jpg";
import { ai, buildDemoAnswer } from "@/lib/edu-content";
import { useEdu } from "../EduProvider";
import { OceanButton } from "../OceanButton";
import { Reveal } from "../Reveal";

export function AiStage() {
  const ref = useRef<HTMLElement | null>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const portraitY = useTransform(scrollYProgress, [0, 1], [60, -60]);
  const glowScale = useTransform(scrollYProgress, [0, 0.5, 1], [0.85, 1.05, 0.9]);

  const { grade } = useEdu();
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<string[] | null>(null);

  const ask = (text: string) => {
    const q = text.trim();
    if (!q) return;
    setQuestion(q);
    setAnswer(buildDemoAnswer(q, grade));
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    ask(question);
  };

  return (
    <section id="ai" ref={ref} className="relative min-h-[110svh] px-5 py-32 sm:px-8">
      <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-center">
        {/* Portrait — always visible, layered with glow and parallax */}
        <motion.div style={{ y: portraitY }} className="relative mx-auto w-full max-w-md">
          <motion.div
            style={{ scale: glowScale }}
            aria-hidden="true"
            className="absolute -inset-10 rounded-full bg-[radial-gradient(circle_at_50%_40%,color-mix(in_oklab,var(--violet-deep)_55%,transparent),transparent_70%)] blur-2xl"
          />
          <div className="relative overflow-hidden rounded-[2.5rem] glass-panel">
            <img
              src={portrait}
              alt={ai.portraitCaption}
              width={1024}
              height={1280}
              loading="lazy"
              decoding="async"
              className="aspect-[4/5] w-full object-cover object-[50%_25%]"
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_top,color-mix(in_oklab,var(--abyss)_85%,transparent),transparent_55%)]"
            />
            <div className="absolute inset-x-0 bottom-0 p-6">
              <p className="text-sm font-medium">{ai.portraitCaption}</p>
              <p className="mt-1 flex items-center gap-2 text-[11px] uppercase tracking-[0.24em] text-primary/90">
                <Waves className="h-3.5 w-3.5" /> Demo lokal · jenjang {grade}
              </p>
            </div>
          </div>
        </motion.div>

        <div>
          <Reveal>
            <p className="text-[11px] uppercase tracking-[0.42em] text-primary/90">{ai.eyebrow}</p>
          </Reveal>
          <Reveal delay={0.1}>
            <h2 className="mt-6 text-balance font-display text-[clamp(2.2rem,6vw,3.6rem)] leading-[1.05]">
              {ai.title}
            </h2>
          </Reveal>
          <Reveal delay={0.18}>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground">
              {ai.body}
            </p>
          </Reveal>

          <Reveal delay={0.26}>
            <ul className="mt-7 flex flex-wrap gap-2">
              {ai.benefits.map((b) => (
                <li
                  key={b}
                  className="rounded-full bg-secondary/50 px-4 py-2 text-xs text-muted-foreground"
                >
                  {b}
                </li>
              ))}
            </ul>
          </Reveal>

          <Reveal delay={0.34}>
            <form
              onSubmit={onSubmit}
              className="mt-8 rounded-[2rem] glass-panel p-4 sm:p-5"
              aria-label="Tanya AI pendamping"
            >
              <label htmlFor="ai-question" className="sr-only">
                Tulis pertanyaanmu
              </label>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                <textarea
                  id="ai-question"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  rows={2}
                  placeholder="Tulis pertanyaanmu, misalnya: jelaskan gaya gravitasi…"
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
                {ai.examples.map((ex) => (
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
