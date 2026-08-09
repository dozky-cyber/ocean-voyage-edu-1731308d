import { AnimatePresence, motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { products, projects } from "@/lib/edu-content";
import { useEdu } from "../EduProvider";
import { GradeSwitch } from "../GradeSwitch";
import { Reveal } from "../Reveal";

const offsets = ["md:translate-y-0", "md:translate-y-12", "md:-translate-y-6"];

export function ProductsStage() {
  const ref = useRef<HTMLElement | null>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const drift = useTransform(scrollYProgress, [0, 1], [60, -60]);
  const { grade } = useEdu();

  const list = projects[grade];

  return (
    <section id="products" ref={ref} className="relative min-h-[110svh] px-5 py-32 sm:px-8">
      <div className="mx-auto max-w-6xl">
        <Reveal>
          <p className="text-[11px] uppercase tracking-[0.42em] text-primary/90">
            {products.eyebrow}
          </p>
        </Reveal>
        <Reveal delay={0.1}>
          <h2 className="mt-6 max-w-3xl text-balance font-display text-[clamp(2.2rem,6vw,4rem)] leading-[1.05]">
            {products.title}
          </h2>
        </Reveal>
        <Reveal delay={0.18}>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground">
            {products.body}
          </p>
        </Reveal>
        <Reveal delay={0.24}>
          <div className="mt-8">
            <GradeSwitch compact />
          </div>
        </Reveal>

        <motion.div style={{ y: drift }} className="mt-14 grid gap-5 md:grid-cols-3">
          <AnimatePresence mode="wait">
            {list.map((p, i) => (
              <motion.article
                key={grade + p.name}
                initial={{ opacity: 0, y: 24, filter: "blur(8px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, y: -14, filter: "blur(8px)" }}
                transition={{ duration: 0.55, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
                className={`relative flex h-full flex-col rounded-[2rem] glass-panel p-6 transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-2 ${offsets[i % 3]}`}
              >
                {p.status && (
                  <span className="absolute right-6 top-6 rounded-full bg-primary/15 px-3 py-1 text-[10px] font-medium uppercase tracking-[0.22em] text-primary ring-1 ring-primary/40">
                    {p.status}
                  </span>
                )}
                <h3 className="max-w-[70%] font-display text-2xl leading-tight">{p.name}</h3>
                <p className="mt-2 text-[10px] uppercase tracking-[0.24em] text-muted-foreground">
                  {p.category}
                </p>
                <p className="mt-5 text-sm leading-relaxed text-muted-foreground">
                  {p.description}
                </p>
                {p.focus && (
                  <ul className="mt-6 space-y-2">
                    {p.focus.map((f) => (
                      <li key={f} className="flex items-start gap-3 text-sm text-muted-foreground">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </motion.article>
            ))}
          </AnimatePresence>
        </motion.div>
      </div>
    </section>
  );
}
