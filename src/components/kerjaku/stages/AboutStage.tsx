import { aboutKerjaku } from "@/lib/consultation-content";
import { Reveal } from "../Reveal";

export function AboutStage() {
  return (
    <section id="tentang" className="relative px-5 py-20 sm:px-8">
      <div className="mx-auto max-w-3xl">
        <Reveal>
          <p className="text-[11px] uppercase tracking-[0.42em] text-primary/90">
            {aboutKerjaku.eyebrow}
          </p>
          <h2 className="mt-5 font-display text-[clamp(1.8rem,4.6vw,2.8rem)] leading-tight">
            {aboutKerjaku.title}
          </h2>
          <div className="mt-7 rounded-[1.75rem] glass-panel p-6 sm:p-8">
            <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
              {aboutKerjaku.body}
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
