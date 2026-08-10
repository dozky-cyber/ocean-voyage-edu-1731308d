import { whyKerjaku } from "@/lib/consultation-content";
import { Reveal } from "../Reveal";

export function WhyStage() {
  return (
    <section id="kenapa-kerjaku" className="relative px-5 py-20 sm:px-8">
      <div className="mx-auto max-w-5xl">
        <Reveal>
          <p className="text-[11px] uppercase tracking-[0.42em] text-primary/90">
            {whyKerjaku.eyebrow}
          </p>
          <h2 className="mt-5 font-display text-[clamp(1.8rem,4.6vw,2.8rem)] leading-tight">
            {whyKerjaku.title}
          </h2>
        </Reveal>

        <div className="mt-10 grid gap-5 sm:grid-cols-2">
          {whyKerjaku.cards.map((card, i) => (
            <Reveal key={card.title} delay={0.08 * i}>
              <article className="h-full rounded-[1.75rem] glass-panel p-6">
                <h3 className="font-display text-lg leading-tight">{card.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{card.body}</p>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
