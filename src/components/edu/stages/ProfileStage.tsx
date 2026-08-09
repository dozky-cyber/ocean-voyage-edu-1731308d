import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { Waves } from "lucide-react";
import portraitAsset from "@/assets/adji-taufiq-portrait.png.asset.json";
import { profile } from "@/lib/edu-content";
import { Reveal } from "../Reveal";

export function ProfileStage() {
  const ref = useRef<HTMLElement | null>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const portraitY = useTransform(scrollYProgress, [0, 1], [60, -60]);
  const glowScale = useTransform(scrollYProgress, [0, 0.5, 1], [0.85, 1.05, 0.9]);




  return (
    <section id="profile" ref={ref} className="relative min-h-[100svh] px-5 py-32 sm:px-8">
      <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-center">
        <motion.div style={{ y: portraitY }} className="relative mx-auto w-full max-w-md">
          <motion.div
            style={{ scale: glowScale }}
            aria-hidden="true"
            className="absolute -inset-10 rounded-full bg-[radial-gradient(circle_at_50%_40%,color-mix(in_oklab,var(--violet-deep)_55%,transparent),transparent_70%)] blur-2xl"
          />
          <div className="relative overflow-hidden rounded-[2.5rem] glass-panel">
            <img
              src={portraitAsset.url}
              alt={`${profile.name} — ${profile.title}`}
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
              <p className="text-sm font-medium">{profile.name}</p>
              <p className="mt-1 flex items-center gap-2 text-[11px] uppercase tracking-[0.24em] text-primary/90">
                <Waves className="h-3.5 w-3.5" /> {profile.title}
              </p>
            </div>
          </div>

        </motion.div>

        <div>
          <Reveal>
            <p className="text-[11px] uppercase tracking-[0.42em] text-primary/90">
              {profile.eyebrow}
            </p>
          </Reveal>
          <Reveal delay={0.1}>
            <h2 className="mt-6 text-balance font-display text-[clamp(2.2rem,6vw,3.6rem)] leading-[1.05]">
              {profile.title}
            </h2>
          </Reveal>
          <Reveal delay={0.18}>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground">
              {profile.body}
            </p>
          </Reveal>
          <Reveal delay={0.26}>
            <ul className="mt-8 flex flex-wrap gap-2">
              {profile.skills.map((s) => (
                <li
                  key={s}
                  className="rounded-full bg-secondary/50 px-4 py-2 text-xs text-muted-foreground"
                >
                  {s}
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
