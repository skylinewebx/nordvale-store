import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { AnimatePresence, m } from "framer-motion";
import { BRAND, money } from "../config/assets";
import { Icon, Stars } from "../components/Icons";
import { Overlay } from "../components/ui";
import { swatchBg } from "../components/ProductCard";
import { SwapImage, Silhouette } from "../components/ProductImage";
import { reviews } from "../data/content";
import { colorOf, effectivePrice, getProduct, photoKey, Product, products, SIZE_CHARTS } from "../data/products";
import { cardUrl, detailUrl, useCatalog, videoUrl } from "../lib/catalog";
import { reducedMotion } from "../lib/env";
import { playFlip } from "../lib/flip";
import { loadImage } from "../lib/imageCache";
import { useSeo } from "../lib/seo";
import { useTilt } from "../lib/tilt";
import { useStore } from "../store/useStore";
import { NotFound } from "./Misc";

function Acc({ title, children, open: o = false }: { title: string; children: React.ReactNode; open?: boolean }) {
  const [open, setOpen] = useState(o);
  return (
    <div className="border-t hair">
      <button className="w-full flex justify-between items-center min-h-[52px] text-[11px] uppercase tracking-[0.2em]" onClick={() => setOpen(!open)} aria-expanded={open}>
        {title}<Icon name={open ? "minus" : "plus"} size={15} />
      </button>
      <AnimatePresence initial={false}>
        {open && <m.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }} className="overflow-hidden"><div className="pb-5 text-[13px] text-ink/75 leading-relaxed">{children}</div></m.div>}
      </AnimatePresence>
    </div>
  );
}

/** "Drag to turn": scrubs {slug}-{colour}.mp4 (only rendered when that video exists in the manifest). One rAF loop, lerped, seeks only on real change. */
function TurnSlider({ src, active }: { src: string; active: boolean }) {
  const video = useRef<HTMLVideoElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const handle = useRef<HTMLSpanElement>(null);
  const [shown, setShown] = useState(false);
  const s = useRef({ target: 0, cur: 0, last: -1, raf: 0, dragging: false });
  const loop = useCallback(() => {
    const v = video.current, st = s.current; st.raf = 0;
    st.cur += (st.target - st.cur) * 0.18;
    if (handle.current) handle.current.style.transform = `translate3d(${(st.cur * (track.current?.clientWidth ?? 0)).toFixed(1)}px, -50%, 0)`;
    if (v && v.duration) { const t = st.cur * v.duration; if (Math.abs(t - st.last) > 0.015) { v.currentTime = t; st.last = t; } }
    if (Math.abs(st.target - st.cur) > 0.0008) st.raf = requestAnimationFrame(loop);
  }, []);
  const set = (clientX: number) => { const r = track.current!.getBoundingClientRect(); s.current.target = Math.min(1, Math.max(0, (clientX - r.left) / r.width)); setShown(true); if (!s.current.raf) s.current.raf = requestAnimationFrame(loop); };
  useEffect(() => () => cancelAnimationFrame(s.current.raf), []);
  return (
    <>
      <video ref={video} src={src} muted playsInline preload="auto" aria-hidden="true" tabIndex={-1} className={`absolute inset-0 w-full h-full object-contain object-bottom pointer-events-none transition-opacity duration-150 ${shown && active ? "opacity-100" : "opacity-0"}`} />
      <div className="absolute left-1/2 -translate-x-1/2 bottom-3 md:bottom-5 w-[min(64%,300px)] z-10">
        <p className="text-center text-[10px] uppercase tracking-[0.28em] text-stone mb-3">Drag to turn</p>
        <div ref={track} className="relative h-6 cursor-grab active:cursor-grabbing touch-none" role="slider" aria-label="Turn the model" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(s.current.target * 100)} tabIndex={0}
          onPointerDown={(e) => { s.current.dragging = true; (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId); set(e.clientX); }}
          onPointerMove={(e) => { if (s.current.dragging) set(e.clientX); }} onPointerUp={() => { s.current.dragging = false; }}
          onKeyDown={(e) => { if (e.key === "ArrowRight" || e.key === "ArrowLeft") { const r = track.current!.getBoundingClientRect(); set(r.left + r.width * (s.current.target + (e.key === "ArrowRight" ? 0.06 : -0.06))); } }}>
          <span className="absolute left-0 right-0 top-1/2 h-px bg-ink/25" />
          <span ref={handle} className="absolute left-0 top-1/2 -ml-[9px] w-[18px] h-[18px] rounded-full bg-snow border border-ink shadow-[0_2px_8px_rgba(38,34,33,0.18)]" />
        </div>
      </div>
    </>
  );
}

