import { AnimatePresence, motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import { brand } from "@/lib/site-content";
import { useJourney } from "./JourneyProvider";
import { OceanButton } from "./OceanButton";

const items = [
  { label: "Home", target: "hero" },
  { label: "About", target: "profile" },
  { label: "Projects", target: "products" },
  { label: "Lab", target: "lab" },
  { label: "Contact", target: "final" },
];

export function SiteNav() {
  const { scrollTo } = useJourney();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handle = (target: string) => {
    setOpen(false);
    scrollTo(target);
  };

  return (
    <header className="fixed inset-x-0 top-0 z-[60]">
      <div
        aria-hidden="true"
        className={`pointer-events-none absolute inset-x-0 top-0 h-24 transition-opacity duration-500 ${
          scrolled ? "opacity-100" : "opacity-0"
        }`}
        style={{
          background:
            "linear-gradient(to bottom, color-mix(in oklab, var(--abyss) 88%, transparent), transparent)",
          backdropFilter: "blur(10px)",
          maskImage: "linear-gradient(to bottom, #000 55%, transparent)",
          WebkitMaskImage: "linear-gradient(to bottom, #000 55%, transparent)",
        }}
      />
      <div
        className={`relative mx-auto flex max-w-7xl items-center gap-4 px-5 transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] sm:px-8 ${
          scrolled ? "py-3" : "py-5"
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
              onClick={() => handle(item.target)}
              className="rounded-full px-4 py-2 text-sm text-muted-foreground no-underline transition-colors duration-300 hover:bg-secondary/50 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {item.label}
            </button>
          ))}
        </nav>

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
            className="relative mx-5 mb-4 rounded-3xl glass-panel p-4 md:hidden"
          >
            <nav className="flex flex-col gap-1" aria-label="Navigasi seluler">
              {items.map((item) => (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => handle(item.target)}
                  className="rounded-2xl px-4 py-3 text-left text-base text-foreground transition-colors hover:bg-secondary/60"
                >
                  {item.label}
                </button>
              ))}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
