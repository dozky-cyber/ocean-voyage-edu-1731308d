import { analytics } from "@/lib/analytics";
import { servicePackageCta, servicePackages } from "@/lib/consultation-content";
import { Reveal } from "../Reveal";

export function ServicePackageStage() {
  return (
    <section id="paket-layanan" className="relative px-5 py-20 sm:px-8">
      <div className="mx-auto max-w-5xl">
        <Reveal>
          <p className="text-[11px] uppercase tracking-[0.42em] text-primary/90">
            {servicePackages.eyebrow}
          </p>
          <h2 className="mt-5 font-display text-[clamp(1.8rem,4.6vw,2.8rem)] leading-tight">
            {servicePackages.title}
          </h2>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            {servicePackages.subtitle}
          </p>
        </Reveal>

        <div className="mt-10 grid gap-5">
          {servicePackages.packages.map((pkg, i) => (
            <Reveal key={pkg.title} delay={0.08 * i}>
              <article className="relative overflow-hidden rounded-[1.75rem] glass-panel p-6 sm:p-8">
                <div
                  className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-primary/70 via-primary/30 to-transparent"
                  aria-hidden="true"
                />
                <div className="relative">
                  <span className="text-[11px] uppercase tracking-[0.3em] text-primary/80">
                    {pkg.level}
                  </span>
                  <h3 className="mt-2 font-display text-xl leading-tight sm:text-2xl">
                    {pkg.title}
                  </h3>
                  <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted-foreground">
                    {pkg.description}
                  </p>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {pkg.target.map((t) => (
                      <span
                        key={t}
                        className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs text-primary/90"
                      >
                        {t}
                      </span>
                    ))}
                  </div>

                  {pkg.variant === "groups" ? (
                    <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                      {pkg.featureGroups.map((group) => (
                        <div key={group.name}>
                          <h4 className="text-xs font-medium uppercase tracking-wider text-foreground/90">
                            {group.name}
                          </h4>
                          <ul className="mt-2 grid gap-1.5">
                            {group.items.map((item) => (
                              <li
                                key={item}
                                className="flex items-start gap-2 text-sm text-muted-foreground"
                              >
                                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/80" />
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <ul className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                      {pkg.features.map((feature) => (
                        <li
                          key={feature}
                          className="flex items-start gap-2 text-sm text-muted-foreground"
                        >
                          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/80" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  )}


                  {"example" in pkg && pkg.example && (
                    <div className="mt-5 inline-flex items-center rounded-2xl bg-primary/10 px-4 py-3 text-sm text-primary/90">
                      <span className="font-medium">Example:</span>
                      <span className="ml-2">{pkg.example}</span>
                    </div>
                  )}

                  {"useCases" in pkg && pkg.useCases && (
                    <div className="mt-5">
                      <h4 className="text-xs font-medium uppercase tracking-wider text-foreground/90">
                        Example use cases
                      </h4>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {pkg.useCases.map((useCase) => (
                          <span
                            key={useCase}
                            className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs text-primary/90"
                          >
                            {useCase}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </article>
            </Reveal>
          ))}
        </div>

        <Reveal delay={0.1}>
          <div className="mt-12 rounded-[2rem] glass-panel p-7 sm:p-9">
            <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="max-w-xl">
                <h3 className="font-display text-[clamp(1.3rem,3vw,1.8rem)] leading-tight">
                  {servicePackageCta.title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  {servicePackageCta.body}
                </p>
              </div>
              <a
                href="#konsultasi"
                onClick={() => analytics.consultationButtonClick("service_package", servicePackageCta.cta)}
                className="inline-flex h-12 shrink-0 items-center justify-center rounded-full bg-primary px-7 text-sm font-medium text-primary-foreground shadow-[0_18px_50px_-18px_var(--lagoon)] transition-transform duration-300 hover:-translate-y-0.5"
              >
                {servicePackageCta.cta}
              </a>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
