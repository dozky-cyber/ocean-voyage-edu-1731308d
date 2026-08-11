import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Bot } from "lucide-react";
import { aiConsultantSection } from "@/lib/ai-consultant";
import { AiConsultantChat } from "./AiConsultantChat";

export function AiConsultantFab() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // Lock background scrolling while the consultant overlay is open so only the
  // conversation area scrolls (prevents double scrolling on mobile).
  useEffect(() => {
    if (!open) return;
    const { body, documentElement } = document;
    const previousBody = body.style.overflow;
    const previousHtml = documentElement.style.overflow;
    const previousOverscroll = body.style.overscrollBehavior;
    body.style.overflow = "hidden";
    documentElement.style.overflow = "hidden";
    body.style.overscrollBehavior = "none";
    return () => {
      body.style.overflow = previousBody;
      documentElement.style.overflow = previousHtml;
      body.style.overscrollBehavior = previousOverscroll;
    };
  }, [open]);

  return (
    <>
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label={aiConsultantSection.fabLabel}
          className="fixed bottom-5 right-4 z-[70] flex h-13 items-center gap-2 rounded-full border border-primary/40 bg-primary/15 px-4 py-3 text-sm text-foreground backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/70 sm:bottom-7 sm:right-7"
        >
          <Bot className="h-4.5 w-4.5 text-primary" strokeWidth={1.5} />
          <span className="hidden sm:inline">{aiConsultantSection.fabLabel}</span>
        </button>
      )}

      <AnimatePresence>
        {open && (
          <motion.div
            key="ai-panel"
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.98 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            role="dialog"
            aria-modal="true"
            aria-label="KERJAKU AI Consultant"
            className="fixed inset-0 z-[100] flex h-[100dvh] w-screen flex-col overflow-hidden bg-background/95 p-4 backdrop-blur-xl sm:inset-auto sm:bottom-7 sm:right-7 sm:h-[38rem] sm:max-h-[80vh] sm:w-[26rem] sm:rounded-[1.75rem] sm:bg-transparent sm:p-5 sm:glass-panel"
            style={{ paddingTop: "max(1rem, env(safe-area-inset-top))", paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}
          >
            <AiConsultantChat source="floating" onClose={() => setOpen(false)} fill />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
