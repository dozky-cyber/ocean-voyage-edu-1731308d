import { motion } from "framer-motion";
import { useJourney } from "./JourneyProvider";
import { projectModes } from "@/lib/site-content";
import { cn } from "@/lib/utils";

/** Products / Experiments switch. Two perfectly equal, fully functional buttons. */
export function ProjectModeSwitch({
  compact = false,
  className,
}: {
  compact?: boolean;
  className?: string;
}) {
  const { mode, setMode } = useJourney();

  return (
    <div
      role="group"
      aria-label="Pilih jenis karya"
      className={cn(
        "grid w-full grid-cols-2 gap-3",
        compact
          ? "max-w-[15rem] gap-1 rounded-full border border-border bg-card p-1 backdrop-blur-md"
          : "max-w-xl",
        className,
      )}
    >
      {projectModes.map((g) => {
        const active = mode === g.id;
        return (
          <button
            key={g.id}
            type="button"
            aria-pressed={active}
            onClick={() => setMode(g.id)}
            className={cn(
              "relative flex w-full items-center justify-center rounded-full text-center transition-colors duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
              compact
                ? "h-9 px-3 text-xs font-medium"
                : "h-auto min-h-[6rem] flex-col gap-1 rounded-3xl border border-border bg-card px-5 py-4 backdrop-blur-md hover:border-primary/50",
              active ? "text-foreground" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {active && (
              <motion.span
                layoutId={compact ? "mode-pill-compact" : "mode-pill"}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                className={cn(
                  "absolute inset-0 -z-10 border border-primary/50 bg-primary/15 shadow-[0_0_40px_-14px_var(--lagoon)]",
                  compact ? "rounded-full" : "rounded-3xl",
                )}
              />
            )}
            <span
              className={cn(
                "font-display font-semibold",
                compact ? "text-xs" : "text-xl",
                active && "text-primary",
              )}
            >
              {g.label}
            </span>
            {!compact && (
              <>
                <span className="text-[10px] font-medium uppercase tracking-[0.18em] opacity-80">
                  {g.full}
                </span>
                <span className="mt-1 max-w-[22ch] text-xs leading-relaxed opacity-70">
                  {g.description}
                </span>
              </>
            )}
          </button>
        );
      })}
    </div>
  );
}
