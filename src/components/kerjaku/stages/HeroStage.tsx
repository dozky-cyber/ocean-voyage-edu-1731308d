import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { ChevronDown } from "lucide-react";
import { hero } from "@/lib/site-content";
import { useJourney } from "../JourneyProvider";
import { OceanButton } from "../OceanButton";
import { Reveal } from "../Reveal";

export function HeroStage() {
  const ref = useRef<HTMLElement | null>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [0, -120]);
  const opacity = useTransform(scrollYProgress, [0, 0.85], [1, 0]);
  const blur = useTransform(scrollYProgress, [0, 1], ["blur(0px)", "blur(10px)"]);
  const { scrollTo } = useJourney();

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
          <h1
            className="hero-wordmark mx-auto leading-[0.92]"
            style={{ fontSize: "clamp(3.2rem, 15vw, 7.5rem)" }}
          >
            KERJ<span className="wordmark-a">A</span>KU
          </h1>
        </Reveal>

        <Reveal delay={0.12}>
          <p
            className="mt-3 whitespace-nowrap font-display font-medium leading-[1.1] tracking-[-0.01em] text-foreground text-glow"
            style={{ fontSize: "clamp(1.35rem, 6.4vw, 3.2rem)" }}
          >
            {hero.title}
          </p>
        </Reveal>

        <Reveal delay={0.24}>
          <p className="mx-auto mt-5 max-w-xl text-balance text-sm leading-relaxed text-muted-foreground sm:text-base">
            {hero.subtitle}
          </p>
        </Reveal>

        <Reveal delay={0.4}>
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
