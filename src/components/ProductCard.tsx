import { forwardRef, memo, useEffect, useRef, useState } from "react";
import { AnimatePresence, m } from "framer-motion";
import { money } from "../config/assets";
import { colorOf, Product } from "../data/products";
import { useTilt } from "../lib/tilt";
import { useStore } from "../store/useStore";
import { Icon, Stars } from "./Icons";
import { ProductVideo, SwapImage } from "./ProductImage";

export const swatchBg = (c: { hex: string; hex2?: string }) => (c.hex2 ? `linear-gradient(135deg, ${c.hex} 50%, ${c.hex2} 50%)` : c.hex);

interface Props { p: Product; index?: number; priority?: boolean; animateLayout?: boolean }

const ProductCard = forwardRef<HTMLElement, Props>(function ProductCard({ p, index = 0, priority = false, animateLayout = false }, ref) {
  const set = useStore((s) => s.set); const add = useStore((s) => s.addToCart);
  const wished = useStore((s) => s.wishlist.includes(p.slug)); const toggle = useStore((s) => s.toggleWish);
  const picked = useStore((s) => s.picked[p.slug]); const pick = useStore((s) => s.pickColor);
  const color = colorOf(p, picked);
  const off = p.salePrice ? Math.round((1 - p.salePrice / p.price) * 100) : 0;
  const tilt = useTilt(6);

  // optional video: desktop hover, or (touch) when the card is mostly in view; the slot limiter keeps max 2 playing
  const [hover, setHover] = useState(false);
  const [inView, setInView] = useState(false);
  const watch = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!watch.current || window.matchMedia("(hover: hover)").matches) return;
    const io = new IntersectionObserver(([e]) => setInView(e.intersectionRatio >= 0.6), { threshold: [0, 0.6, 1] });
    io.observe(watch.current);
    return () => io.disconnect();
  }, []);

  const [qa, setQa] = useState(false);
  const [done, setDone] = useState(false);
  const quickAdd = (size: string) => { add({ slug: p.slug, colorId: color.id, size, qty: 1 }); setDone(true); setTimeout(() => { setDone(false); setQa(false); }, 1100); };

  return (
    <m.article
      ref={ref} layout={animateLayout ? "position" : false}
      initial={{ opacity: 0, y: 36 }} whileInView={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97, transition: { duration: 0.18 } }} viewport={{ once: true, margin: "-4% 0px" }}
      transition={{ duration: 0.8, delay: (index % 4) * 0.08, ease: [0.22, 1, 0.36, 1], layout: { duration: 0.55, ease: [0.22, 1, 0.36, 1] } }}
      className="pcard group flex flex-col"
      onMouseLeave={() => setQa(false)}
    >
      <div className="relative" ref={watch}>
        <button className="block w-full text-left" onClick={() => set({ openProduct: p.slug })} aria-label={`View ${p.name}`} data-cursor>
          <div
            ref={tilt.ref} onPointerMove={tilt.onPointerMove}
            onPointerEnter={(e) => { if (e.pointerType === "mouse") setHover(true); }} onPointerLeave={(e) => { tilt.onPointerLeave(); setHover(false); void e; }}
            className="tilt spot relative aspect-[3/4] rounded-[20px] overflow-hidden bg-mist ring-1 ring-ink/10 transition-[box-shadow] duration-500 md:group-hover:ring-2 md:group-hover:ring-accent/80"
          >
            <div className="absolute inset-0 transition-transform duration-[1400ms] ease-out md:group-hover:scale-[1.07]">
              <SwapImage product={p} colorId={color.id} priority={priority} className="absolute inset-0" />
            </div>
            <ProductVideo product={p} colorId={color.id} want={hover || inView} slot="card" />
          </div>
        </button>

        {/* tags */}
        <div className="absolute top-3.5 left-3.5 flex items-center gap-1.5 pointer-events-none">
          <span className="text-[10px] tracking-[0.2em] tabular-nums text-ink/70 bg-snow/80 px-2 py-1 rounded-full">{String(index + 1).padStart(2, "0")}</span>
          {p.bestSeller && <span className="whitespace-nowrap text-[9px] uppercase tracking-[0.16em] bg-accent text-snow px-2.5 py-1 rounded-full">Best seller</span>}
          {p.isNew && <span className="whitespace-nowrap text-[9px] uppercase tracking-[0.16em] bg-ink text-snow px-2.5 py-1 rounded-full">New</span>}
          {off > 0 && <span className="max-md:hidden whitespace-nowrap text-[9px] uppercase tracking-[0.16em] bg-snow/85 px-2.5 py-1 rounded-full">−{off}%</span>}
        </div>
        <button className="absolute top-2 right-2 w-11 h-11 flex items-center justify-center rounded-full bg-snow/70 hover:bg-snow transition-colors" onClick={() => toggle(p.slug)} aria-pressed={wished} aria-label={wished ? `Remove ${p.name} from wishlist` : `Add ${p.name} to wishlist`}>
          <Icon name="heart" size={18} className={`transition-all ${wished ? "fill-accent text-accent" : ""}`} />
        </button>

        {/* quick add */}
        <div className="absolute inset-x-3 bottom-3 pointer-events-none md:translate-y-3 md:opacity-0 md:group-hover:translate-y-0 md:group-hover:opacity-100 md:focus-within:translate-y-0 md:focus-within:opacity-100 transition-[transform,opacity] duration-400 ease-out">
          <AnimatePresence mode="wait" initial={false}>
            {qa ? (
              <m.div key="sizes" initial={{ y: 12, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 12, opacity: 0 }} transition={{ duration: 0.2 }} className="pointer-events-auto bg-snow rounded-2xl p-2 border hair" role="group" aria-label="Choose a size">
                {done ? <p className="text-center text-[11px] uppercase tracking-[0.18em] py-3 text-accent">Added to bag ✓</p> : (
                  <div className="flex flex-wrap gap-1">
                    {p.sizes.map((s) => <button key={s} onClick={() => quickAdd(s)} className="flex-1 min-w-[38px] min-h-[40px] text-[12px] rounded-xl border hair hover:bg-accent hover:text-snow hover:border-accent transition-colors">{s}</button>)}
                  </div>
                )}
              </m.div>
            ) : (
              <m.button key="btn" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setQa(true)} aria-label={`Quick add ${p.name}`}
                className="pointer-events-auto w-full flex items-center justify-between h-12 px-5 rounded-full bg-snow text-ink border hair hover:bg-accent hover:text-snow hover:border-accent text-[10px] uppercase tracking-[0.2em] transition-colors">
                <span>Quick add</span><Icon name="plus" size={14} />
              </m.button>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="mt-6 flex justify-between gap-4 items-start">
        <div className="min-w-0">
          <h3 className="font-display text-[22px] md:text-[24px] leading-tight">{p.name}</h3>
          <p className="text-[12px] text-stone mt-1.5 truncate">{p.type}</p>
        </div>
        <div className="text-right text-[14px] tabular-nums shrink-0">
          {p.salePrice ? <><span className="block">{money(p.salePrice)}</span><s className="text-stone text-[12px]">{money(p.price)}</s></> : money(p.price)}
        </div>
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
        <div className="flex flex-wrap items-center gap-1 -ml-2" role="radiogroup" aria-label={`${p.name} colour`}>
          {p.colors.map((c) => (
            <button key={c.id} role="radio" aria-checked={c.id === color.id} aria-label={c.name} onClick={() => pick(p.slug, c.id)} className="w-8 h-8 flex items-center justify-center">
              <span className={`block w-4 h-4 rounded-full border border-ink/25 transition-transform duration-300 ${c.id === color.id ? "ring-1 ring-offset-2 ring-offset-snow ring-accent scale-110" : "hover:scale-125"}`} style={{ background: swatchBg(c) }} />
            </button>
          ))}
          <span className="ml-1 text-[11px] text-stone">{color.name}</span>
        </div>
        <span className="flex items-center gap-1.5 text-[11px] text-stone"><Stars value={p.rating} size={10} />{p.rating}</span>
      </div>
    </m.article>
  );
});

// memo: the grid never re-renders cards because of scroll or unrelated state
export default memo(ProductCard);
