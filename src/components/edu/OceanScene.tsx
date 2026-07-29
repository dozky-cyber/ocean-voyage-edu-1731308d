import { useEffect, useRef } from "react";
import { journey, prefersReducedMotion } from "@/lib/scroll-progress";

type RGB = [number, number, number];

/** Palette per journey stage: [top, mid, bottom] */
const PALETTES: { top: RGB; mid: RGB; bottom: RGB; glow: RGB }[] = [
  { top: [10, 20, 38], mid: [7, 14, 28], bottom: [3, 7, 16], glow: [92, 156, 214] }, // hero dusk
  { top: [176, 214, 226], mid: [131, 180, 201], bottom: [70, 122, 154], glow: [235, 246, 250] }, // pastel
  { top: [23, 74, 96], mid: [11, 44, 66], bottom: [5, 21, 36], glow: [88, 200, 196] }, // organic
  { top: [42, 26, 96], mid: [26, 18, 66], bottom: [10, 8, 32], glow: [148, 118, 255] }, // ai
  { top: [8, 34, 54], mid: [5, 22, 38], bottom: [2, 9, 18], glow: [110, 190, 220] }, // final
];

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function mixPalette(p: number) {
  const scaled = Math.min(0.9999, Math.max(0, p)) * (PALETTES.length - 1);
  const i = Math.floor(scaled);
  const t = scaled - i;
  const a = PALETTES[i];
  const b = PALETTES[Math.min(PALETTES.length - 1, i + 1)];
  const mix = (x: RGB, y: RGB): RGB => [
    lerp(x[0], y[0], t),
    lerp(x[1], y[1], t),
    lerp(x[2], y[2], t),
  ];
  return {
    top: mix(a.top, b.top),
    mid: mix(a.mid, b.mid),
    bottom: mix(a.bottom, b.bottom),
    glow: mix(a.glow, b.glow),
  };
}

const rgb = (c: RGB, alpha = 1) =>
  `rgba(${c[0].toFixed(0)}, ${c[1].toFixed(0)}, ${c[2].toFixed(0)}, ${alpha})`;

type Particle = {
  x: number;
  y: number;
  r: number;
  speed: number;
  depth: number;
  drift: number;
  seed: number;
};

/**
 * Fixed, full-screen atmospheric ocean scene.
 * Canvas 2D keeps the experience GPU-light and gives a guaranteed static
 * fallback on devices without WebGL, while remaining fully scroll-reversible.
 */
