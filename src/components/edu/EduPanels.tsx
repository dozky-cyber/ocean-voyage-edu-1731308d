import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useEffect } from "react";
import { workPanel, processSteps } from "@/lib/edu-content";
import { useEdu } from "./EduProvider";
import { GradeSwitch } from "./GradeSwitch";
import { OceanButton } from "./OceanButton";

export function EduPanels() {
  const { panel, closePanel, grade } = useEdu();

  useEffect(() => {
    if (!panel) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closePanel();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [panel, closePanel]);

  return (
    <AnimatePresence>
      {panel && (
        <motion.div
          className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        >
          <button
            type="button"
            aria-label="Tutup panel"
            onClick={closePanel}
            className="absolute inset-0 bg-background/70 backdrop-blur-sm"
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={panel === "materi" ? "Panel karya" : "Panel proses"}
            initial={{ y: 40, opacity: 0, filter: "blur(10px)" }}
            animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
            exit={{ y: 30, opacity: 0, filter: "blur(10px)" }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            className="relative m-0 max-h-[88svh] w-full max-w-3xl overflow-y-auto rounded-t-[2rem] glass-panel p-6 sm:m-6 sm:rounded-[2rem] sm:p-9"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-[11px] uppercase tracking-[0.32em] text-primary/90">
                  {panel === "materi" ? `Work · ${grade}` : "Build process"}
                </p>
                <h2 className="mt-3 font-display text-3xl leading-tight">
                  {panel === "materi" ? "Peta Karya Digital" : "Cara Saya Membangun"}
                </h2>
              </div>
              <OceanButton
                variant="secondary"
                size="sm"
                aria-label="Tutup"
                onClick={closePanel}
                className="h-10 w-10 min-w-0 px-0"
              >
                <X className="h-4 w-4" />
              </OceanButton>
            </div>

            {panel === "materi" ? (
              <div className="mt-7">
                <GradeSwitch compact />
                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  {workPanel[grade].map((s) => (
                    <div key={s.subject} className="rounded-2xl bg-secondary/40 p-5">
                      <h3 className="font-display text-xl">{s.subject}</h3>
                      <ul className="mt-3 space-y-2">
                        {s.topics.map((t) => (
                          <li
                            key={t}
                            className="flex items-start gap-3 text-sm text-muted-foreground"
                          >
                            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                            <span>{t}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <ol className="mt-7 space-y-4">
                {processSteps.map((s) => (
                  <li key={s.title} className="rounded-2xl bg-secondary/40 p-5">
                    <h3 className="font-display text-lg">{s.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.body}</p>
                  </li>
                ))}
              </ol>
            )}

            <div className="mt-8">
              <OceanButton variant="secondary" onClick={closePanel} className="w-full sm:w-auto">
                Kembali menjelajah
              </OceanButton>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
