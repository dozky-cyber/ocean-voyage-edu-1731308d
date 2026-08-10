import { portfolioCta } from "@/lib/consultation-content";
import { Reveal } from "../Reveal";
import { OceanButton } from "../OceanButton";

export function PortfolioCtaStage() {
  return (
    <section className="relative px-5 py-14 sm:px-8">
      <div className="mx-auto max-w-4xl">
        <Reveal>
          <div className="rounded-[2rem] glass-panel p-8 text-center sm:p-10">
            <h2 className="font-display text-[clamp(1.8rem,4.6vw,2.8rem)] leading-tight">
              {portfolioCta.title}
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              {portfolioCta.body}
            </p>
            <div className="mt-8">
              <a href="#konsultasi">
                <OceanButton>{portfolioCta.cta}</OceanButton>
              </a>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
