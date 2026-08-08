import { AnimatePresence, motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import { brand } from "@/lib/edu-content";
import { useEdu } from "./EduProvider";
import { GradeSwitch } from "./GradeSwitch";
import { OceanButton } from "./OceanButton";

const items = [
  { label: "Systems", action: "showcase" as const },
  { label: "Products", action: "products" as const },
  { label: "About", action: "profile" as const },
  { label: "AI", action: "ai" as const },
  { label: "Process", action: "petunjuk" as const },
];

export function SiteNav() {
  const { openPanel, scrollTo } = useEdu();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handle = (action: (typeof items)[number]["action"]) => {
    setOpen(false);
    if (action === "petunjuk") openPanel(action);
    else scrollTo(action);
  };

  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <div
        className={`mx-auto flex max-w-7xl items-center gap-4 px-5 transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] sm:px-8 ${
          scrolled ? "py-3" : "py-6"
        }`}
      >
        <button
          type="button"
          onClick={() => scrollTo("hero")}
          className="flex min-w-0 items-center gap-3 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary/15 ring-1 ring-primary/40">
            <span className="h-2.5 w-2.5 rounded-full bg-primary" />
          </span>
          <span className="min-w-0 text-left leading-tight">
            <span className="block truncate text-sm font-semibold tracking-[0.22em]">
              {brand.name}
            </span>
            <span className="block truncate text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
              {brand.tagline}
            </span>
          </span>
        </button>

        <nav className="ml-auto hidden items-center gap-1 md:flex" aria-label="Navigasi utama">
          {items.map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={() => handle(item.action)}
              className="rounded-full px-4 py-2 text-sm text-muted-foreground no-underline transition-colors duration-300 hover:bg-secondary/50 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {item.label}
            </button>
          ))}
        </nav>

        <div className="ml-auto hidden md:ml-4 md:block">
          <GradeSwitch compact />
        </div>

        <OceanButton
          size="sm"
          variant="secondary"
          aria-label={open ? "Tutup menu" : "Buka menu"}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="ml-auto h-10 w-10 min-w-0 px-0 md:hidden"
        >
          {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </OceanButton>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="mx-5 mb-4 rounded-3xl glass-panel p-5 md:hidden"
          >
            <nav className="flex flex-col gap-1" aria-label="Navigasi seluler">
              {items.map((item) => (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => handle(item.action)}
                  className="rounded-2xl px-4 py-3 text-left text-base text-foreground transition-colors hover:bg-secondary/60"
                >
                  {item.label}
                </button>
              ))}
            </nav>
            <div className="mt-4">
              <GradeSwitch compact className="max-w-none" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
