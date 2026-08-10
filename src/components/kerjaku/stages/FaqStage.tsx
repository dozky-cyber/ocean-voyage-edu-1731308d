import { faqSection } from "@/lib/consultation-content";
import { Reveal } from "../Reveal";

export function FaqStage() {
  return (
    <section id="faq" className="relative px-5 py-20 sm:px-8">
      <div className="mx-auto max-w-3xl">
        <Reveal>
          <p className="text-[11px] uppercase tracking-[0.42em] text-primary/90">
            {faqSection.eyebrow}
          </p>
          <h2 className="mt-5 font-display text-[clamp(1.8rem,4.6vw,2.8rem)] leading-tight">
            {faqSection.title}
          </h2>
        </Reveal>

        <div className="mt-10 space-y-4">
          {faqSection.items.map((item, i) => (
            <Reveal key={item.q} delay={0.06 * i}>
              <details className="group rounded-[1.5rem] glass-panel p-5 sm:p-6">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-medium text-foreground sm:text-base">
                  <h3 className="font-display text-base leading-snug sm:text-lg">{item.q}</h3>
                  <span className="shrink-0 text-primary transition-transform duration-300 group-open:rotate-45">
                    +
                  </span>
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{item.a}</p>
              </details>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
