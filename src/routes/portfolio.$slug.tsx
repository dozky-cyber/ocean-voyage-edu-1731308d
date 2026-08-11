import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft, CheckCircle2, Quote } from "lucide-react";

import { OceanScene } from "@/components/kerjaku/OceanScene";
import { SiteNav } from "@/components/kerjaku/SiteNav";
import type { PortfolioProject } from "@/lib/admin/portfolio";
import { getPublicPortfolioProject } from "@/lib/portfolio.functions";

const BASE = "https://kerjaku.space";

export const Route = createFileRoute("/portfolio/$slug")({
  loader: async ({ params }) => {
    const project = await getPublicPortfolioProject({ data: { slug: params.slug } });
    if (!project) throw notFound();
    return { project };
  },
  head: ({ params, loaderData }) => {
    const project = loaderData?.project;
    const title = project?.seo_title || (project ? `${project.title} — Case Study KERJAKU` : "Case Study — KERJAKU");
    const description =
      project?.seo_description ||
      project?.description ||
      "Case study project digital yang dibangun KERJAKU.";
    const url = `${BASE}/portfolio/${params.slug}`;
    const image = project?.og_image || project?.thumbnail_url || null;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "article" },
        { property: "og:url", content: url },
        ...(image && image.startsWith("https://")
          ? [
              { property: "og:image", content: image },
              { name: "twitter:image", content: image },
            ]
          : []),
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: description },
      ],
      links: [{ rel: "canonical", href: url }],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "CreativeWork",
            name: project?.title,
            description,
            url,
            creator: { "@type": "Organization", name: "KERJAKU", url: BASE },
          }),
        },
      ],
    };
  },
  errorComponent: () => <StatePage title="Case study tidak dapat dimuat" />,
  notFoundComponent: () => <StatePage title="Case study tidak ditemukan" />,
  component: CaseStudyPage,
});

function StatePage({ title }: { title: string }) {
  return (
    <main className="relative grid min-h-screen place-items-center px-6 text-center">
      <div>
        <h1 className="font-display text-3xl">{title}</h1>
        <Link to="/" className="mt-6 inline-block text-sm text-primary">
          Kembali ke beranda
        </Link>
      </div>
    </main>
  );
}

function Block({ label, body }: { label: string; body: string | null }) {
  if (!body) return null;
  return (
    <div className="rounded-[2rem] glass-panel p-6 sm:p-8">
      <p className="text-[11px] uppercase tracking-[0.32em] text-primary/90">{label}</p>
      <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
        {body}
      </p>
    </div>
  );
}

function CaseStudyPage() {
  const { project } = Route.useLoaderData() as { project: PortfolioProject };

  return (
    <div className="relative min-h-screen bg-abyss text-foreground">
      <OceanScene />
      <SiteNav />
      <main className="relative px-5 pb-24 pt-28 sm:px-8">
        <div className="mx-auto max-w-4xl">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.28em] text-muted-foreground transition hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Beranda
          </Link>

          <p className="mt-8 text-[11px] uppercase tracking-[0.42em] text-primary/90">
            {project.category}
            {project.client_type ? ` · ${project.client_type}` : ""}
          </p>
          <h1 className="mt-5 text-balance font-display text-[clamp(2.2rem,6vw,3.8rem)] leading-[1.05]">
            {project.title}
          </h1>
          {project.description ? (
            <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground">
              {project.description}
            </p>
          ) : null}

          {project.thumbnail_url ? (
            <img
              src={project.thumbnail_url}
              alt={`Tampilan project ${project.title}`}
              className="mt-10 w-full rounded-[2rem] object-cover"
            />
          ) : null}

          <div className="mt-10 grid gap-5">
            <Block label="Problem" body={project.problem} />
            <Block label="Solution" body={project.solution} />

            {project.features.length > 0 ? (
              <div className="rounded-[2rem] glass-panel p-6 sm:p-8">
                <p className="text-[11px] uppercase tracking-[0.32em] text-primary/90">Features</p>
                <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                  {project.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            <Block label="Result" body={project.result} />

            {project.tech_stack.length > 0 ? (
              <div className="rounded-[2rem] glass-panel p-6 sm:p-8">
                <p className="text-[11px] uppercase tracking-[0.32em] text-primary/90">
                  Technology stack
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {project.tech_stack.map((tech) => (
                    <span
                      key={tech}
                      className="rounded-full border border-border/50 bg-background/30 px-3 py-1 text-xs text-muted-foreground"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}

            {project.testimonial_quote ? (
              <div className="rounded-[2rem] glass-panel p-6 sm:p-8">
                <Quote className="h-5 w-5 text-primary" />
                <p className="mt-4 text-base leading-relaxed">{project.testimonial_quote}</p>
                {project.testimonial_author ? (
                  <p className="mt-4 text-xs uppercase tracking-[0.22em] text-muted-foreground">
                    {project.testimonial_author}
                    {project.testimonial_role ? ` · ${project.testimonial_role}` : ""}
                  </p>
                ) : null}
              </div>
            ) : null}

            {project.gallery.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2">
                {project.gallery.map((src) => (
                  <img
                    key={src}
                    src={src}
                    alt={`Galeri project ${project.title}`}
                    loading="lazy"
                    className="w-full rounded-[1.5rem] object-cover"
                  />
                ))}
              </div>
            ) : null}
          </div>

          <div className="mt-12">
            <Link
              to="/"
              hash="konsultasi"
              className="inline-flex items-center rounded-full bg-primary/90 px-6 py-3 text-sm font-medium text-primary-foreground transition hover:bg-primary"
            >
              Diskusikan project serupa
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
