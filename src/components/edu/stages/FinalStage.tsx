import { finalCta, brand } from "@/lib/edu-content";
import { useEdu } from "../EduProvider";
import { GradeSwitch } from "../GradeSwitch";
import { OceanButton } from "../OceanButton";
import { Reveal } from "../Reveal";

export function FinalStage() {
  const { openPanel, scrollTo } = useEdu();

  return (
    <section
      id="final"
      className="relative flex min-h-[100svh] flex-col items-center justify-center px-5 py-32 text-center sm:px-8"
    >
      <div className="mx-auto max-w-3xl">
        <Reveal>
          <p className="text-[11px] uppercase tracking-[0.42em] text-primary/90">
            {finalCta.eyebrow}
          </p>
        </Reveal>
        <Reveal delay={0.1}>
          <h2 className="mt-6 text-balance font-display text-[clamp(2.4rem,7vw,5rem)] leading-[1.02]">
            {finalCta.title}
          </h2>
        </Reveal>
        <Reveal delay={0.2}>
          <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-muted-foreground">
            {finalCta.body}
          </p>
        </Reveal>
        <Reveal delay={0.3}>
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <OceanButton className="w-full sm:w-56" onClick={() => openPanel("materi")}>
              {finalCta.primary}
            </OceanButton>
            <OceanButton
              variant="secondary"
              className="w-full sm:w-56"
              onClick={() => scrollTo("products")}
            >
              {finalCta.secondary}
            </OceanButton>
          </div>
        </Reveal>
        <Reveal delay={0.4}>
          <div className="mt-12 flex justify-center">
            <GradeSwitch compact />
          </div>
        </Reveal>
      </div>

      <footer className="mt-24 flex w-full max-w-3xl flex-col items-center gap-4 border-t border-border pt-8 text-xs text-muted-foreground sm:flex-row sm:justify-between">
        <p>
          {brand.name} — {brand.motto}
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4">
          <button type="button" className="hover:text-foreground" onClick={() => scrollTo("hero")}>
            Kembali ke permukaan
          </button>
          <button
            type="button"
            className="hover:text-foreground"
            onClick={() => scrollTo("products")}
          >
            Products
          </button>
          <button
            type="button"
            className="hover:text-foreground"
            onClick={() => openPanel("petunjuk")}
          >
            Process
          </button>
        </div>
      </footer>
    </section>
  );
}
