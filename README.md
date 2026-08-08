# Kerjaku_space

Create a new production-quality React + TypeScript website named **EDU CHANCE — Cinematic Ocean Experience**. This is a careful rebuild of the user's latest EDU CHANCE single-page experience (latest known build: EDU_CHANCE_V49_DEPLOY_FIX_SINGLE_INDEX), not a generic landing page.

Known existing identity and features that MUST be carried forward:
- Brand/product identity: **EDU CHANCE** / **PELUANG**.
- Indonesian educational experience for choosing **SMP** or **SMA**.
- Ocean / underwater / cinematic voyage visual identity.
- Existing-style intro, ship/ocean/dolphin/treasure exploration motifs, Materi and Petunjuk navigation, grade switcher, interactive learning/program choices, and an AI assistant section.
- The AI section must visibly include a high-quality human/person portrait as a real composed visual element; never leave a blank image placeholder. Use a tasteful temporary royalty-free/generated portrait asset only until the user's exact portrait is supplied, and structure the asset so it can be replaced easily without changing layout.
- Preserve functional buttons and navigation. No dead links, no duplicate header, no placeholder href="#" interactions.
- The SMP and SMA buttons must be perfectly aligned and work both ways. After scrolling down, users must be able to scroll upward normally and reverse the visual journey.

IMPORTANT LIMITATION TO HANDLE HONESTLY IN THE BUILD: the original HTML source is not attached inside this Lovable project, so recreate the known EDU CHANCE experience from the requirements below. Do not claim that unknown business logic was preserved. Build the complete functional front-end and keep all content/data centralized so the user's exact legacy copy/assets can be substituted safely.

PRIMARY SPECIFICATION

Use a premium immersive reference-video style as the MAIN VISUAL, MOTION, TRANSITION, and INTERACTION direction, but do not copy any external brand, logo, product names, written content, or exact assets.

Before finishing, audit every page, route, component, button, image, animation, and responsive state. Remove obsolete CSS, duplicated components, conflicting animations, unused code, console warnings, TypeScript errors, missing keys, hydration problems, and runtime errors.

DESIGN GOAL
Transform the website into a premium cinematic, interactive, three-dimensional digital experience. It must feel cinematic, futuristic, experimental, premium, immersive, elegant, clean, smooth, highly polished, and visually realistic.

Do not create a generic SaaS landing page. Do not use a basic card-grid layout. Do not fake the entire experience with a looping background video. Build a real interactive environment.

VISUAL DIRECTION
Create a full-screen immersive visual world with layered depth using realistic 3D-inspired environments, floating visual elements, soft atmospheric fog, depth of field, reflections, volumetric lighting, subtle bloom, refraction/glass, water-like surfaces, parallax, organic objects, cinematic shadows, smooth gradient lighting, high-resolution imagery, editorial typography, and minimal interface elements.

Combine a modern grotesk sans-serif with an elegant editorial serif. Typography must remain readable and never overlap the scene. Maintain generous spacing and strong visual hierarchy.

PAGE EXPERIENCE — ONE CONTINUOUS JOURNEY
Build the landing page as approximately five connected visual stages, controlled by one scroll-progress system rather than normal disconnected stacked sections:

1. CINEMATIC HERO
- Full-screen hero using EDU CHANCE / PELUANG identity and Indonesian educational copy.
- Large sculptural/environmental ocean centerpiece.
- Sophisticated dark, misty, dusk-blue or neutral atmosphere that naturally connects to the ocean environment.
- Subtle floating particles and slow environmental motion.
- Stable navigation above the visual canvas.
- Primary and secondary CTAs visible and perfectly aligned.

2. PASTEL DIGITAL WORLD
- Transition smoothly into a softer pastel aquatic/digital environment.
- Floating learning fragments, abstract educational objects, interface shards, books/compass/data motifs, and brand-relevant elements at different parallax speeds.
- Reflective or water-like surface where appropriate.
- Text fades/transforms naturally rather than popping.

3. ORGANIC SHOWCASE
- Central detailed organic/sculptural ocean composition.
- Present educational paths/features as spatial objects, not a generic card grid.
- Objects can emerge, rotate, float, or separate gently as the user scrolls.
- Realistic contact shadows/reflections.
- Provide fully functional interactions for learning choices and grade selection.

4. AI EXPERIENCE
- Enter a deeper violet/blue/futuristic underwater atmosphere.
- Include a real functioning AI-style prompt interface (local deterministic demo interaction is acceptable; do not pretend to call an unavailable backend).
- The person portrait must be visible, sharp, well framed, naturally lit, and integrated with layered depth/glow/parallax.
- Absolutely no horizontal line, accidental divider, underline, border seam, pseudo-element artifact, or abrupt rendering boundary while entering AI.
- Do not hide/crop/remove the portrait.
- Animate indicators/benefits gradually.

5. FINAL CTA WORLD
- Strong cinematic closing scene with calm premium ocean atmosphere.
- Use EDU CHANCE final CTA and relevant educational content.
- Buttons obvious and usable.
- No abrupt ending.

SCROLL AND TRANSITIONS
Scrolling/trackpad movement must control a continuous reversible timeline.
Required:
- Smooth scroll-linked camera movement.
- Reversible when scrolling upward.
- Soft inertia with controlled acceleration/deceleration.
- No sudden jumps, harsh snap, instant color changes, flicker, white flash, freezing, delayed visibility, teleportation, visible scrollbar crossing the design, or horizontal scrolling.
- Use progress-based interpolation.
- Major transitions approximately 1.0–1.6 seconds perceptually; interface transitions 300–700ms.
- Prefer cubic-bezier(0.22,1,0.36,1), power3.inOut, expo.out where appropriate.
- Combine camera/object movement, opacity, controlled blur, scale, lighting, background interpolation, text movement, depth, and parallax.
- Never just fade the whole screen to black.

