import { analytics } from "@/lib/analytics";
import { ctaLabels, trustCta } from "@/lib/consultation-content";
import { Reveal } from "../Reveal";

export function TrustCtaStage() {
  return (
    <section className="relative px-5 py-14 sm:px-8">
      <div className="mx-auto max-w-4xl">
        <Reveal>
          <div className="flex flex-col items-start gap-6 rounded-[2rem] glass-panel p-7 sm:flex-row sm:items-center sm:justify-between sm:p-9">
            <div className="max-w-xl">
              <h2 className="font-display text-[clamp(1.5rem,3.6vw,2.1rem)] leading-tight">
                {trustCta.title}
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{trustCta.body}</p>
            </div>
            <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
            <a
              href="#konsultasi"
              onClick={() => analytics.consultationButtonClick("trust_cta", trustCta.cta)}
              className="inline-flex h-12 shrink-0 items-center justify-center rounded-full bg-primary px-7 text-sm font-medium text-primary-foreground shadow-[0_18px_50px_-18px_var(--lagoon)] transition-transform duration-300 hover:-translate-y-0.5"
            >
              {trustCta.cta}
            </a>
            <a
              href="#layanan"
              className="inline-flex h-12 shrink-0 items-center justify-center rounded-full border border-primary/40 px-6 text-sm text-primary transition-colors hover:bg-primary/10"
            >
              {ctaLabels.secondary}
            </a>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
