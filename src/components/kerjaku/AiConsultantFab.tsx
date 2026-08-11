import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Bot, X } from "lucide-react";
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

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-label={open ? "Tutup AI Consultant" : aiConsultantSection.fabLabel}
        aria-expanded={open}
        className="fixed bottom-5 right-4 z-50 flex h-13 items-center gap-2 rounded-full border border-primary/40 bg-primary/15 px-4 py-3 text-sm text-foreground backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/70 sm:bottom-7 sm:right-7"
      >
        {open ? (
          <X className="h-4.5 w-4.5 text-primary" strokeWidth={1.5} />
        ) : (
          <Bot className="h-4.5 w-4.5 text-primary" strokeWidth={1.5} />
        )}
        <span className="hidden sm:inline">{aiConsultantSection.fabLabel}</span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            key="ai-panel"
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.98 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            role="dialog"
            aria-label="KERJAKU AI Consultant"
            className="fixed bottom-24 right-3 left-3 z-50 max-h-[70vh] overflow-y-auto rounded-[1.75rem] glass-panel p-5 sm:left-auto sm:right-7 sm:w-[26rem]"
          >
            <AiConsultantChat source="floating" onDiscuss={() => setOpen(false)} compact />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
