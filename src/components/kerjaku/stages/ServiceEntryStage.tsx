import { Link } from "@tanstack/react-router";
import { Reveal } from "../Reveal";

export function ServiceEntryStage() {
  return (
    <section id="service" className="relative px-5 py-16 sm:px-8">
      <div className="mx-auto max-w-4xl">
        <Reveal>
          <div className="flex flex-col gap-6 rounded-[2rem] glass-panel p-7 sm:flex-row sm:items-center sm:justify-between sm:p-9">
            <div className="max-w-xl">
              <p className="text-[11px] uppercase tracking-[0.42em] text-primary/90">
                Build With KERJAKU
              </p>
              <h2 className="mt-4 font-display text-[clamp(1.5rem,3.6vw,2.1rem)] leading-tight">
                Punya masalah kerja yang ingin dijadikan sistem?
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                Website, landing page, web application, dashboard, hingga AI dan automation — dibuat
                mengikuti kebutuhan dan alur kerja nyata.
              </p>
            </div>
            <Link
              to="/jasa-pembuatan-website-aplikasi-landing-page"
              className="inline-flex h-12 shrink-0 items-center justify-center rounded-full border border-primary/40 px-6 text-sm text-primary transition-colors hover:bg-primary/10"
            >
              Jasa &amp; Project
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
