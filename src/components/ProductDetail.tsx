import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { BRAND, money } from "../config/assets";
import { colorOf, effectivePrice, photoKey, Product, products, SIZE_CHARTS } from "../data/products";
import { detailUrl, useCatalog } from "../lib/catalog";
import { loadImage } from "../lib/imageCache";
import { useStore } from "../store/useStore";
import { Icon, Stars } from "./Icons";
import { ProductImage, ProductVideo, SwapImage } from "./ProductImage";
import { swatchBg } from "./ProductCard";

function Acc({ title, children, open: o = false }: { title: string; children: React.ReactNode; open?: boolean }) {
  const [open, setOpen] = useState(o);
  return (
    <div className="border-t hair">
      <button className="w-full flex justify-between items-center min-h-[52px] text-[11px] uppercase tracking-[0.18em]" onClick={() => setOpen(!open)} aria-expanded={open}>
        {title}<Icon name={open ? "minus" : "plus"} size={16} />
      </button>
      <AnimatePresence initial={false}>
        {open && <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.35 }} className="overflow-hidden"><div className="pb-5 text-[13px] text-ink/75 leading-relaxed">{children}</div></motion.div>}
      </AnimatePresence>
    </div>
  );
}

export default function ProductDetail({ product: p, onOpen }: { product: Product; onOpen: (slug: string) => void }) {
  const picked = useStore((s) => s.picked[p.slug]); const pick = useStore((s) => s.pickColor);
  const color = colorOf(p, picked);
  const [size, setSize] = useState("");
  const [qty, setQty] = useState(1);
  const [err, setErr] = useState(false);
  const [guide, setGuide] = useState(false);
  const [added, setAdded] = useState(false);
  const add = useStore((s) => s.addToCart); const wished = useStore((s) => s.wishlist.includes(p.slug)); const toggle = useStore((s) => s.toggleWish);
  const items = useCatalog((s) => s.items);
  const chart = SIZE_CHARTS[p.category];
  const price = effectivePrice(p);
  const related = [...products.filter((x) => x.slug !== p.slug && x.category === p.category), ...products.filter((x) => x.category !== p.category)].slice(0, 4);

  // warm the sharp (detail) variants of this product's colours at low priority, so swatches stay instant
  useEffect(() => {
    const t = setTimeout(() => p.colors.forEach((c) => { const it = items[photoKey(p.slug, c.slug)]; if (it) loadImage(detailUrl(photoKey(p.slug, c.slug), it), "low").catch(() => {}); }), 250);
    return () => clearTimeout(t);
  }, [p, items]);

  const doAdd = () => {
    if (!size) { setErr(true); return; }
    add({ slug: p.slug, colorId: color.id, size, qty });
    setAdded(true); setTimeout(() => setAdded(false), 1800);
  };

  return (
    <div className="grid lg:grid-cols-2">
      {/* photo: opens from the cached card image, then upgrades to the detail variant */}
      <div className="lg:sticky lg:top-0 lg:h-[calc(100dvh-4rem)] p-4 md:p-8 flex items-center justify-center bg-mist/30">
        <div className="relative w-full max-w-[460px] lg:max-w-none lg:w-auto lg:h-full lg:max-h-[900px] aspect-[3/4] lg:aspect-[9/16]">
          <SwapImage product={p} colorId={color.id} upgrade priority className="absolute inset-0" />
          <ProductVideo product={p} colorId={color.id} want slot="detail" />
          <p className="absolute top-3 left-4 eyebrow pointer-events-none drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]">{color.name}</p>
        </div>
      </div>

      {/* info */}
      <div className="p-5 md:p-10 lg:pl-6 lg:pr-12 lg:py-12">
        <p className="eyebrow">{p.type}</p>
        <h2 className="text-[clamp(34px,4vw,52px)] leading-none mt-2">{p.name}</h2>
        <p className="font-display italic text-[19px] text-stone mt-2">{p.tagline}</p>
        <div className="mt-5 flex items-center gap-4 flex-wrap">
          <span className="text-[20px] tabular-nums">{money(price)}</span>
          {p.salePrice && <s className="text-stone text-[14px]">{money(p.price)}</s>}
          <span className="flex items-center gap-2 text-[12px] text-stone"><Stars value={p.rating} />{p.rating} ({p.reviewCount})</span>
        </div>
        <p className={`mt-3 text-[12px] ${p.stock === "low" ? "text-accent" : "text-stone"}`}>{p.stock === "out" ? "Out of stock" : p.stock === "low" ? "Low stock · only a few left" : "In stock · ships in 24h"}</p>

        <fieldset className="mt-8">
          <legend className="eyebrow mb-3">Colour · <span className="text-ink normal-case tracking-normal text-[13px]">{color.name}</span></legend>
          <div className="flex gap-1 -ml-1 flex-wrap">
            {p.colors.map((c) => (
              <button key={c.id} onClick={() => pick(p.slug, c.id)} aria-label={c.name} aria-pressed={c.id === color.id} className="w-12 h-12 flex items-center justify-center">
                <span className={`block w-8 h-8 rounded-full border border-ink/15 transition-all ${c.id === color.id ? "ring-1 ring-ink ring-offset-[3px] ring-offset-snow" : ""}`} style={{ background: swatchBg(c) }} />
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset className="mt-6">
          <legend className="eyebrow mb-3 flex justify-between w-full">Size <button type="button" className="underline normal-case tracking-normal text-[12px] min-h-[24px]" onClick={() => setGuide(!guide)}>Size guide</button></legend>
          <div className="grid grid-cols-6 gap-2" role="radiogroup" aria-label="Size">
            {p.sizes.map((s) => (
              <button key={s} role="radio" aria-checked={size === s} onClick={() => { setSize(s); setErr(false); }} className={`min-h-[48px] text-[13px] border transition-colors ${size === s ? "bg-ink text-snow border-ink" : "hair hover:border-ink"}`}>{s}</button>
            ))}
          </div>
          {err && <p role="alert" className="text-[12px] text-accent mt-2">Please select a size.</p>}
          <AnimatePresence>
            {guide && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                <table className="w-full mt-4 text-[12px] text-center"><caption className="sr-only">{chart.title} size chart in centimetres</caption>
                  <thead className="text-stone"><tr>{chart.head.map((h) => <th key={h} scope="col" className="py-2 font-light">{h}</th>)}</tr></thead>
                  <tbody>{chart.rows.map((r) => <tr key={r[0]} className={`border-t hair ${r[0] === size ? "bg-mist/60" : ""}`}>{r.map((cell, i) => <td key={i} className="py-2">{cell}</td>)}</tr>)}</tbody>
                </table>
                <p className="text-[11px] text-stone mt-2">Measurements in cm{p.category === "trousers" ? " (waist size in inches)" : ""}. {chart.note}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </fieldset>

        <div className="mt-8 flex gap-3">
          <div className="flex items-center border hair">
            <button className="w-12 h-12 flex items-center justify-center" onClick={() => setQty(Math.max(1, qty - 1))} aria-label="Decrease quantity"><Icon name="minus" size={14} /></button>
            <span className="w-8 text-center text-[14px] tabular-nums">{qty}</span>
            <button className="w-12 h-12 flex items-center justify-center" onClick={() => setQty(Math.min(10, qty + 1))} aria-label="Increase quantity"><Icon name="plus" size={14} /></button>
          </div>
          <button className="btn btn-solid flex-1" onClick={doAdd} disabled={p.stock === "out"}>{added ? "Added ✓" : "Add to bag"}</button>
          <button className="w-12 h-12 border hair flex items-center justify-center hover:border-ink transition-colors" onClick={() => toggle(p.slug)} aria-pressed={wished} aria-label={wished ? "Remove from wishlist" : "Add to wishlist"}><Icon name="heart" className={wished ? "fill-ink" : ""} /></button>
        </div>
        <ul className="mt-5 grid grid-cols-2 gap-3 text-[12px] text-stone">
          <li className="flex gap-2 items-center"><Icon name="truck" size={16} />Free shipping over {money(BRAND.freeShippingThreshold)}</li>
          <li className="flex gap-2 items-center"><Icon name="return" size={16} />30-day free returns</li>
        </ul>

        <div className="mt-10">
          <Acc title="Story" open><p>{p.story}</p></Acc>
          <Acc title="Specifications">
            <dl className="grid grid-cols-[110px_1fr] gap-y-2">
              <dt className="text-stone">Fabric</dt><dd>{p.fabric.type}</dd>
              <dt className="text-stone">Composition</dt><dd>{p.fabric.composition}</dd>
              {p.fabric.gsm && <><dt className="text-stone">Weight</dt><dd>{p.fabric.gsm} GSM</dd></>}
              <dt className="text-stone">Fit</dt><dd>{p.fit}</dd>
              <dt className="text-stone">Details</dt><dd><ul className="space-y-1">{p.details.map((d) => <li key={d}>{d}</li>)}</ul></dd>
            </dl>
          </Acc>
          <Acc title={`Made in ${p.madeIn}`}><p>{p.manufacturing}</p></Acc>
          <Acc title="Care"><ul className="list-disc pl-4 space-y-1">{p.care.map((c) => <li key={c}>{c}</li>)}</ul></Acc>
          <Acc title="Shipping & returns"><p>Free shipping over {money(BRAND.freeShippingThreshold)}, otherwise {money(BRAND.shippingFlat)}. Domestic delivery 2–4 days, international 5–10 days. Returns are free within 30 days on unworn items with tags.</p></Acc>
          <div className="border-t hair" />
        </div>
      </div>

      {/* related */}
      <section className="lg:col-span-2 px-5 md:px-10 py-14 border-t hair">
        <h3 className="text-[28px] mb-6">You may also like</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {related.map((r) => (
            <button key={r.slug} className="text-left group" onClick={() => onOpen(r.slug)}>
              <div className="aspect-[3/4] relative overflow-hidden"><ProductImage product={r} colorId={useStore.getState().picked[r.slug]} className="absolute inset-0" /></div>
              <p className="font-display text-[19px] mt-3">{r.name}</p>
              <p className="text-[12px] text-stone">{money(effectivePrice(r))}</p>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
