import { aiConsultantSection } from "@/lib/ai-consultant";
import { AiConsultantChat } from "../AiConsultantChat";
import { Reveal } from "../Reveal";

export function AiConsultantStage() {
  return (
    <section id="ai-consultant" className="relative px-5 py-20 sm:px-8">
      <div className="mx-auto max-w-3xl">
        <Reveal>
          <p className="text-[11px] uppercase tracking-[0.42em] text-primary/90">
            {aiConsultantSection.eyebrow}
          </p>
          <h2 className="mt-5 font-display text-[clamp(1.8rem,4.6vw,2.8rem)] leading-tight">
            {aiConsultantSection.title}
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            {aiConsultantSection.subtitle}
          </p>
        </Reveal>

        <Reveal delay={0.12}>
          <div className="mt-9 rounded-[2rem] glass-panel p-6 sm:p-8">
            <AiConsultantChat source="section" />
          </div>
        </Reveal>
      </div>
    </section>
  );
}
