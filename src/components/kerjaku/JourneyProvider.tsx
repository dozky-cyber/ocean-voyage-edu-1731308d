import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import type { Grade } from "@/lib/edu-content";

type PanelId = "materi" | "petunjuk" | null;

type EduState = {
  grade: Grade;
  setGrade: (g: Grade) => void;
  panel: PanelId;
  openPanel: (p: Exclude<PanelId, null>) => void;
  closePanel: () => void;
  scrollTo: (id: string) => void;
};

const EduContext = createContext<EduState | null>(null);

export function EduProvider({ children }: { children: ReactNode }) {
  const [grade, setGrade] = useState<Grade>("Products");
  const [panel, setPanel] = useState<PanelId>(null);

  const value = useMemo<EduState>(
    () => ({
      grade,
      setGrade,
      panel,
      openPanel: (p) => setPanel(p),
      closePanel: () => setPanel(null),
      scrollTo: (id) => {
        const el = document.getElementById(id);
        if (!el) return;
        const top = el.getBoundingClientRect().top + window.scrollY - 8;
        window.scrollTo({ top, behavior: "smooth" });
      },
    }),
    [grade, panel],
  );

  return <EduContext.Provider value={value}>{children}</EduContext.Provider>;
}

export function useEdu() {
  const ctx = useContext(EduContext);
  if (!ctx) throw new Error("useEdu must be used inside EduProvider");
  return ctx;
}