export function OceanScene() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    const reduced = prefersReducedMotion();
    const isSmall = window.innerWidth < 768;
    const count = reduced ? 26 : isSmall ? 52 : 120;

    let width = 0;
    let height = 0;
    let dpr = 1;
    let particles: Particle[] = [];
    let raf = 0;
    let running = true;
    let time = 0;

    const seedParticles = () => {
      particles = Array.from({ length: count }, () => ({
        x: Math.random(),
        y: Math.random(),
        r: 0.6 + Math.random() * 2.6,
        speed: 0.00004 + Math.random() * 0.00018,
        depth: 0.25 + Math.random() * 0.75,
        drift: Math.random() * Math.PI * 2,
        seed: Math.random() * 1000,
      }));
    };

    const resize = () => {
      dpr = Math.min(1.75, Math.max(1, window.devicePixelRatio || 1));
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const draw = (dt: number) => {
      time += dt;
      journey.progress += (journey.target - journey.progress) * (reduced ? 1 : 0.07);
      const p = journey.progress;
      const pal = mixPalette(p);

      // Background depth gradient
      const g = ctx.createLinearGradient(0, 0, 0, height);
      g.addColorStop(0, rgb(pal.top));
      g.addColorStop(0.55, rgb(pal.mid));
      g.addColorStop(1, rgb(pal.bottom));
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, width, height);

      const px = journey.pointerX;
      const py = journey.pointerY;

      // Volumetric light shafts from the surface
      const shafts = isSmall ? 3 : 6;
      const shaftAlpha = 0.16 * (1 - p * 0.55);
      if (shaftAlpha > 0.01) {
        ctx.save();
        ctx.globalCompositeOperation = "lighter";
        for (let i = 0; i < shafts; i++) {
          const base = ((i + 0.5) / shafts) * width;
          const sway = Math.sin(time * 0.00016 + i) * 60 + px * 30;
          const w = width * (0.06 + (i % 3) * 0.02);
          const grad = ctx.createLinearGradient(0, 0, 0, height * 0.95);
          grad.addColorStop(0, rgb(pal.glow, shaftAlpha));
          grad.addColorStop(1, rgb(pal.glow, 0));
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.moveTo(base - w * 0.4 + sway * 0.2, -20);
          ctx.lineTo(base + w * 0.4 + sway * 0.2, -20);
          ctx.lineTo(base + w * 1.5 + sway, height);
          ctx.lineTo(base - w * 1.5 + sway, height);
          ctx.closePath();
          ctx.fill();
        }
        ctx.restore();
      }

      // Deep glow orb — the "centerpiece" light that follows the journey
      const orbY = height * (0.62 - p * 0.22) + py * 18;
      const orbX = width * 0.5 + px * 40 + Math.sin(time * 0.0002) * 20;
      const orbR = Math.min(width, height) * (0.42 + Math.sin(p * Math.PI) * 0.16);
      const orb = ctx.createRadialGradient(orbX, orbY, 0, orbX, orbY, orbR);
      orb.addColorStop(0, rgb(pal.glow, 0.28));
      orb.addColorStop(0.45, rgb(pal.glow, 0.09));
      orb.addColorStop(1, rgb(pal.glow, 0));
      ctx.fillStyle = orb;
      ctx.fillRect(0, 0, width, height);

      // Caustic water bands
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      const bands = isSmall ? 3 : 5;
      for (let i = 0; i < bands; i++) {
        const yBase = height * (0.15 + i * 0.18) - p * height * 0.25;
        ctx.beginPath();
        for (let x = -40; x <= width + 40; x += 24) {
          const y =
            yBase +
            Math.sin(x * 0.004 + time * 0.0004 + i * 1.7) * 16 +
            Math.sin(x * 0.011 + time * 0.0007 + i) * 7;
          if (x === -40) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.strokeStyle = rgb(pal.glow, 0.05 + 0.03 * Math.sin(time * 0.0005 + i));
        ctx.lineWidth = 1.2;
        ctx.stroke();
      }
      ctx.restore();

      // Floating plankton / bubbles with parallax depth
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      for (const s of particles) {
        if (!reduced) s.y -= s.speed * dt * (0.4 + s.depth);
        if (s.y < -0.05) s.y = 1.05;
        const parallax = (p * 0.9 + 0.1) * s.depth;
        const x =
          s.x * width +
          Math.sin(time * 0.0003 + s.drift) * 22 * s.depth +
          px * 26 * s.depth;
        const y = ((s.y + parallax) % 1.1) * height + py * 14 * s.depth;
        const alpha = 0.12 + s.depth * 0.32;
        ctx.beginPath();
        ctx.arc(x, y, s.r * (0.6 + s.depth), 0, Math.PI * 2);
        ctx.fillStyle = rgb(pal.glow, alpha);
        ctx.fill();
      }
      ctx.restore();

      // Vignette for cinematic depth of field
      const vg = ctx.createRadialGradient(
        width / 2,
        height / 2,
        Math.min(width, height) * 0.3,
        width / 2,
        height / 2,
        Math.max(width, height) * 0.78,
      );
      vg.addColorStop(0, "rgba(0,0,0,0)");
      vg.addColorStop(1, `rgba(0,0,0,${0.42 + p * 0.16})`);
      ctx.fillStyle = vg;
      ctx.fillRect(0, 0, width, height);
    };

    let last = performance.now();
    const loop = (now: number) => {
      const dt = Math.min(48, now - last);
      last = now;
      if (running) draw(dt);
      raf = requestAnimationFrame(loop);
    };

    const onVisibility = () => {
      running = document.visibilityState === "visible";
      last = performance.now();
    };

    resize();
    seedParticles();
    raf = requestAnimationFrame(loop);
    window.addEventListener("resize", resize);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", onVisibility);
      particles = [];
    };
  }, []);

  return (
    <div className="pointer-events-none fixed inset-0 z-0" aria-hidden="true">
      <canvas ref={canvasRef} className="block h-full w-full" />
      <div className="absolute inset-0 bg-[radial-gradient(120%_80%_at_50%_-10%,transparent,rgba(2,6,14,0.35))]" />
    </div>
  );
}
