import { createFileRoute, Link } from "@tanstack/react-router";
import { brand, projects } from "@/lib/site-content";
import {
  serviceAudience,
  serviceCategories,
  serviceCta,
  serviceFaq,
  serviceHero,
  serviceMeta,
  serviceProblems,
  serviceProcess,
} from "@/lib/service-content";

export const Route = createFileRoute("/jasa-pembuatan-website-aplikasi-landing-page")({
  head: () => ({
    meta: [
      { title: serviceMeta.title },
      { name: "description", content: serviceMeta.description },
      { name: "robots", content: "index, follow" },
      { property: "og:title", content: serviceMeta.title },
      { property: "og:description", content: serviceMeta.description },
      { property: "og:type", content: "website" },
      { property: "og:site_name", content: "KERJAKU" },
      { property: "og:url", content: serviceMeta.url },
      { property: "og:image", content: "https://kerjaku.space/og-image.png" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: serviceMeta.title },
      { name: "twitter:description", content: serviceMeta.description },
      { name: "twitter:image", content: "https://kerjaku.space/og-image.png" },
    ],
    links: [{ rel: "canonical", href: serviceMeta.url }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Service",
          name: "Website, Web Application & Digital System Development",
          serviceType:
            "Pembuatan website, landing page, web application, dashboard, dan automation",
          description: serviceMeta.description,
          url: serviceMeta.url,
          areaServed: "ID",
          provider: {
            "@type": "Organization",
            name: "KERJAKU",
            url: "https://kerjaku.space/",
            email: "cs@kerjaku.space",
          },
        }),
      },
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: serviceFaq.map((item) => ({
            "@type": "Question",
            name: item.q,
            acceptedAnswer: { "@type": "Answer", text: item.a },
          })),
        }),
      },
    ],
  }),
  component: ServicePage,
});

const mailto = `mailto:${brand.contactEmail}`;

