import { Puzzle, Bot, Layers, Headphones } from "lucide-react";
import { trustReasons } from "@/lib/consultation-content";
import { Reveal } from "../Reveal";

const iconMap = {
  puzzle: Puzzle,
  bot: Bot,
  layers: Layers,
  headphones: Headphones,
};

export function TrustReasonsStage() {
  return (
    <section id="why-build" className="relative px-5 py-16 sm:px-8">
      <div className="mx-auto max-w-5xl">
        <Reveal>
          <p className="text-[11px] uppercase tracking-[0.42em] text-primary/90">
            {trustReasons.eyebrow}
          </p>
          <h2 className="mt-5 font-display text-[clamp(1.8rem,4.6vw,2.8rem)] leading-tight">
            {trustReasons.title}
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            {trustReasons.subtitle}
          </p>
        </Reveal>

        <div className="mt-10 grid gap-5 sm:grid-cols-2">
          {trustReasons.cards.map((card, i) => {
            const Icon = iconMap[card.icon];
            return (
              <Reveal key={card.title} delay={0.08 * i}>
                <article className="h-full rounded-[1.75rem] glass-panel p-6">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                    <Icon className="h-5 w-5 text-primary" strokeWidth={1.5} />
                  </div>
                  <h3 className="mt-4 font-display text-lg leading-tight">{card.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{card.body}</p>
                </article>
              </Reveal>
            );
          })}
        </div>

        <Reveal delay={0.32}>
          <p className="mt-10 text-center text-xs tracking-wide text-muted-foreground/80">
            {trustReasons.techLine}
          </p>
        </Reveal>
      </div>
    </section>
  );
}
