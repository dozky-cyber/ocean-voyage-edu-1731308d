import { analytics } from "@/lib/analytics";
import { ctaLabels, serviceCategories } from "@/lib/consultation-content";
import { Reveal } from "../Reveal";

export function ServicesStage() {
  return (
    <section id="layanan" className="relative px-5 py-20 sm:px-8">
      <div className="mx-auto max-w-5xl">
        <Reveal>
          <p className="text-[11px] uppercase tracking-[0.42em] text-primary/90">
            {serviceCategories.eyebrow}
          </p>
          <h2 className="mt-5 font-display text-[clamp(1.8rem,4.6vw,2.8rem)] leading-tight">
            {serviceCategories.title}
          </h2>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            {serviceCategories.body}
          </p>
        </Reveal>

        <div className="mt-10 grid gap-5 sm:grid-cols-2">
          {serviceCategories.items.map((item, i) => (
            <Reveal key={item.title} delay={0.08 * i}>
              <article className="h-full rounded-[1.75rem] glass-panel p-6">
                <h3 className="font-display text-lg leading-tight">{item.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{item.body}</p>
              </article>
            </Reveal>
          ))}
        </div>

        <Reveal delay={0.1}>
          <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
            <a
              href="#konsultasi"
              onClick={() => analytics.consultationButtonClick("services", ctaLabels.primary)}
              className="inline-flex h-12 items-center justify-center rounded-full bg-primary px-7 text-sm font-medium text-primary-foreground shadow-[0_18px_50px_-18px_var(--lagoon)] transition-transform duration-300 hover:-translate-y-0.5"
            >
              {ctaLabels.primary}
            </a>
            <a
              href="#products"
              className="inline-flex h-12 items-center justify-center rounded-full border border-primary/40 px-7 text-sm text-primary transition-colors hover:bg-primary/10"
            >
              Lihat Produk
            </a>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
