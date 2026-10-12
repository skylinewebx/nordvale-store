# Diagnosis and fixes

All numbers come from the **production build** (`npm run build`, served with `vite preview`) using Playwright (`scripts/measure.mjs`) and Lighthouse (`scripts/lh.mjs`). Mobile profile: 390×844, 4× CPU throttle, Fast 4G. Desktop: 1440×900. The browser is headless Chromium with software rendering, so absolute FPS is pessimistic; before and after use identical settings. Screenshots are in `diagnosis/before` and `diagnosis/after`.

## Before / after

| Metric | Before (mobile / desktop) | After (mobile / desktop) | Target |
|---|---|---|---|
| Scroll FPS | 31.7 / 19.5 | **51.3 / 57.5** | 55–60 |
| Long tasks while scrolling | 89 / 237 | **3 / 0–1** | none over 100 ms |
| Longest task while scrolling | 75 / 81 ms | under 100 ms | under 100 ms |
| CLS | 1.09 / 1.04 | **0 / 0.004** | under 0.05 |
| Lighthouse mobile performance | 37 | **73–93 (median about 88)** | 85+ |
| Lighthouse LCP / TBT / TTI | 5.1 s / 5,200 ms / 13.9 s | 2.1–2.8 s / 210–710 ms / 4.1–4.8 s | LCP under 2.5 s |
| First-visit transfer (total / images) | 2,579 / 2,032 KB | **2,126 / 1,793 KB** | n/a |
| Failed requests, console errors | 0 / 0 | 0 / 0 | 0 |

Lighthouse varies run to run on this machine (individual runs: 90, 93, 71, 90, 93, then 85, 87, 73). The median is about 88.

## Root causes and what changed