function ReviewsDrawer({ p, open, onClose }: { p: Product; open: boolean; onClose: () => void }) {
  const own = reviews.filter((r) => r.product === p.name);
  const list = own.length ? own : reviews.slice(0, 4);
  return (
    <Overlay open={open} onClose={onClose} side="right" label={`Reviews of ${p.name}`} z={85}>
      <div className="flex items-center justify-between px-6 h-16 border-b hair shrink-0">
        <h2 className="text-[22px] tracking-[0.1em] uppercase" style={{ fontWeight: 300 }}>What others say?</h2>
        <button className="w-11 h-11 -mr-3 flex items-center justify-center" onClick={onClose} aria-label="Close reviews"><Icon name="close" /></button>
      </div>
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6 overscroll-contain" data-lenis-prevent>
        <p className="flex items-center gap-3 text-[13px] text-stone"><Stars value={p.rating} size={14} />{p.rating} · {p.reviewCount} reviews <span className="text-[10px] uppercase tracking-[0.18em] border hair px-2 py-0.5">Sample data</span></p>
        {list.map((r) => (
          <figure key={r.id} className="border-t hair pt-5">
            <Stars value={r.rating} />
            <blockquote className="mt-3 text-[15px] leading-relaxed">“{r.text}”</blockquote>
            <figcaption className="mt-3 text-[12px] text-stone">{r.name} · {r.product} · Verified buyer</figcaption>
          </figure>
        ))}
        {!own.length && <p className="text-[12px] text-stone">Sample reviews of other pieces are shown until this product has its own.</p>}
      </div>
    </Overlay>
  );
}

export default function ProductPage() {
  const { slug } = useParams();
  const p = getProduct(slug ?? "");
  if (!p) return <NotFound />;
  return <ProductView key={p.slug} p={p} />;
}

