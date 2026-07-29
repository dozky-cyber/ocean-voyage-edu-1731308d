import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { pastel } from "@/lib/edu-content";
import { Reveal } from "../Reveal";

const positions = [
  "left-[4%] top-[14%]",
  "right-[6%] top-[8%]",
  "left-[12%] bottom-[16%]",
  "right-[10%] bottom-[20%]",
  "left-[44%] top-[4%]",
  "right-[30%] bottom-[6%]",
];

export function PastelStage() {
  const ref = useRef<HTMLElement | null>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const slow = useTransform(scrollYProgress, [0, 1], [80, -80]);
  const fast = useTransform(scrollYProgress, [0, 1], [160, -160]);
  const textY = useTransform(scrollYProgress, [0, 1], [40, -40]);

  return (
    <section
      id="pastel"
      ref={ref}
      className="relative flex min-h-[110svh] items-center justify-center overflow-hidden px-5 py-32 sm:px-8"
    >
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        {pastel.fragments.map((f, i) => (
          <motion.div
            key={f.label}
            style={{ y: i % 2 === 0 ? slow : fast }}
            className={`absolute hidden ${positions[i]} md:block`}
          >
            <motion.div
              animate={{ y: [0, -14, 0], rotate: [0, i % 2 ? 2.5 : -2.5, 0] }}
              transition={{ duration: 9 + i, repeat: Infinity, ease: "easeInOut" }}
              className="w-40 rounded-3xl glass-panel px-5 py-4 text-left"
            >
              <p className="font-display text-lg">{f.label}</p>
              <p className="mt-1 text-[11px] text-muted-foreground">{f.note}</p>
            </motion.div>
          </motion.div>
        ))}
      </div>

      <motion.div style={{ y: textY }} className="relative mx-auto max-w-2xl text-center">
        <Reveal>
          <p className="text-[11px] uppercase tracking-[0.42em] text-primary/90">
            {pastel.eyebrow}
          </p>
        </Reveal>
        <Reveal delay={0.1}>
          <h2 className="mt-6 text-balance font-display text-[clamp(2.2rem,6vw,4rem)] leading-[1.05]">
            {pastel.title}
          </h2>
        </Reveal>
        <Reveal delay={0.2}>
          <p className="mt-6 text-base leading-relaxed text-muted-foreground">{pastel.body}</p>
        </Reveal>

        <div className="mt-10 grid grid-cols-2 gap-3 md:hidden">
          {pastel.fragments.map((f, i) => (
            <Reveal key={f.label} delay={0.05 * i}>
              <div className="rounded-2xl glass-panel px-4 py-3 text-left">
                <p className="font-display text-base">{f.label}</p>
                <p className="mt-1 text-[11px] text-muted-foreground">{f.note}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </motion.div>
    </section>
  );
}
