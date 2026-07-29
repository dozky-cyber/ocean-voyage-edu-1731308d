/**
 * Single source of truth for the normalized 0..1 journey progress.
 * Updated once per frame outside React state to avoid per-frame re-renders.
 */
export const journey = {
  /** eased/lerped progress used by the canvas */
  progress: 0,
  /** raw scroll progress */
  target: 0,
  /** viewport pointer, -1..1 */
  pointerX: 0,
  pointerY: 0,
};

export const STAGES = 5;

export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
