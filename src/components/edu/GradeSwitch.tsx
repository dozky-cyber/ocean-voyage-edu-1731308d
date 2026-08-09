import { motion } from "framer-motion";
import { useEdu } from "./EduProvider";
import { grades } from "@/lib/edu-content";
import { cn } from "@/lib/utils";

/** Two perfectly equal, fully functional grade buttons. Works both ways. */
export function GradeSwitch({
  compact = false,
  className,
}: {
  compact?: boolean;
  className?: string;
}) {
  const { grade, setGrade } = useEdu();

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
      {grades.map((g) => {
        const active = grade === g.id;
        return (
          <button
            key={g.id}
            type="button"
            aria-pressed={active}
            onClick={() => setGrade(g.id)}
            className={cn(
              "relative flex w-full items-center justify-center rounded-full text-center transition-colors duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
              compact
                ? "h-9 px-3 text-xs font-medium"
                : "h-auto min-h-[6.5rem] flex-col gap-1 rounded-3xl border border-border bg-card px-5 py-5 backdrop-blur-md hover:border-primary/50",
              active ? "text-foreground" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {active && (
              <motion.span
                layoutId={compact ? "grade-pill-compact" : "grade-pill"}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                className={cn(
                  "absolute inset-0 -z-10 bg-primary/12 ring-1 ring-inset ring-primary/50 shadow-[0_0_32px_-8px_hsl(var(--primary)/0.55)] backdrop-blur-md",
                  compact ? "rounded-full" : "rounded-3xl",
                )}
              />
            )}
            <span className={cn("font-display font-semibold", compact ? "text-xs" : "text-2xl")}>
              {g.label}
            </span>
            {!compact && (
              <>
                <span className="text-xs font-medium uppercase tracking-[0.18em] opacity-80">
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
