import { useEffect } from "react";
import Lenis from "lenis";
import { journey, prefersReducedMotion } from "@/lib/scroll-progress";

/**
 * The single smooth-scroll system for the whole experience.
 * It also feeds the shared journey progress (0..1) used by the canvas scene.
 */
export function SmoothScrollProvider() {
  useEffect(() => {
    const reduced = prefersReducedMotion();
    let raf = 0;
    let lenis: Lenis | null = null;

    const readProgress = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      journey.target = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
    };

    if (!reduced) {
      lenis = new Lenis({
        duration: 1.25,
        easing: (t: number) => 1 - Math.pow(1 - t, 4),
        smoothWheel: true,
        touchMultiplier: 1.4,
      });
      const loop = (time: number) => {
        lenis?.raf(time);
        readProgress();
        raf = requestAnimationFrame(loop);
      };
      raf = requestAnimationFrame(loop);
    } else {
      const onScroll = () => {
        readProgress();
        journey.progress = journey.target;
      };
      window.addEventListener("scroll", onScroll, { passive: true });
      readProgress();
      return () => window.removeEventListener("scroll", onScroll);
    }

    const onPointer = (e: PointerEvent) => {
      journey.pointerX = (e.clientX / window.innerWidth) * 2 - 1;
      journey.pointerY = (e.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener("pointermove", onPointer, { passive: true });
    readProgress();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onPointer);
      lenis?.destroy();
    };
  }, []);

  return null;
}
