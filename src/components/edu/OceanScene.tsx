import { useEffect, useRef } from "react";
import { journey, prefersReducedMotion } from "@/lib/scroll-progress";

type RGB = [number, number, number];

/** Palette per journey stage: [top, mid, bottom] */
const PALETTES: { top: RGB; mid: RGB; bottom: RGB; glow: RGB }[] = [
  { top: [22, 62, 92], mid: [10, 32, 58], bottom: [4, 12, 26], glow: [128, 208, 236] }, // sea surface
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

/** Larger, rounder, rim-lit gas bubbles — visually distinct from plankton dust. */
type Bubble = {
  x: number;
  y: number;
  r: number;
  speed: number;
  wobble: number;
  wobbleAmp: number;
  blur: number;
  alpha: number;
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
    let bubbles: Bubble[] = [];
    let raf = 0;
    let running = true;
    let time = 0;

    const bubbleCount = reduced ? 8 : isSmall ? 14 : 26;

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
      bubbles = Array.from({ length: bubbleCount }, () => ({
        x: Math.random(),
        y: Math.random(),
        r: 2 + Math.random() * 9,
        speed: 0.00006 + Math.random() * 0.00022,
        wobble: Math.random() * Math.PI * 2,
        wobbleAmp: 6 + Math.random() * 22,
        blur: Math.random(),
        alpha: 0.16 + Math.random() * 0.3,
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

      // Slow surface refraction factor feeding the shafts below
      const refraction = Math.sin(time * 0.00009) * 0.5 + 0.5;

      // ---- Realistic moving sea surface seen from below --------------------
      const surfaceH = height * (0.2 - p * 0.14);
      const surfaceFade = Math.max(0, 1 - p * 1.25);
      // Undulating waterline used both by the surface body and the light rays
      const waveAt = (x: number) =>
        surfaceH +
        Math.sin(x * 0.0055 + time * 0.00021) * (10 + surfaceH * 0.06) +
        Math.sin(x * 0.0131 - time * 0.00034) * 6 +
        Math.sin(x * 0.027 + time * 0.00052) * 2.6;

      if (surfaceH > 4 && surfaceFade > 0.01) {
        ctx.save();
        ctx.globalCompositeOperation = "lighter";

        // Water body above the waterline: bright, refracting sky-light
        ctx.beginPath();
        ctx.moveTo(-40, -40);
        ctx.lineTo(width + 40, -40);
        for (let x = width + 40; x >= -40; x -= 14) ctx.lineTo(x, waveAt(x));
        ctx.closePath();
        const sky = ctx.createLinearGradient(0, -20, 0, surfaceH + 30);
        sky.addColorStop(0, rgb(pal.glow, 0.42 * surfaceFade));
        sky.addColorStop(0.55, rgb(pal.glow, 0.2 * surfaceFade));
        sky.addColorStop(1, rgb(pal.glow, 0.03 * surfaceFade));
        ctx.fillStyle = sky;
        ctx.fill();

        // Crest shimmer: bright irregular highlights riding the waterline
        const crests = isSmall ? 34 : 64;
        for (let i = 0; i < crests; i++) {
          const cx =
            ((i / crests) * width + Math.sin(time * 0.00012 + i * 1.7) * 26 + width) % width;
          const cy = waveAt(cx) - 2 - Math.sin(time * 0.0004 + i) * 3;
          const cw = 8 + ((i * 37) % 26);
          const a =
            (0.05 + 0.09 * (0.5 + 0.5 * Math.sin(time * 0.0006 + i * 2.3))) * surfaceFade;
          const gr = ctx.createRadialGradient(cx, cy, 0, cx, cy, cw);
          gr.addColorStop(0, rgb(pal.glow, a));
          gr.addColorStop(1, rgb(pal.glow, 0));
          ctx.fillStyle = gr;
          ctx.beginPath();
          ctx.ellipse(cx, cy, cw, cw * 0.34, 0, 0, Math.PI * 2);
          ctx.fill();
        }

        // Refraction ripples sinking below the surface
        const lines = isSmall ? 5 : 9;
        for (let i = 0; i < lines; i++) {
          const off = 6 + (i / lines) * surfaceH * 1.5;
          ctx.beginPath();
          for (let x = -30; x <= width + 30; x += 16) {
            const y =
              waveAt(x) +
              off +
              Math.sin(x * 0.014 + time * 0.00026 + i * 1.4) * (2.5 + i * 0.7);
            if (x === -30) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.strokeStyle = rgb(pal.glow, (0.075 - i * 0.006) * surfaceFade);
          ctx.lineWidth = 1 + (lines - i) * 0.16;
          ctx.stroke();
        }
        ctx.restore();
      }

      // ---- Organic sunlight rays born at the moving waterline ---------------
      const shafts = isSmall ? 5 : 9;
      const shaftAlpha = 0.13 * (1 - p * 0.6) * (0.85 + refraction * 0.3);
      if (shaftAlpha > 0.01) {
        ctx.save();
        ctx.globalCompositeOperation = "lighter";
        if (!reduced) ctx.filter = `blur(${isSmall ? 10 : 16}px)`;
        for (let i = 0; i < shafts; i++) {
          const phase = i * 1.618;
          const base =
            ((i + 0.5) / shafts) * width +
            Math.sin(time * 0.000055 + phase) * 46 +
            px * 26;
          const wobble = 0.6 + 0.4 * Math.sin(time * 0.00009 + phase * 2.1);
          const w = width * (0.022 + ((i * 13) % 7) * 0.006) * wobble;
          const len = height * (0.6 + ((i * 7) % 5) * 0.09);
          const a = shaftAlpha * (0.45 + 0.55 * (0.5 + 0.5 * Math.sin(time * 0.00013 + phase)));
          const top = waveAt(base) - 6;
          const grad = ctx.createLinearGradient(0, top, 0, top + len);
          grad.addColorStop(0, rgb(pal.glow, a));
          grad.addColorStop(0.35, rgb(pal.glow, a * 0.5));
          grad.addColorStop(1, rgb(pal.glow, 0));
          ctx.fillStyle = grad;
          const drift = Math.sin(time * 0.00007 + phase) * 70;
          ctx.beginPath();
          ctx.moveTo(base - w, top);
          ctx.lineTo(base + w, top);
          ctx.lineTo(base + w * 3.2 + drift, top + len);
          ctx.lineTo(base - w * 2.6 + drift, top + len);
          ctx.closePath();
          ctx.fill();
        }
        ctx.filter = "none";
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

      // Caustic refraction cells drifting through the upper water column
      const causticStrength = Math.max(0, 0.9 - p * 1.1);
      if (causticStrength > 0.02) {
        ctx.save();
        ctx.globalCompositeOperation = "lighter";
        if (!reduced) ctx.filter = `blur(${isSmall ? 4 : 7}px)`;
        const cells = isSmall ? 10 : 20;
        for (let i = 0; i < cells; i++) {
          const t = time * 0.00006;
          const cx =
            (Math.sin(i * 12.9898 + t) * 0.5 + 0.5) * width +
            Math.sin(time * 0.00018 + i) * 28;
          const cy =
            (Math.sin(i * 78.233) * 0.5 + 0.5) * height * 0.55 +
            Math.sin(time * 0.00011 + i * 1.7) * 22;
          const r = 26 + ((i * 29) % 60);
          const a = 0.035 * causticStrength * (0.5 + 0.5 * Math.sin(time * 0.0004 + i));
          const gr = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
          gr.addColorStop(0, rgb(pal.glow, a));
          gr.addColorStop(0.6, rgb(pal.glow, a * 0.4));
          gr.addColorStop(1, rgb(pal.glow, 0));
          ctx.fillStyle = gr;
          ctx.beginPath();
          ctx.ellipse(cx, cy, r, r * 0.42, Math.sin(i) * 0.6, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.filter = "none";
        ctx.restore();
      }

      // Floating plankton / dust with parallax depth
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      for (const s of particles) {
        if (!reduced) s.y -= s.speed * dt * (0.4 + s.depth);
        if (s.y < -0.05) s.y = 1.05;
        const parallax = (p * 0.9 + 0.1) * s.depth;
        const x =
          s.x * width + Math.sin(time * 0.0003 + s.drift) * 22 * s.depth + px * 26 * s.depth;
        const y = ((s.y + parallax) % 1.1) * height + py * 14 * s.depth;
        const alpha = 0.12 + s.depth * 0.32;
        ctx.beginPath();
        ctx.arc(x, y, s.r * (0.6 + s.depth), 0, Math.PI * 2);
        ctx.fillStyle = rgb(pal.glow, alpha);
        ctx.fill();
      }
      ctx.restore();

      // Real gas bubbles: rim-lit, varied sizes, slow rise with lateral wobble
      ctx.save();
      for (const b of bubbles) {
        if (!reduced) b.y -= b.speed * dt;
        if (b.y < -0.06) {
          b.y = 1.06;
          b.x = Math.random();
        }
        const bx = b.x * width + Math.sin(time * 0.0002 + b.wobble) * b.wobbleAmp + px * 18;
        const by = b.y * height + py * 10;
        const blurPx = b.blur * (isSmall ? 2.5 : 4);
        if (!reduced && blurPx > 0.6) ctx.filter = `blur(${blurPx.toFixed(1)}px)`;
        else ctx.filter = "none";

        // Body
        const body = ctx.createRadialGradient(
          bx - b.r * 0.3,
          by - b.r * 0.3,
          b.r * 0.1,
          bx,
          by,
          b.r,
        );
        body.addColorStop(0, rgb(pal.glow, b.alpha * 0.55));
        body.addColorStop(0.7, rgb(pal.glow, b.alpha * 0.1));
        body.addColorStop(1, rgb(pal.glow, 0));
        ctx.fillStyle = body;
        ctx.beginPath();
        ctx.arc(bx, by, b.r, 0, Math.PI * 2);
        ctx.fill();

        // Rim highlight
        ctx.beginPath();
        ctx.arc(bx, by, b.r * 0.92, 0, Math.PI * 2);
        ctx.strokeStyle = rgb(pal.glow, b.alpha * 0.65);
        ctx.lineWidth = Math.max(0.6, b.r * 0.09);
        ctx.stroke();

        // Specular dot
        ctx.beginPath();
        ctx.arc(bx - b.r * 0.34, by - b.r * 0.36, Math.max(0.5, b.r * 0.16), 0, Math.PI * 2);
        ctx.fillStyle = rgb(pal.glow, b.alpha * 0.9);
        ctx.fill();
      }
      ctx.filter = "none";
      ctx.restore();

      // Deep-sea floor: coral silhouettes emerging only in the final descent
      const seabed = Math.max(0, (p - 0.8) / 0.2);
      if (seabed > 0.001) {
        const ease = seabed * seabed * (3 - 2 * seabed);
        ctx.save();
        const floorTop = height * (1.06 - 0.3 * ease);
        // Silt haze above the floor
        const haze = ctx.createLinearGradient(0, floorTop - height * 0.18, 0, height);
        haze.addColorStop(0, rgb(pal.bottom, 0));
        haze.addColorStop(1, rgb(pal.bottom, 0.85 * ease));
        ctx.fillStyle = haze;
        ctx.fillRect(0, floorTop - height * 0.18, width, height);

        const silhouette = `rgba(2, 8, 16, ${0.92 * ease})`;
        ctx.fillStyle = silhouette;
        // Rocky ridge
        ctx.beginPath();
        ctx.moveTo(-20, height + 20);
        for (let x = -20; x <= width + 20; x += 18) {
          const y =
            floorTop +
            Math.sin(x * 0.006 + 1.2) * 16 +
            Math.sin(x * 0.017 + 0.4) * 8 +
            Math.sin(x * 0.0032) * 22;
          ctx.lineTo(x, y);
        }
        ctx.lineTo(width + 20, height + 20);
        ctx.closePath();
        ctx.fill();

        // Coral fans / branches rooted in the ridge
        const corals = isSmall ? 7 : 14;
        ctx.strokeStyle = silhouette;
        ctx.lineCap = "round";
        for (let i = 0; i < corals; i++) {
          const cx = ((i + 0.5) / corals) * width + Math.sin(i * 41.7) * 18;
          const rootY = floorTop + Math.sin(cx * 0.006 + 1.2) * 16 - 4;
          const h = (26 + ((i * 53) % 62)) * ease;
          const sway = Math.sin(time * 0.00035 + i) * 4;
          const branches = 3 + (i % 3);
          for (let b2 = 0; b2 < branches; b2++) {
            const spread = (b2 - (branches - 1) / 2) * (7 + (i % 4));
            ctx.lineWidth = 3 + (i % 3);
            ctx.beginPath();
            ctx.moveTo(cx, rootY + 6);
            ctx.quadraticCurveTo(
              cx + spread * 0.6 + sway,
              rootY - h * 0.55,
              cx + spread * 1.6 + sway * 1.6,
              rootY - h,
            );
            ctx.stroke();
          }
        }
        ctx.restore();
      }


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
      bubbles = [];
    };
  }, []);

  return (
    <div className="pointer-events-none fixed inset-0 z-0" aria-hidden="true">
      <canvas ref={canvasRef} className="block h-full w-full" />
      <div className="absolute inset-0 bg-[radial-gradient(120%_80%_at_50%_-10%,transparent,rgba(2,6,14,0.35))]" />
    </div>
  );
}
