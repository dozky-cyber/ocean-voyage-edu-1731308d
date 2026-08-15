import { useEffect } from "react";

/**
 * Ensures a fresh visit to the homepage starts at the hero.
 * Runs once on mount only, and never when the URL carries a valid hash anchor.
 */
export function ScrollTopOnLoad() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const hash = window.location.hash;
    if (hash && hash.length > 1) {
      const target = document.getElementById(decodeURIComponent(hash.slice(1)));
      if (target) return; // let the anchor work
    }

    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }

    window.scrollTo(0, 0);
    const raf = requestAnimationFrame(() => window.scrollTo(0, 0));
    return () => cancelAnimationFrame(raf);
  }, []);

  return null;
}
