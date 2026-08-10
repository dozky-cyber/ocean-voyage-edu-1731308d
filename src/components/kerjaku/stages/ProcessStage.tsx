import { processKerjaku } from "@/lib/consultation-content";
import { Reveal } from "../Reveal";

export function ProcessStage() {
  return (
    <section id="cara-kerja" className="relative px-5 py-20 sm:px-8">
      <div className="mx-auto max-w-5xl">
        <Reveal>
          <p className="text-[11px] uppercase tracking-[0.42em] text-primary/90">
            {processKerjaku.eyebrow}
          </p>
          <h2 className="mt-5 font-display text-[clamp(1.8rem,4.6vw,2.8rem)] leading-tight">
            {processKerjaku.title}
          </h2>
        </Reveal>

        <ol className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {processKerjaku.steps.map((item, i) => (
            <Reveal key={item.step} delay={0.08 * i}>
              <li className="h-full list-none rounded-[1.75rem] glass-panel p-6">
                <span className="font-display text-2xl text-primary/90">{item.step}</span>
                <h3 className="mt-3 font-display text-lg leading-tight">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.body}</p>
              </li>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  );
}
