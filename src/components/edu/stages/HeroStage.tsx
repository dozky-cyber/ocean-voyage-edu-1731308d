import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { ChevronDown } from "lucide-react";
import { brand, hero } from "@/lib/edu-content";
import { useEdu } from "../EduProvider";
import { GradeSwitch } from "../GradeSwitch";
import { OceanButton } from "../OceanButton";
import { Reveal } from "../Reveal";

export function HeroStage() {
  const ref = useRef<HTMLElement | null>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [0, -120]);
  const opacity = useTransform(scrollYProgress, [0, 0.85], [1, 0]);
  const blur = useTransform(scrollYProgress, [0, 1], ["blur(0px)", "blur(10px)"]);
  const { scrollTo, openPanel } = useEdu();

  return (
    <section
      id="hero"
      ref={ref}
      className="relative flex min-h-[100svh] items-center justify-center px-5 pb-24 pt-32 sm:px-8"
    >
      <motion.div
        style={{ y, opacity, filter: blur }}
        className="relative mx-auto w-full max-w-4xl text-center"
      >
        <Reveal>
          <p className="text-[11px] uppercase tracking-[0.42em] text-primary/90">{hero.eyebrow}</p>
        </Reveal>

        <Reveal delay={0.12}>
          <h1 className="mt-6 font-display text-[clamp(2.6rem,9vw,6.5rem)] font-semibold leading-[0.98] tracking-tight text-glow">
            {hero.title}
          </h1>
        </Reveal>

        <Reveal delay={0.22}>
          <p className="mx-auto mt-3 text-xs uppercase tracking-[0.36em] text-muted-foreground">
            {brand.name} — {brand.tagline}
          </p>
        </Reveal>

        <Reveal delay={0.32}>
          <p className="mx-auto mt-8 max-w-2xl text-balance text-base leading-relaxed text-muted-foreground sm:text-lg">
            {hero.subtitle}
          </p>
        </Reveal>

        <Reveal delay={0.44}>
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <OceanButton className="w-full sm:w-56" onClick={() => scrollTo("products")}>
              {hero.primaryCta}
            </OceanButton>
            <OceanButton
              variant="secondary"
              className="w-full sm:w-56"
              onClick={() => scrollTo("profile")}
            >
              {hero.secondaryCta}
            </OceanButton>
          </div>
        </Reveal>

        <Reveal delay={0.56}>
          <div className="mt-14 flex justify-center">
            <GradeSwitch />
          </div>
        </Reveal>
      </motion.div>

      <motion.div
        style={{ opacity }}
        className="pointer-events-none absolute bottom-8 left-1/2 -translate-x-1/2 text-muted-foreground"
        aria-hidden="true"
      >
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
          className="flex flex-col items-center gap-2"
        >
          <span className="text-[10px] uppercase tracking-[0.3em]">Gulir untuk menyelam</span>
          <ChevronDown className="h-4 w-4" />
        </motion.div>
      </motion.div>
    </section>
  );
}
