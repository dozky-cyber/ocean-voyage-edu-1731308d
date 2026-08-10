import { AnimatePresence, motion, useScroll, useTransform } from "framer-motion";
import { useRef, useState } from "react";
import { Bot, Database, Layers } from "lucide-react";
import { systems, worlds, type WorldId } from "@/lib/site-content";
import { useJourney } from "../JourneyProvider";
import { OceanButton } from "../OceanButton";
import { Reveal } from "../Reveal";

const icons: Record<WorldId, typeof Layers> = {
  web: Layers,
  data: Database,
  ai: Bot,
};

/** Spatial offsets so the objects float at different depths, not a flat grid. */
const offsets = ["md:translate-y-0", "md:translate-y-14", "md:-translate-y-8", "md:translate-y-6"];

export function ShowcaseStage() {
  const ref = useRef<HTMLElement | null>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const drift = useTransform(scrollYProgress, [0, 1], [70, -70]);
  const [selected, setSelected] = useState<WorldId>("web");
  const { openPanel, scrollTo } = useJourney();

  const active = worlds.find((w) => w.id === selected)!;

  return (
    <section id="showcase" ref={ref} className="relative min-h-[110svh] px-5 py-32 sm:px-8">
      <div className="mx-auto max-w-6xl">
        <Reveal>
          <p className="text-[11px] uppercase tracking-[0.42em] text-primary/90">
            {systems.eyebrow}
          </p>
        </Reveal>
        <Reveal delay={0.1}>
          <h2 className="mt-6 max-w-3xl text-balance font-display text-[clamp(2.2rem,6vw,4rem)] leading-[1.05]">
            {systems.title}
          </h2>
        </Reveal>
        <Reveal delay={0.18}>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground">
            {systems.body}
          </p>
        </Reveal>

        <motion.div style={{ y: drift }} className="mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {worlds.map((w, i) => {
            const Icon = icons[w.id];
            const isActive = selected === w.id;
            return (
              <Reveal key={w.id} delay={0.08 * i}>
                <button
                  type="button"
                  onClick={() => setSelected(w.id)}
                  aria-pressed={isActive}
                  className={`group relative flex h-full w-full flex-col rounded-[2rem] glass-panel p-6 text-left transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${offsets[i]} ${
                    isActive ? "ring-1 ring-primary/60" : ""
                  }`}
                >
                  <span className="grid h-11 w-11 place-items-center rounded-2xl bg-primary/15 text-primary ring-1 ring-primary/30">
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="mt-6 text-[10px] uppercase tracking-[0.28em] text-muted-foreground">
                    {w.depth} · {w.subtitle}
                  </span>
                  <span className="mt-2 font-display text-2xl leading-tight">{w.title}</span>
                  <span className="mt-3 text-sm leading-relaxed text-muted-foreground">
                    {w.body}
                  </span>
                </button>
              </Reveal>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
