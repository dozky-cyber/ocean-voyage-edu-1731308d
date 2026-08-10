# KERJAKU — Hero Wordmark Typography Update (Outfit + tosca A-dot)

Scope: the hero wordmark and the small navbar wordmark only. Nothing else changes.

## Reference read
The attached image shows KERJAKU as a wide, geometric, near-white uppercase sans wordmark with moderate letter spacing, and a small cyan dot sitting in the open counter (lower-middle) of the letter A. The serif tagline below stays as-is.

## What will change

1. Load Outfit (700 + 800) from the existing Google Fonts link in the root route, alongside the current families. Add a `--font-wordmark`-style token for Outfit so the wordmark uses it.
2. Hero `KERJAKU` switches from the current serif (currently resolving to Bodoni Moda via `--font-wordmark`) to Outfit 800; drop to 700 if 800 renders visibly heavier than the reference. Uppercase, centered, solid near-white, keeping only the existing subtle underwater text-shadow. No gradient, clip, mask, or animation.
3. Tracking tuned to roughly match the reference proportions (light positive tracking, not `0.2em`), with the clamp-based font size adjusted only if needed so all seven letters fit inside 320px without overflow.
4. Tosca dot: the hero heading renders `KERJ`, then an inline `relative` span wrapping `A`, then `KU`. The dot is an absolutely positioned small circle (em-based size and offsets so it scales with the font) centered in the lower counter of the A, using the existing `--primary` cyan token. No animation, no glow, no other letters touched.
5. Navbar wordmark uses Outfit 700/800 at its current size/tracking. No dot added. `DIGITAL PRODUCT JOURNEY` untouched.
6. Tagline `Work, made your way.` untouched — same serif, size, weight, position.

## Verification
Playwright screenshots of the hero at 320 / 360 / 390 / 412px plus one desktop width, checking: zero horizontal overflow, no glyph clipping, dot stays inside the A at every width, tagline unchanged, console clean.

## Technical notes
- Files touched: `src/routes/__root.tsx` (font link), `src/styles.css` (`--font-wordmark` / `.hero-wordmark` rules + dot helper), `src/components/kerjaku/stages/HeroStage.tsx` (split A wrapper), `src/components/kerjaku/SiteNav.tsx` (navbar wordmark class).
- No content, canvas, scroll, or layout code is modified. No publish.