function ProductView({ p }: { p: Product }) {
  const [q, setQ] = useSearchParams();
  const viewed = useStore((s) => s.viewed);
  const picked = useStore((s) => s.picked[p.slug]); const pick = useStore((s) => s.pickColor);
  const colorParam = q.get("color");
  const color = colorOf(p, p.colors.find((c) => c.slug === colorParam)?.id ?? picked);
  const [size, setSize] = useState(""); const [qty, setQty] = useState(1);
  const [err, setErr] = useState(false); const [added, setAdded] = useState(false);
  const [guide, setGuide] = useState(false); const [rv, setRv] = useState(false);
  const add = useStore((s) => s.addToCart); const wished = useStore((s) => s.wishlist.includes(p.slug)); const toggle = useStore((s) => s.toggleWish);
  const items = useCatalog((s) => s.items);
  const chart = SIZE_CHARTS[p.category];
  const price = effectivePrice(p);
  const key = photoKey(p.slug, color.slug); const it = items[key];
  const related = useMemo(() => [...products.filter((x) => x.slug !== p.slug && x.category === p.category), ...products.filter((x) => x.category !== p.category)].slice(0, 4), [p]);
  const tilt = useTilt(3.5);
  const box = useRef<HTMLDivElement>(null); const first = useRef(true);
  const sizeRef = useRef<HTMLFieldSetElement>(null);

  useSeo(`${p.name} — ${p.type} | NORDVALE`, `${p.tagline} ${p.fabric.type}, ${p.fabric.gsm} GSM. Made in ${p.madeIn}.`, { "@context": "https://schema.org", "@type": "Product", name: p.name, description: p.story, offers: { "@type": "Offer", price: price, priceCurrency: BRAND.currencyCode } });
  useEffect(() => { viewed(p.slug); }, [p.slug, viewed]);
  useEffect(() => { if (colorParam !== color.slug) { const n = new URLSearchParams(q); n.set("color", color.slug); setQ(n, { replace: true }); } if (picked !== color.id) pick(p.slug, color.id); }, [color.slug]); // eslint-disable-line react-hooks/exhaustive-deps

  // shared-element hand-off from the showcase, then preload every colour (card + sharp) so swatches are instant
  useLayoutEffect(() => { playFlip(box.current); window.scrollTo(0, 0); }, []);
  useEffect(() => {
    p.colors.forEach((c) => { const k = photoKey(p.slug, c.slug), i = items[k]; if (i) { loadImage(cardUrl(k, i), "high").catch(() => {}); loadImage(detailUrl(k, i), "low").catch(() => {}); } });
  }, [p, items]);

  // tiny scale-pop on colour change (WAAPI, transform only)
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    if (!reducedMotion()) box.current?.animate([{ transform: "scale(0.975)" }, { transform: "scale(1)" }], { duration: 320, easing: "cubic-bezier(.22,1,.36,1)" });
  }, [color.slug]);

  const choose = (slugc: string) => { const n = new URLSearchParams(q); n.set("color", slugc); setQ(n, { replace: true }); pick(p.slug, p.colors.find((c) => c.slug === slugc)!.id); };
  const swipe = useRef<number | null>(null);
  const idxC = p.colors.findIndex((c) => c.id === color.id);

  const doAdd = () => {
    if (!size) { setErr(true); sizeRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }); return; }
    add({ slug: p.slug, colorId: color.id, size, qty });
    setAdded(true); setTimeout(() => setAdded(false), 1800);
  };
  const video = it?.video ? videoUrl(key, it) : null;

  return (
    <main className="relative pt-[68px] md:pt-20 pb-24 md:pb-0">
      <div className="grid lg:grid-cols-[1.08fr_1fr] min-h-[calc(100svh-80px)]">
        {/* ── stage: the model stands on the page tone ── */}
        <div className="relative lg:sticky lg:top-20 h-[55svh] min-h-[380px] lg:h-[calc(100svh-80px)] overflow-hidden"
          onPointerDown={(e) => { if (e.pointerType === "touch") swipe.current = e.clientX; }}
          onPointerUp={(e) => { if (swipe.current !== null) { const d = e.clientX - swipe.current; swipe.current = null; if (Math.abs(d) > 50) choose(p.colors[(idxC + (d < 0 ? 1 : -1) + p.colors.length) % p.colors.length].slug); } }}
          style={{ touchAction: "pan-y" }}>
          <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(700px 520px at 12% 4%, rgba(255,253,248,0.95), transparent 62%), radial-gradient(ellipse at 50% 60%, transparent 55%, rgba(110,92,70,0.13) 100%)" }} />
          <p className="absolute left-5 md:left-10 top-5 text-[10px] uppercase tracking-[0.28em] text-stone">{color.name}</p>
          <div className="absolute inset-x-0 top-6 bottom-[4%] md:bottom-[6%] flex items-end justify-center" style={{ ["--sh" as string]: "100%" }}>
            <div className="relative h-full max-h-[920px] aspect-[9/16]" onPointerMove={tilt.onPointerMove} onPointerLeave={tilt.onPointerLeave}>
              <span className="absolute left-[4%] right-[4%] -bottom-[1.2%] h-[4.5%] pointer-events-none" style={{ background: "radial-gradient(ellipse at center, rgba(38,34,33,0.4) 0%, rgba(38,34,33,0.14) 46%, transparent 72%)" }} />
              <div ref={tilt.ref} className="tilt absolute inset-0 group">
                <div ref={box} className="absolute inset-0 transition-transform duration-[5000ms] ease-out hover:scale-[1.035] origin-bottom">
                  {it ? <SwapImage product={p} colorId={color.id} upgrade priority className="absolute inset-0" /> : <Silhouette category={p.category} tint={color.hex} className="absolute inset-0 w-full h-full" />}
                  {video && <TurnSlider src={video} active />}
                </div>
              </div>
            </div>
          </div>
          {/* related mini strip */}
          <ul className="absolute right-4 md:right-8 bottom-4 md:bottom-8 hidden sm:flex gap-2" aria-label="Related pieces">
            {related.map((r) => { const c = colorOf(r, useStore.getState().picked[r.slug]); const k = photoKey(r.slug, c.slug); const i = items[k]; return (
              <li key={r.slug}><Link to={`/product/${r.slug}?color=${c.slug}`} aria-label={r.name} className="block w-11 h-[60px] md:w-12 md:h-16 border hair overflow-hidden hover:-translate-y-1 hover:border-ink/60 transition-[transform,border-color] duration-300 bg-snow/50">
                {i ? <img src={cardUrl(k, i)} alt="" loading="lazy" draggable={false} className="w-full h-full object-cover object-top" /> : <Silhouette category={r.category} className="w-full h-full" />}
              </Link></li>); })}
          </ul>
        </div>

        {/* ── panel ── */}
        <div className="px-5 md:px-10 lg:pl-8 lg:pr-14 py-8 md:py-12 max-w-[640px] w-full">
          <Link to="/#collection" className="text-[10px] uppercase tracking-[0.24em] text-stone nav-u">← {p.category === "tshirts" ? "T-Shirts" : p.category[0].toUpperCase() + p.category.slice(1)}</Link>
          <h1 className="mt-5 text-[clamp(28px,3.4vw,44px)] uppercase tracking-[0.16em] leading-[1.05]" style={{ fontWeight: 200 }}>{p.name}</h1>
          <p className="mt-2 text-[14px] text-stone">{p.tagline}</p>
          <div className="mt-5 flex items-center gap-4 flex-wrap">
            <span className="flex items-center gap-2 text-[12px] text-stone"><Stars value={p.rating} size={13} />{p.rating} ({p.reviewCount})</span>
            <button className="rounded-full border hair px-4 min-h-[36px] text-[11px] uppercase tracking-[0.16em] hover:bg-ink hover:text-snow hover:border-ink transition-colors duration-300" onClick={() => setRv(true)}>What others say?</button>
          </div>
          <p className="mt-6 flex items-baseline gap-3"><span className="text-[24px] tabular-nums text-wine" style={{ fontWeight: 300 }}>{money(price)}</span>{p.salePrice && <s className="text-stone text-[14px]">{money(p.price)}</s>}</p>
          <p className={`mt-1 text-[12px] ${p.stock === "low" ? "text-wine" : "text-stone"}`}>{p.stock === "out" ? "Out of stock" : p.stock === "low" ? "Low stock · only a few left" : "In stock · ships in 24h"}</p>
          <div className="h-px bg-ink/15 my-7" />

          <fieldset>
            <legend className="text-[10px] uppercase tracking-[0.24em] text-stone mb-3">Color · <span className="text-ink normal-case tracking-normal text-[13px]">{color.name}</span></legend>
            <div className="flex gap-2 -ml-1.5 flex-wrap">
              {p.colors.map((c) => (
                <button key={c.id} onClick={() => choose(c.slug)} aria-label={c.name} aria-pressed={c.id === color.id} className="group w-11 h-11 flex items-center justify-center">
                  <span className="relative block w-8 h-8 rounded-full">
                    <span className="absolute inset-0 rounded-full border border-ink/15" style={{ background: swatchBg(c) }} />
                    <span className={`absolute -inset-[5px] rounded-full border border-ink transition-[opacity,transform] duration-300 ${c.id === color.id ? "opacity-100 scale-100" : "opacity-0 scale-75"}`} style={{ transitionTimingFunction: "cubic-bezier(.22,1,.36,1)" }} />
                  </span>
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset ref={sizeRef} className="mt-6">
            <legend className="text-[10px] uppercase tracking-[0.24em] text-stone mb-3 flex justify-between w-full">Size <button type="button" className="underline normal-case tracking-normal text-[12px] min-h-[24px]" onClick={() => setGuide(!guide)}>Size guide</button></legend>
            <div className="grid grid-cols-6 gap-2" role="radiogroup" aria-label="Size">
              {p.sizes.map((s) => (
                <button key={s} role="radio" aria-checked={size === s} onClick={() => { setSize(s); setErr(false); }} className={`min-h-[46px] text-[13px] border rounded-full transition-[background-color,color,border-color,transform] duration-300 active:scale-95 ${size === s ? "bg-ink text-snow border-ink" : "hair hover:border-ink"}`}>{s}</button>
              ))}
            </div>
            {err && <p role="alert" className="text-[12px] text-wine mt-2">Please select a size.</p>}
            <AnimatePresence>
              {guide && (
                <m.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                  <table className="w-full mt-4 text-[12px] text-center"><caption className="sr-only">{chart.title} size chart in centimetres</caption>
                    <thead className="text-stone"><tr>{chart.head.map((h) => <th key={h} scope="col" className="py-2 font-light">{h}</th>)}</tr></thead>
                    <tbody>{chart.rows.map((r) => <tr key={r[0]} className={`border-t hair ${r[0] === size ? "bg-mist" : ""}`}>{r.map((cell, i) => <td key={i} className="py-2">{cell}</td>)}</tr>)}</tbody>
                  </table>
                  <p className="text-[11px] text-stone mt-2">Measurements in cm{p.category === "trousers" ? " (waist size in inches)" : ""}. {chart.note}</p>
                </m.div>
              )}
            </AnimatePresence>
          </fieldset>

          <div className="mt-7 flex gap-3 items-center">
            <div className="flex items-center border hair rounded-full">
              <button className="w-11 h-12 flex items-center justify-center" onClick={() => setQty(Math.max(1, qty - 1))} aria-label="Decrease quantity"><Icon name="minus" size={14} /></button>
              <span className="w-6 text-center text-[14px] tabular-nums" aria-live="polite">{qty}</span>
              <button className="w-11 h-12 flex items-center justify-center" onClick={() => setQty(Math.min(10, qty + 1))} aria-label="Increase quantity"><Icon name="plus" size={14} /></button>
            </div>
            <button className="btn btn-solid flex-1 !min-h-[52px]" onClick={doAdd} disabled={p.stock === "out"}>
              <span key={String(added)} className="inline-block animate-[fadein_.35s_ease]">{added ? "Added ✓" : "Add to cart"}</span>
            </button>
            <button className="w-12 h-12 rounded-full border hair flex items-center justify-center hover:border-ink hover:scale-105 active:scale-95 transition-[transform,border-color] duration-300" onClick={() => toggle(p.slug)} aria-pressed={wished} aria-label={wished ? "Remove from wishlist" : "Add to wishlist"}><Icon name="heart" className={wished ? "fill-wine text-wine" : ""} /></button>
          </div>
          <ul className="mt-5 grid grid-cols-2 gap-3 text-[12px] text-stone">
            <li className="flex gap-2 items-center"><Icon name="truck" size={16} />Free shipping over {money(BRAND.freeShippingThreshold)}</li>
            <li className="flex gap-2 items-center"><Icon name="return" size={16} />30-day free returns</li>
          </ul>

          <div className="mt-9">
            <Acc title="Fabric & composition" open><p>{p.fabric.type}. {p.fabric.composition}{p.fabric.gsm ? `, ${p.fabric.gsm} GSM` : ""}.</p></Acc>
            <Acc title="Fit"><p>{p.fit}. {SIZE_CHARTS[p.category].note}</p></Acc>
            <Acc title="Design details"><ul className="list-disc pl-4 space-y-1">{p.details.map((d) => <li key={d}>{d}</li>)}</ul><p className="mt-3">{p.story}</p></Acc>
            <Acc title="Care"><ul className="list-disc pl-4 space-y-1">{p.care.map((c) => <li key={c}>{c}</li>)}</ul></Acc>
            <Acc title={`Made in ${p.madeIn}`}><p>{p.manufacturing}</p></Acc>
            <Acc title="Shipping & returns"><p>Free shipping over {money(BRAND.freeShippingThreshold)}, otherwise {money(BRAND.shippingFlat)}. Domestic delivery 2–4 days, international 5–10 days. Returns are free within 30 days on unworn items with tags.</p></Acc>
            <div className="border-t hair" />
          </div>
        </div>
      </div>

      {/* related */}
      <section className="px-5 md:px-10 py-16 md:py-24 border-t hair max-w-[1560px] mx-auto">
        <h2 className="text-[clamp(24px,3vw,36px)] uppercase tracking-[0.16em] mb-8" style={{ fontWeight: 200 }}>You may also like</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
          {related.map((r) => { const c = colorOf(r, useStore.getState().picked[r.slug]); const k = photoKey(r.slug, c.slug); const i = items[k]; return (
            <Link key={r.slug} to={`/product/${r.slug}?color=${c.slug}`} className="group block">
              <div className="relative aspect-[3/4] border hair overflow-hidden">
                <div className="absolute inset-0 transition-transform duration-[900ms] ease-[cubic-bezier(.22,1,.36,1)] group-hover:scale-[1.045]">{i ? <img src={cardUrl(k, i)} alt={r.name} loading="lazy" draggable={false} className="absolute inset-0 w-full h-full object-contain object-bottom" /> : <Silhouette category={r.category} tint={c.hex} className="absolute inset-0 w-full h-full" />}</div>
              </div>
              <p className="mt-3 text-[13px] uppercase tracking-[0.2em] flex justify-between gap-2"><span>{r.name}</span><span className="text-wine tabular-nums">{money(effectivePrice(r))}</span></p>
            </Link>); })}
        </div>
      </section>

      {/* mobile sticky bar */}
      <div className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-snow/95 border-t hair px-5 pt-3 pb-[max(12px,env(safe-area-inset-bottom))] flex items-center gap-4">
        <div className="leading-tight"><p className="text-[11px] uppercase tracking-[0.18em] truncate max-w-[34vw]">{p.name}</p><p className="text-[16px] text-wine tabular-nums">{money(price)}</p></div>
        <button className="btn btn-solid flex-1 !min-h-[48px]" onClick={doAdd} disabled={p.stock === "out"}>{added ? "Added ✓" : size ? "Add to cart" : "Select size"}</button>
      </div>
      <ReviewsDrawer p={p} open={rv} onClose={() => setRv(false)} />
    </main>
  );
}
