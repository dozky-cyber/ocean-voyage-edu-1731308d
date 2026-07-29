import { AnimatePresence, motion, useScroll, useTransform } from "framer-motion";
import { useRef, useState } from "react";
import { Compass, Gamepad2, Layers, Sparkle } from "lucide-react";
import { materiPanel, worlds, type WorldId } from "@/lib/edu-content";
import { useEdu } from "../EduProvider";
import { OceanButton } from "../OceanButton";
import { Reveal } from "../Reveal";

const icons: Record<WorldId, typeof Layers> = {
  materi: Layers,
  misi: Compass,
  tantangan: Gamepad2,
  ai: Sparkle,
};

/** Spatial offsets so the objects float at different depths, not a flat grid. */
const offsets = ["md:translate-y-0", "md:translate-y-14", "md:-translate-y-8", "md:translate-y-6"];

export function ShowcaseStage() {
  const ref = useRef<HTMLElement | null>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const drift = useTransform(scrollYProgress, [0, 1], [70, -70]);
  const [selected, setSelected] = useState<WorldId>("materi");
  const { grade, openPanel, scrollTo } = useEdu();

  const active = worlds.find((w) => w.id === selected)!;
  const subjects = materiPanel[grade];

  return (
    <section
      id="showcase"
      ref={ref}
      className="relative min-h-[110svh] px-5 py-32 sm:px-8"
    >
      <div className="mx-auto max-w-6xl">
        <Reveal>
          <p className="text-[11px] uppercase tracking-[0.42em] text-primary/90">Dunia Ketiga</p>
        </Reveal>
        <Reveal delay={0.1}>
          <h2 className="mt-6 max-w-3xl text-balance font-display text-[clamp(2.2rem,6vw,4rem)] leading-[1.05]">
            Empat Kedalaman Belajar
          </h2>
        </Reveal>
        <Reveal delay={0.18}>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground">
            Pilih satu objek di kedalaman untuk melihat isinya. Semua menyesuaikan jenjang{" "}
            <span className="text-primary">{grade}</span>.
          </p>
        </Reveal>

        <motion.div style={{ y: drift }} className="mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {worlds.map((w, i) => {
            const Icon = icons[w.id];
            const isActive = selected === w.id;
            return (
              <Reveal key={w.id} delay={0.08 * i}>
                <button
                  type="button"
                  onClick={() => setSelected(w.id)}
                  aria-pressed={isActive}
                  className={`group relative flex h-full w-full flex-col rounded-[2rem] glass-panel p-6 text-left transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${offsets[i]} ${
                    isActive ? "ring-1 ring-primary/60" : ""
                  }`}
                >
                  <span className="grid h-11 w-11 place-items-center rounded-2xl bg-primary/15 text-primary ring-1 ring-primary/30">
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="mt-6 text-[10px] uppercase tracking-[0.28em] text-muted-foreground">
                    {w.depth} · {w.subtitle}
                  </span>
                  <span className="mt-2 font-display text-2xl leading-tight">{w.title}</span>
                  <span className="mt-3 text-sm leading-relaxed text-muted-foreground">
                    {w.body}
                  </span>
                </button>
              </Reveal>
            );
          })}
        </motion.div>

        <Reveal delay={0.1}>
          <div className="mt-12 rounded-[2rem] glass-panel p-6 sm:p-9">
            <AnimatePresence mode="wait">
              <motion.div
                key={selected + grade}
                initial={{ opacity: 0, y: 18, filter: "blur(8px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, y: -12, filter: "blur(8px)" }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              >
                <p className="text-[11px] uppercase tracking-[0.3em] text-primary/90">
                  {active.subtitle} · {grade}
                </p>
                <h3 className="mt-3 font-display text-3xl">{active.title}</h3>
                <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                  {active.body}
                </p>

                <ul className="mt-7 grid gap-3 sm:grid-cols-2">
                  {(selected === "materi"
                    ? subjects.map((s) => `${s.subject}: ${s.topics[0]}`)
                    : selected === "misi"
                      ? [
                          "15 menit membaca ringkasan harian",
                          "1 latihan soal terarah setiap hari",
                          "Refleksi singkat sebelum tidur",
                          "Rekap kemajuan setiap akhir pekan",
                        ]
                      : selected === "tantangan"
                        ? [
                            "Kuis cepat 10 soal",
                            "Teka-teki logika harian",
                            "Duel materi bersama teman",
                            "Koleksi lencana harta karun",
                          ]
                        : [
                            "Penjelasan ulang materi sulit",
                            "Contoh soal bertahap",
                            "Rencana belajar mingguan",
                            "Tanya jawab bahasa sederhana",
                          ]
                  ).map((line) => (
                    <li
                      key={line}
                      className="flex items-start gap-3 rounded-2xl bg-secondary/40 px-4 py-3 text-sm"
                    >
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                      <span>{line}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <OceanButton
                    className="w-full sm:w-auto"
                    onClick={() =>
                      selected === "ai" ? scrollTo("ai") : openPanel("materi")
                    }
                  >
                    {selected === "ai" ? "Buka AI Pendamping" : "Buka Materi"}
                  </OceanButton>
                  <OceanButton
                    variant="secondary"
                    className="w-full sm:w-auto"
                    onClick={() => openPanel("petunjuk")}
                  >
                    Lihat Petunjuk
                  </OceanButton>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