| # | Root cause (measured) | Fix |
|---|---|---|
| 1 | **CLS above 1.0**: GSAP `pin` swaps the hero between `fixed` and `absolute`, which Chrome counts as layout shift (0.97 at pin end, 0.07 at pin start). | Hero is now `position: sticky` inside a tall wrapper; ScrollTrigger only reads progress. CLS is 0. |
| 2 | **Hero zone at 24 FPS (desktop)**: a 190vmax masked, scaled rays layer; 44 per-frame `createRadialGradient` calls; SVG transforms using `transform-box`; blend mode on the video. | Small rays layer with no scale animation; pre-rendered glow sprites on a half-resolution canvas; SVG `transform` attributes with explicit pivots; flat hero background so no `mix-blend-mode`. Hero is now about 59 FPS. |
| 3 | **Lighthouse TBT 5.2 s**: a 1 MB three.js chunk existed only for the placeholder hoodie. | Replaced with a light SVG placeholder driven by the same scroll progress; removed `three`, `@react-three/fiber`, `@react-three/drei`. |
| 4 | **Startup work**: every section, drawer and the footer rendered before first paint; full framer-motion loaded eagerly; layout projection measured all 16 cards at mount (`measureScroll`, 218 ms). | `Deferred` mounts below-fold sections in staggered `startTransition` steps; `LazyMotion` (features load after first paint); card layout animation enabled only on first intent; Collection mounts 8 cards then the rest in idle steps; routes lazy-loaded; one `ScrollTrigger.refresh`. |
| 5 | **Per-frame counter text writes** cost about 6 ms per frame in the fabrics and story sections (craft 40 → 55 FPS when removed). | Counters write at most every 90 ms, in contained inline-blocks. |
| 6 | **Product images invisible** in a first rewrite of the image component: a mangled regex gave every wrapper both `absolute` and `relative`, so the box collapsed to 0 px high. | Replaced with a plain `hasPos()` helper. The harness now also fails on collapsed boxes (`scripts/measure.mjs`) and `scripts/test-images.mjs` checks visibility. |
| 7 | **Other image fragilities**: the manifest fetch required a JSON content-type; blur could stay if decode never resolved; no fallback on error. | The manifest is inlined into the HTML at build (`window.__PRODUCTS__`): no request, instant blur placeholders and sizes. Images are plain `<img>` with width/height, srcset/sizes, `fetchpriority="high"` on the first 4 cards only, `loading="lazy"` for the rest. The blur is always removed on load or error; `onError` shows a clean placeholder. |
| 8 | **Crops**: trousers (waist-down) were not anchored at the bottom. | Per-category `objectPosition`: tops and jackets `center top`, trench `center 20%`, trousers `center bottom`, t-shirts `center top`. |
| 9 | **Quick-add always visible** (framer's inline opacity overrode the hover rule) with `backdrop-blur` on every card; bento grid left a hole with 4 items. | Hover reveal via CSS on the wrapper; no blur; featured card only when 8+ items. |
| 10 | **Expensive paint effects**: `backdrop-filter` on the navbar, filter bar, overlays and cursor; animated `box-shadow`; permanent `will-change` on dozens of elements; always-mounted full-screen overlay layers. | Solid backgrounds; shadow is a pre-rendered layer whose opacity animates; all static `will-change` removed; hidden panels get `visibility: hidden` so they leave the compositor. |
| 11 | **Smooth scroll on phones**: Lenis ran everywhere. | Lenis on desktop only (`autoRaf: false`, shared GSAP ticker, `lagSmoothing(0)`, lerp 0.1). Touch uses native scrolling. |
| 12 | **Always-running loops** (reviews marquee, 12 breathing cards in JS, particles). | Marquee pauses off-screen; breathing is CSS keyframes only while the section is visible; particles stop when the hero is off-screen. |
| 13 | **No LITE mode.** | Auto LITE (4 cores or fewer, 4 GB or less, data saver, reduced motion, or FPS under 45 for 2 s while scrolling): no particles, parallax, breathing or ray spin. |
| 14 | **Decoding while scrolling** and 8 high-priority preloads. | Only the first row (4) is preloaded; the rest warm in idle batches of 6 and pause while the visitor scrolls; decoded images are cached in a Map. |
| 15 | **Service worker**: cache-first and unversioned; manifest stale-while-revalidate. | Versioned caches (`nv-img-v3`, `nv-page-v3`), stale-while-revalidate for images, network-first for HTML and `manifest.json`, `skipWaiting` + `clients.claim`, old caches deleted on activate; registered in production only (and removed in development). Tested in `scripts/test-images.mjs`. |
| 16 | **Fonts** blocked first paint and loaded unused weights. | Non-blocking stylesheet, `font-display: swap`, weights limited to those used, an instant static splash. |

## Image audit
- 64 expected files; **62 present**. Missing: `glacier-haze-mint`, `milan-pleat-chocolate-brown`. They show a clean placeholder until the files are added.
- No slug or case mismatches, no stray files, no stale manifest. All product paths come from `src/lib/catalog.ts` and `manifest.json`; no hand-written paths elsewhere.
- Old recolor and pose-sheet code is gone.

## Tests (`node scripts/test-images.mjs`, all PASS)
Every category tab shows all images in 108–256 ms with no blur left; swatch swap changes the image in 16 ms while both image layers stay mounted; the dot colour comes from the data; the selected colour persists; the detail view upgrades to the 1080 px variant; a broken image falls back to a placeholder; the service worker cleans old caches.

## Still not at target
- **Mobile scroll FPS is about 51, not 55–60** in this harness. Remaining cost is paint/composite under software rendering at 4× CPU in the fabrics and collection zones (script time there is under 140 ms). Desktop meets the target. On a real phone GPU this stage is much cheaper, and LITE mode engages automatically below 45 FPS.
- **Lighthouse is noisy** (73–93 across runs); the target of 85 is met on most runs, not all.
- The hero still needs `public/assets/hero/hoodie-assembly.mp4` and `hoodie-static.webp` (prompts in `FLOW_PROMPTS.md`); until then the SVG placeholder runs.

## Reproduce
```bash
npm run build && npx vite preview --port 4173 --host 127.0.0.1
node scripts/measure.mjs after          # screenshots + FPS/CLS/LCP/bytes (NOSW=1 for first-visit bytes)
node scripts/lh.mjs after               # Lighthouse
node scripts/test-images.mjs            # image-system checks
node scripts/scrollprofile.mjs mobile   # frame time per section
```