function ServicePage() {
  return (
    <div className="relative min-h-screen bg-background text-foreground">
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 -z-10"
        style={{
          background:
            "radial-gradient(120% 80% at 50% -10%, color-mix(in oklab, var(--primary) 16%, transparent), transparent 60%), linear-gradient(to bottom, var(--abyss, #04121f), var(--background))",
        }}
      />

      <header className="mx-auto flex max-w-5xl items-center justify-between px-5 py-6 sm:px-8">
        <Link to="/" className="nav-wordmark text-sm tracking-[0.22em]">
          KERJAKU
        </Link>
        <Link to="/" className="text-xs text-muted-foreground hover:text-foreground">
          Kembali ke Beranda
        </Link>
      </header>

      <main className="mx-auto max-w-5xl px-5 pb-24 sm:px-8">
        <section className="pt-8 sm:pt-14">
          <p className="text-[11px] uppercase tracking-[0.42em] text-primary/90">
            {serviceHero.eyebrow}
          </p>
          <h1 className="mt-6 max-w-3xl text-balance font-display text-[clamp(2rem,5.6vw,3.6rem)] leading-[1.08]">
            {serviceMeta.h1}
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground">
            {serviceHero.body}
          </p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <a
              href={mailto}
              className="inline-flex h-12 items-center justify-center rounded-full bg-primary px-7 text-sm font-medium text-primary-foreground transition-transform hover:-translate-y-0.5"
            >
              {serviceHero.primaryCta}
            </a>
            <Link
              to="/"
              hash="products"
              className="inline-flex h-12 items-center justify-center rounded-full border border-border bg-card px-7 text-sm text-foreground transition-colors hover:border-primary/50"
            >
              {serviceHero.secondaryCta}
            </Link>
          </div>
        </section>

        <section className="mt-20" aria-labelledby="masalah">
          <h2 id="masalah" className="font-display text-[clamp(1.6rem,4vw,2.4rem)] leading-tight">
            {serviceProblems.title}
          </h2>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            {serviceProblems.intro}
          </p>
          <ul className="mt-7 grid gap-3 sm:grid-cols-2">
            {serviceProblems.items.map((item) => (
              <li
                key={item}
                className="rounded-2xl glass-panel px-5 py-4 text-sm leading-relaxed text-muted-foreground"
              >
                {item}
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-20" aria-labelledby="layanan">
          <h2 id="layanan" className="font-display text-[clamp(1.6rem,4vw,2.4rem)] leading-tight">
            Layanan KERJAKU
          </h2>
          <div className="mt-8 grid gap-5 md:grid-cols-2">
            {serviceCategories.map((cat) => (
              <article key={cat.id} id={cat.id} className="rounded-[1.75rem] glass-panel p-6">
                <h3 className="font-display text-xl leading-tight">{cat.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-primary/90">{cat.lead}</p>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{cat.body}</p>
                <ul className="mt-5 space-y-2 text-sm text-muted-foreground">
                  {cat.points.map((p) => (
                    <li key={p} className="flex gap-2">
                      <span aria-hidden="true" className="text-primary">
                        —
                      </span>
                      <span>{p}</span>
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-20" aria-labelledby="bukti">
          <h2 id="bukti" className="font-display text-[clamp(1.6rem,4vw,2.4rem)] leading-tight">
            Produk yang Menjadi Bukti Cara Kami Membangun
          </h2>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            Produk berikut dibangun sendiri oleh KERJAKU dan menjadi bukti cara kerja dari masalah
            menjadi sistem yang dipakai.
          </p>
          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {projects.Products.map((p) => (
              <article key={p.name} className="rounded-[1.75rem] glass-panel p-6">
                <h3 className="font-display text-lg leading-tight">{p.name}</h3>
                <p className="mt-2 text-[10px] uppercase tracking-[0.24em] text-muted-foreground">
                  {p.category}
                </p>
                <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                  {p.description}
                </p>
                <p className="mt-4 text-[10px] uppercase tracking-[0.22em] text-primary">
                  {p.status}
                </p>
                {p.url && (
                  <a
                    href={p.url}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-4 inline-flex text-xs text-primary underline-offset-4 hover:underline"
                  >
                    Kunjungi {p.name}
                  </a>
                )}
              </article>
            ))}
          </div>
          <p className="mt-6 text-sm text-muted-foreground">
            Eksperimen AI dan automation yang sedang diuji bisa dilihat di{" "}
            <Link to="/" hash="lab" className="text-primary underline-offset-4 hover:underline">
              KERJAKU LAB
            </Link>
            .
          </p>
        </section>

        <section className="mt-20" aria-labelledby="proses">
          <h2 id="proses" className="font-display text-[clamp(1.6rem,4vw,2.4rem)] leading-tight">
            {serviceProcess.title}
          </h2>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            {serviceProcess.intro}
          </p>
          <ol className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {serviceProcess.steps.map((step, i) => (
              <li key={step.title} className="rounded-2xl glass-panel p-5">
                <p className="text-[10px] uppercase tracking-[0.28em] text-primary">
                  {String(i + 1).padStart(2, "0")}
                </p>
                <h3 className="mt-3 font-display text-base leading-tight">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{step.body}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="mt-20" aria-labelledby="untuk-siapa">
          <h2
            id="untuk-siapa"
            className="font-display text-[clamp(1.6rem,4vw,2.4rem)] leading-tight"
          >
            {serviceAudience.title}
          </h2>
          <ul className="mt-7 flex flex-wrap gap-2.5">
            {serviceAudience.items.map((item) => (
              <li
                key={item}
                className="rounded-full border border-border px-4 py-2 text-xs text-muted-foreground"
              >
                {item}
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-20" aria-labelledby="faq">
          <h2 id="faq" className="font-display text-[clamp(1.6rem,4vw,2.4rem)] leading-tight">
            Pertanyaan yang Sering Diajukan
          </h2>
          <div className="mt-8 space-y-4">
            {serviceFaq.map((item) => (
              <article key={item.q} className="rounded-2xl glass-panel p-5">
                <h3 className="text-sm font-medium leading-snug text-foreground">{item.q}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.a}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-20 rounded-[2rem] glass-panel p-7 sm:p-10" aria-labelledby="cta">
          <h2 id="cta" className="font-display text-[clamp(1.6rem,4vw,2.4rem)] leading-tight">
            {serviceCta.title}
          </h2>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            {serviceCta.body}
          </p>
          <a
            href={mailto}
            className="mt-7 inline-flex h-12 items-center justify-center rounded-full bg-primary px-7 text-sm font-medium text-primary-foreground transition-transform hover:-translate-y-0.5"
          >
            {serviceCta.button}
          </a>
          <p className="mt-4 text-xs text-muted-foreground">{brand.contactEmail}</p>
        </section>
      </main>

      <footer className="mx-auto flex max-w-5xl flex-col gap-3 border-t border-border px-5 py-8 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <p>
          {brand.name} — {brand.motto}
        </p>
        <Link to="/" className="hover:text-foreground">
          Kembali ke beranda KERJAKU
        </Link>
      </footer>
    </div>
  );
}
