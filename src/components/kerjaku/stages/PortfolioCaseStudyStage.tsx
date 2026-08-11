import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { ArrowRight } from "lucide-react";

import { listPublicPortfolio } from "@/lib/portfolio.functions";
import { Reveal } from "../Reveal";

export function PortfolioCaseStudyStage() {
  const fetchList = useServerFn(listPublicPortfolio);
  const { data } = useQuery({
    queryKey: ["public", "portfolio"],
    queryFn: () => fetchList(),
    staleTime: 5 * 60 * 1000,
  });

  const projects = data ?? [];
  if (projects.length === 0) return null;

  return (
    <section id="case-study" className="relative px-5 py-20 sm:px-8">
      <div className="mx-auto max-w-6xl">
        <Reveal>
          <p className="text-[11px] uppercase tracking-[0.42em] text-primary/90">CASE STUDY</p>
        </Reveal>
        <Reveal delay={0.1}>
          <h2 className="mt-5 max-w-3xl text-balance font-display text-[clamp(2rem,5.4vw,3.4rem)] leading-[1.06]">
            Portfolio & hasil nyata
          </h2>
        </Reveal>
        <Reveal delay={0.16}>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-muted-foreground">
            Setiap project dimulai dari masalah bisnis, dijawab dengan sistem, dan diukur dari
            hasilnya.
          </p>
        </Reveal>

        <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project, index) => (
            <Reveal key={project.id} delay={0.06 * index}>
              <Link
                to="/portfolio/$slug"
                params={{ slug: project.slug }}
                className="group flex h-full flex-col overflow-hidden rounded-[2rem] glass-panel transition-all duration-500 hover:-translate-y-2"
              >
                {project.thumbnail_url ? (
                  <img
                    src={project.thumbnail_url}
                    alt={`Thumbnail case study ${project.title}`}
                    loading="lazy"
                    className="h-44 w-full object-cover"
                  />
                ) : null}
                <div className="flex flex-1 flex-col p-6">
                  <span className="text-[10px] uppercase tracking-[0.28em] text-muted-foreground">
                    {project.category}
                    {project.client_type ? ` · ${project.client_type}` : ""}
                  </span>
                  <h3 className="mt-3 font-display text-2xl leading-tight">{project.title}</h3>
                  {project.description ? (
                    <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-muted-foreground">
                      {project.description}
                    </p>
                  ) : null}
                  <span className="mt-6 inline-flex items-center gap-2 text-sm text-primary">
                    Lihat case study
                    <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                  </span>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
