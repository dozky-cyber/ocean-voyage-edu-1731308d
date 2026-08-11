import { analytics } from "@/lib/analytics";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { Hourglass } from "lucide-react";
import { products, projects } from "@/lib/site-content";
import { Reveal } from "../Reveal";

const offsets = ["md:translate-y-0", "md:translate-y-12", "md:-translate-y-6"];

export function ProductsStage() {
  const ref = useRef<HTMLElement | null>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const drift = useTransform(scrollYProgress, [0, 1], [60, -60]);

  const list = projects.Products;

  return (
    <section id="products" ref={ref} className="relative min-h-[100svh] px-5 py-28 sm:px-8">
      <div className="mx-auto max-w-6xl">
        <Reveal>
          <p className="text-[11px] uppercase tracking-[0.42em] text-primary/90">
            {products.eyebrow}
          </p>
        </Reveal>
        <Reveal delay={0.1}>
          <h2 className="mt-6 max-w-3xl text-balance font-display text-[clamp(2.2rem,6vw,4rem)] leading-[1.05]">
            {products.title}
          </h2>
        </Reveal>
        <Reveal delay={0.18}>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground">
            {products.body}
          </p>
        </Reveal>

        <motion.div style={{ y: drift }} className="mt-12 grid gap-5 md:grid-cols-3">
          {list.map((p, i) => (
            <motion.article
              key={p.name}
              initial={{ opacity: 0, y: 24, filter: "blur(8px)" }}
              whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.55, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
              className={`relative flex h-full flex-col rounded-[2rem] glass-panel p-6 transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-2 ${offsets[i % 3]}`}
            >
              {p.status && (
                <span className="absolute right-6 top-6 inline-flex items-center gap-1.5 rounded-full bg-primary/15 px-3 py-1 text-[10px] font-medium uppercase tracking-[0.22em] text-primary ring-1 ring-primary/40">
                  {p.status === "IN DEVELOPMENT" && <Hourglass className="h-3 w-3" />}
                  {p.status}
                </span>
              )}
              <h3 className="max-w-[70%] font-display text-2xl leading-tight">{p.name}</h3>
              <p className="mt-2 text-[10px] uppercase tracking-[0.24em] text-muted-foreground">
                {p.category}
              </p>

              {p.problem && (
                <div className="mt-5">
                  <p className="text-[10px] uppercase tracking-[0.24em] text-primary/90">Masalah</p>
                  <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">{p.problem}</p>
                </div>
              )}

              {p.solution && (
                <div className="mt-4">
                  <p className="text-[10px] uppercase tracking-[0.24em] text-primary/90">Solusi</p>
                  <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">{p.solution}</p>
                </div>
              )}

              {p.featureGroups && p.featureGroups.length > 0 && (
                <div className="mt-4 space-y-4">
                  <p className="text-[10px] uppercase tracking-[0.24em] text-primary/90">Fitur Utama</p>
                  {p.featureGroups.map((g) => (
                    <div key={g.title}>
                      <p className="text-xs font-medium text-foreground">{g.title}</p>
                      <ul className="mt-1.5 space-y-1">
                        {g.items.map((item) => (
                          <li key={item} className="flex items-start gap-2 text-sm text-muted-foreground">
                            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              )}

              {p.features && p.features.length > 0 && !p.featureGroups && (
                <div className="mt-4">
                  <p className="text-[10px] uppercase tracking-[0.24em] text-primary/90">Fitur Utama</p>
                  <ul className="mt-2 space-y-1.5">
                    {p.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {p.url && (
                <a
                  href={p.url}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => analytics.portfolioProjectClick(p.name, p.url)}
                  className="mt-6 inline-flex w-fit items-center gap-2 rounded-full border border-primary/40 px-4 py-2 text-xs text-primary transition-colors hover:bg-primary/10"
                >
                  Kunjungi produk
                </a>
              )}
            </motion.article>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
