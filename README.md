# NORDVALE: showcase store

Vite + React + TypeScript + Tailwind. GSAP ScrollTrigger + Lenis (desktop only), Framer Motion (lazy), Zustand, sharp for images.

```bash
npm install
npm run dev      # http://localhost:5173
npm run build
```

## Routes
| Route | What |
|---|---|
| `/` | Showcase hero, Full Collection, Contact, Footer |
| `/product/:slug?color=` | Product page (colour is kept in the URL) |
| `/craftsmanship` | Six fabrics + stitching, sizing, sustainability |
| `/story`, `/reviews`, `/faq`, `/size-guide`, `/shipping-returns`, `/track`, `/privacy` | Simple pages linked from the footer |
| `/checkout`, `/order-confirmation` | Checkout (demo payments) |

## Change the featured product of a category (one place)
`src/data/products.ts` → `CATEGORIES[].heroFeatured` (product slug). The same entry holds the category title, description and the round chip thumbnail.

## Where to edit things
| What | File |
|---|---|
| Categories, products, colours, prices, stock, size charts | `src/data/products.ts` |
| Brand name, contact info, shipping rules | `src/config/assets.ts` |
| Sample reviews, FAQ, fabrics | `src/data/content.ts` (ratings and reviews are **sample data**) |
| Theme tokens (cream, charcoal, mauve, wine, easing) | `src/index.css` (`:root`) + `tailwind.config.js` |
| Showcase hero (State A / State B) | `src/hero/Showcase.tsx` |

## Images
- Product photos: `incoming/{slug}-{colour-slug}.jpg`.
- **Cut-outs** (transparent, model stands on the page): `node scripts/cutout.mjs` (needs `npm i -D @imgly/background-removal-node`, offline model, about 8 s per photo) writes `cutouts/{key}.png`.
- `npm run images` builds `public/assets/products/{key}.webp` (1080 w) and `{key}-card.webp` (540 w) from the cut-outs (bottom fade; trousers are cropped at the waist and trimmed to the feet), plus `manifest.json` (sizes, LQIP, hashes, videos).
- Originals of the studio photos are backed up in `public/assets/products-original/`.
- Fabric macros: `public/assets/fabrics/fabric-{fleece,french-terry,faux-leather,wool-tweed,linen,cotton-jersey}.webp`. Missing files fall back to a procedural SVG textile.
- Missing product photos fall back to a tinted garment silhouette. Real files override automatically by filename.
- Optional: `public/assets/hero/{hoodies|tshirts|trousers|jackets}.mp4` (muted clip over the featured product after 1.2 s idle) and `public/assets/products/{slug}-{colour}.mp4` ("Drag to turn" slider on the product page).

## Hosting under a sub-path
`BASE=/nordvale-store/ npm run build` (GitHub Pages project site). All asset URLs, the router and the service worker honour `import.meta.env.BASE_URL`.