TEXT ANIMATION
Use restrained staggered line reveal, selected word reveal, opacity 0→1, blur around 8–12px→0, small vertical movement, clipping masks, and deliberate exit motion. Do not overanimate, shake, distort, or overlap text.

BUTTONS
All buttons must share a consistent design system: height, radius, padding, type, hover/active/focus/disabled states, subtle desktop magnetic/depth interaction, minimum mobile touch area, and stable alignment. Buttons must remain in the accessible HTML layer above the scene and never be covered by canvas.

NAVIGATION
- Stable, clean, readable, above canvas.
- No unwanted underline/horizontal active-state line.
- Mobile menu opens/closes smoothly.
- Links go to correct stage/route.
- No duplicate header.
- Include Materi, Petunjuk, AI, and grade-switch navigation where relevant.

IMAGE QUALITY
- Sharp responsive imagery, correct aspect ratio/object-fit/object-position.
- Do not stretch low-resolution images.
- Preload critical assets; lazy load noncritical assets.
- Graceful placeholders; no broken-image icon or empty container.
- Person portrait must always be visible in AI section.

TECHNICAL IMPLEMENTATION
Use the existing Lovable React + TypeScript + Tailwind + shadcn stack. Add only stable dependencies necessary for the experience.
Preferred approach:
- React Three Fiber + Three.js + @react-three/drei for a single fixed/sticky scene canvas, when WebGL is available.
- GSAP + ScrollTrigger for one synchronized master timeline.
- Framer Motion only for interface-level transitions.
- Lenis or one equivalent smooth-scroll system only; never combine conflicting smooth-scroll libraries.
- Keep semantic text/buttons in HTML layer for accessibility.
- Normalized scroll progress 0–1 mapped across the five worlds.
- Avoid React state updates every animation frame.
- Dispose geometries/textures/materials; pause expensive rendering when tab inactive.
- Use requestAnimationFrame efficiently.

PERFORMANCE
- Adaptive DPR, clamp roughly 1–1.75.
- Compressed optimized imagery, WebP/AVIF where supported.
- Suspense loading state and asset preloading.
- Reduce particle count/effects on weak devices and mobile.
- WebGL capability detection with a beautiful static fallback.
- prefers-reduced-motion support.
- Avoid huge textures, excessive post-processing, multiple canvases, memory leaks, or libraries fighting over CSS properties.

RESPONSIVE
Desktop: full immersive depth and balanced composition.
Tablet: preserve story with reduced objects/camera motion.
Mobile: recompose, do not merely shrink desktop; no cropped headings, no offscreen content, no horizontal overflow; portrait framed correctly; buttons accessible; smooth vertical scroll.

BUGS TO ELIMINATE
Missing portrait, broken image paths, line entering AI, horizontal overflow, visible layout boundaries, bad z-index, canvas covering buttons, header behind canvas, sudden backgrounds, unsynced transitions, scroll freeze, aggressive snap, content flash, animation restart, invisible elements, broken mobile, text clipping, button misalignment, duplicate navigation/sections, empty loading, low-res assets, route artifacts, console warnings/errors, TypeScript/runtime errors, dead buttons, placeholder links, fake interactions.

FUNCTIONAL CONTENT / UX TO INCLUDE
- Indonesian copy throughout.
- Hero headline centered around “PELUANG” and an immersive learning voyage.
- Clearly aligned CTAs such as “Mulai Menjelajah” and “Pelajari Cara Kerja”.
- Grade selector with two equal real buttons: SMP — Sekolah Menengah Pertama; SMA — Sekolah Menengah Atas.
- A persistent but unobtrusive control to change grade later.
- Interactive learning worlds/options inspired by ocean exploration, such as Jelajah Materi, Misi Pembelajaran, Tantangan/Permainan, and AI Pendamping. Use elegant spatial arrangement rather than a plain grid.
- Materi and Petunjuk should open working in-app panels/routes with meaningful Indonesian content and a clear back/close action.
- AI demo should accept a question, produce a clearly labeled local demo response, and provide example prompts. Do not falsely claim real external AI connectivity.
- Final CTA invites the user to begin the selected learning journey.

QUALITY CONTROL BEFORE COMPLETION
1. Test every route/page.
2. Test every CTA/navigation link.
3. Test up/down scrolling repeatedly, including slow/fast/trackpad-like momentum.
4. Test desktop/tablet/mobile.
5. Test refresh/direct route access.
6. Test slow network/loading states.
7. Check console and TypeScript.
8. Confirm no missing image and portrait visible.
9. Confirm no line/artifact around AI transition.
10. Confirm animations remain smooth after repeated navigation.
11. Confirm reduced-motion usability.
12. Remove temporary debug content.

ACCEPTANCE CRITERIA
- Immersive, polished, continuous cinematic journey.
- Smooth reversible synchronized transitions.
- Sharp correctly framed visuals.
- Person portrait visible.
- No accidental AI transition line.
- Buttons/navigation aligned and functional.
- No broken links, horizontal overflow, console/React/TypeScript/runtime errors.
- Desktop and mobile intentionally designed.
- Functional implementation, not just a mockup.

After coding, inspect the preview yourself, identify visible and functional defects, and repair them in the same run before stopping.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://ocean-voyage-edu.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/6128323d-d63b-4299-8400-498fb3a219b2).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
