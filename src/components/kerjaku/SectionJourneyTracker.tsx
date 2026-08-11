/**
 * Invisible journey tracker: records which sections the visitor reaches so a
 * submitted lead carries its full path (landing → services → portfolio → CTA →
 * form → submit). Renders nothing and never changes layout.
 */
import { useEffect } from "react";
import { analytics } from "@/lib/analytics";

const SECTION_IDS = [
  "layanan",
  "paket-layanan",
  "products",
  "proses",
  "tentang",
  "faq",
  "konsultasi",
] as const;

export function SectionJourneyTracker() {
  useEffect(() => {
    const seen = new Set<string>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const id = entry.target.id;
          if (entry.isIntersecting && !seen.has(id)) {
            seen.add(id);
            analytics.sectionView(id);
          }
        }
      },
      { threshold: 0.35 },
    );

    for (const id of SECTION_IDS) {
      const node = document.getElementById(id);
      if (node) observer.observe(node);
    }
    return () => observer.disconnect();
  }, []);

  return null;
}
