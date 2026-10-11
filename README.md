# NORDVALE: Winter Hoodie Store

Vite + React + TypeScript + Tailwind, with sharp for the image pipeline, plus Three.js (R3F), GSAP ScrollTrigger, Lenis, Framer Motion and Zustand.

```bash
npm install
npm run dev      # http://localhost:5173
npm run build
```

## Where to edit things
| What | File |
|---|---|
| Products, colours, designs, prices, stock | `src/data/products.ts` |
| Asset paths (one line each), brand name, contact info, shipping rules | `src/config/assets.ts` |
| Reviews, FAQ, fabrics, Winter Essentials picks | `src/data/content.ts` |
| Size charts per category | `src/data/products.ts` (`SIZE_CHARTS`) |
| Promo codes (`WINTER10`, `FIRSTFROST`, `WARMUP`) | `src/store/useStore.ts` |
| Payment integrations (TODOs and env vars) | `src/lib/payments.ts`, `.env.example` |

## Product images
16 products × 4 colours, one portrait photo each. Drop new photos or videos in `incoming/` and run `npm run images`; see **ASSETS.md**. Everything else (swatches, designs, icons, OG image) is generated in code.

## Hero product
The hero features the product flagged `heroFeatured: true` in `src/data/products.ts` (colour via `heroColor`). Name, colour, price, Shop Now and the colour dots all come from it. Assets: `public/assets/hero/hoodie-assembly.mp4` and `hoodie-static.webp` (prompts in **FLOW_PROMPTS.md**).

## Hero modes
- `video` (desktop and Android): scroll-scrubbed `hero-assembly.mp4`.
- `static`: iOS, low-end, data-saver, reduced motion; shows `hero-static.webp`.
- `webgl`: built-in procedural hoodie, shown only while the real hero files are missing.
- Force a mode with `?hero=static` or `?hero=3d`.

## Routes
`/`, `/product/:slug`, `/checkout`, `/order-confirmation`, `/track`, `/privacy`, and a 404 page.
