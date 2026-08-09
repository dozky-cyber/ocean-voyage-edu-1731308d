import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import type { ProjectMode } from "@/lib/site-content";

type PanelId = "work" | "process" | null;

type JourneyState = {
  mode: ProjectMode;
  setMode: (m: ProjectMode) => void;
  panel: PanelId;
  openPanel: (p: Exclude<PanelId, null>) => void;
  closePanel: () => void;
  scrollTo: (id: string) => void;
};

const JourneyContext = createContext<JourneyState | null>(null);

export function JourneyProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<ProjectMode>("Products");
  const [panel, setPanel] = useState<PanelId>(null);

  const value = useMemo<JourneyState>(
    () => ({
      mode,
      setMode,
      panel,
      openPanel: (p) => setPanel(p),
      closePanel: () => setPanel(null),
      scrollTo: (id) => {
        const el = document.getElementById(id);
        if (!el) return;
        const top = el.getBoundingClientRect().top + window.scrollY - 88;
        window.scrollTo({ top, behavior: "smooth" });
      },
    }),
    [mode, panel],
  );

  return <JourneyContext.Provider value={value}>{children}</JourneyContext.Provider>;
}

export function useJourney() {
  const ctx = useContext(JourneyContext);
  if (!ctx) throw new Error("useJourney must be used inside JourneyProvider");
  return ctx;
}
