import { analytics } from "@/lib/analytics";
import { servicePackageCta, servicePackages } from "@/lib/consultation-content";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel";
import { useEffect, useRef, useState } from "react";
import { Reveal } from "../Reveal";

export function ServicePackageStage() {
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  const trackRef = useRef<HTMLDivElement>(null);
  const [trackHeight, setTrackHeight] = useState<number | undefined>(undefined);

  useEffect(() => {
    if (!api) return;
    setCurrent(api.selectedScrollSnap());
    const onSelect = () => setCurrent(api.selectedScrollSnap());
    api.on("select", onSelect);
    return () => {
      api.off("select", onSelect);
    };
  }, [api]);

  // Track the active slide's own height so the carousel never reserves
  // space for the tallest package.
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const slide = track.children[current] as HTMLElement | undefined;
    if (!slide) return;

    const measure = () => setTrackHeight(slide.getBoundingClientRect().height);
    measure();

    const ro = new ResizeObserver(measure);
    ro.observe(slide);
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [current]);

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

        <Carousel
          setApi={setApi}
          opts={{ align: "start", loop: false, dragFree: false, containScroll: "trimSnaps" }}
          className="mt-10"
        >
          <CarouselContent
            ref={trackRef}
            className="-ml-5 items-start transition-[height] duration-500 ease-out"
            style={trackHeight ? { height: trackHeight } : undefined}
          >

            {servicePackages.packages.map((pkg, i) => (
              <CarouselItem key={pkg.title} className="pl-5 basis-[88%] sm:basis-[86%] lg:basis-4/5">
            <Reveal delay={0.08 * i}>
              <article
                className="relative overflow-hidden rounded-[1.75rem] glass-panel p-6 sm:p-8"
                onClick={() => analytics.servicePackageClick(pkg.level)}
              >
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
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="hidden sm:flex -left-3 border-primary/30 bg-background/40 text-primary hover:bg-primary/10" />
          <CarouselNext className="hidden sm:flex -right-3 border-primary/30 bg-background/40 text-primary hover:bg-primary/10" />
        </Carousel>

        <p className="mt-6 text-center text-xs text-muted-foreground/80">
          Geser untuk explore paket lainnya
        </p>

        <div className="mt-4 flex justify-center gap-2">
          {servicePackages.packages.map((pkg, i) => (
            <button
              key={pkg.title}
              type="button"
              aria-label={`Lihat ${pkg.title}`}
              onClick={() => api?.scrollTo(i)}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                current === i ? "w-8 bg-primary" : "w-2 bg-primary/25 hover:bg-primary/50"
              }`}
            />
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
