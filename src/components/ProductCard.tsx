import { forwardRef, memo, useEffect, useRef, useState } from "react";
import { AnimatePresence, m } from "framer-motion";
import { money } from "../config/assets";
import { colorOf, Product } from "../data/products";
import { useStore } from "../store/useStore";
import { Icon, Stars } from "./Icons";
import { ProductVideo, SwapImage } from "./ProductImage";

export const swatchBg = (c: { hex: string; hex2?: string }) => (c.hex2 ? `linear-gradient(135deg, ${c.hex} 50%, ${c.hex2} 50%)` : c.hex);

interface Props { p: Product; index?: number; featured?: boolean; priority?: boolean; animateLayout?: boolean }

const ProductCard = forwardRef<HTMLElement, Props>(function ProductCard({ p, index = 0, featured = false, priority = false, animateLayout = false }, ref) {
  const set = useStore((s) => s.set); const add = useStore((s) => s.addToCart);
  const wished = useStore((s) => s.wishlist.includes(p.slug)); const toggle = useStore((s) => s.toggleWish);
  const picked = useStore((s) => s.picked[p.slug]); const pick = useStore((s) => s.pickColor);
  const color = colorOf(p, picked);
  const off = p.salePrice ? Math.round((1 - p.salePrice / p.price) * 100) : 0;

  // optional video: desktop hover, or (touch) when the card is mostly in view; the slot limiter keeps max 2 playing
  const box = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState(false);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    if (!box.current || window.matchMedia("(hover: hover)").matches) return;
    const io = new IntersectionObserver(([e]) => setInView(e.intersectionRatio >= 0.6), { threshold: [0, 0.6, 1] });
    io.observe(box.current);
    return () => io.disconnect();
  }, []);

  // quick add: pick a size right on the card
  const [qa, setQa] = useState(false);
  const [done, setDone] = useState(false);
  const quickAdd = (size: string) => { add({ slug: p.slug, colorId: color.id, size, qty: 1 }); setDone(true); setTimeout(() => { setDone(false); setQa(false); }, 1100); };

  return (
    <m.article
      ref={ref} layout={animateLayout ? "position" : false} // layout projection (measures every card) is switched on only once the visitor reaches for the filters
      initial={{ opacity: 0, y: 32 }} whileInView={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97, transition: { duration: 0.18 } }} viewport={{ once: true, margin: "-4% 0px" }}
      transition={{ duration: 0.8, delay: (index % 4) * 0.07, ease: [0.22, 1, 0.36, 1], layout: { duration: 0.55, ease: [0.22, 1, 0.36, 1] } }}
      className={`group flex flex-col ${featured ? "col-span-2 lg:row-span-2" : ""}`}
      onMouseLeave={() => setQa(false)}
    >
      <div className={`relative ${featured ? "lg:flex-1 lg:min-h-0" : ""}`}>
        <button className="block w-full h-full text-left" onClick={() => set({ openProduct: p.slug })} aria-label={`View ${p.name}`} data-cursor>
          <div
            ref={box}
            onPointerEnter={(e) => { if (e.pointerType === "mouse") setHover(true); }} onPointerLeave={() => setHover(false)}
            className={`relative transition-transform duration-500 ease-out md:group-hover:-translate-y-1.5 ${featured ? "aspect-[4/5] lg:aspect-auto lg:h-full lg:min-h-[640px]" : "aspect-[3/4]"}`}
          >
            <span className="absolute inset-0 opacity-0 md:group-hover:opacity-100 transition-opacity duration-500 shadow-[0_22px_44px_-22px_rgba(28,28,30,0.3)] pointer-events-none" aria-hidden="true" />
            <div className="absolute inset-0 overflow-hidden">
            <div className="absolute inset-0 transition-transform duration-[1200ms] ease-out md:group-hover:scale-[1.045]">
              <SwapImage product={p} colorId={color.id} priority={priority} upgrade={featured} className="absolute inset-0" />
            </div>
            <ProductVideo product={p} colorId={color.id} want={hover || inView} slot="card" />
            </div>
          </div>
        </button>

        {/* thin index + tags */}
        <div className="absolute top-3 left-3 md:top-4 md:left-4 flex items-center gap-2 pointer-events-none">
          <span className="text-[10px] tracking-[0.2em] tabular-nums text-ink/60">{String(index + 1).padStart(2, "0")}</span>
          {p.bestSeller && <span className="whitespace-nowrap text-[9px] uppercase tracking-[0.18em] border border-ink/25 bg-snow/90 px-2 py-0.5">Best seller</span>}
          {p.isNew && <span className="whitespace-nowrap text-[9px] uppercase tracking-[0.18em] bg-ink text-snow px-2 py-0.5">New</span>}
          {off > 0 && <span className="max-md:hidden text-[9px] uppercase tracking-[0.18em] bg-snow/90 px-2 py-0.5">−{off}%</span>}
        </div>
        <button className="absolute top-0 right-0 w-11 h-11 flex items-center justify-center" onClick={() => toggle(p.slug)} aria-pressed={wished} aria-label={wished ? `Remove ${p.name} from wishlist` : `Add ${p.name} to wishlist`}>
          <Icon name="heart" size={19} className={`transition-all ${wished ? "fill-ink" : ""}`} />
        </button>

        {/* quick add */}
        <div className="absolute inset-x-0 bottom-0 p-3 md:p-4 pointer-events-none md:opacity-0 md:group-hover:opacity-100 md:focus-within:opacity-100 transition-opacity duration-300">
          <AnimatePresence mode="wait" initial={false}>
            {qa ? (
              <m.div key="sizes" initial={{ y: 16, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 16, opacity: 0 }} transition={{ duration: 0.22 }} className="pointer-events-auto bg-snow border hair p-2" role="group" aria-label="Choose a size">
                {done ? <p className="text-center text-[11px] uppercase tracking-[0.18em] py-3">Added to bag ✓</p> : (
                  <div className="flex flex-wrap gap-1">
                    {p.sizes.map((s) => <button key={s} onClick={() => quickAdd(s)} className="flex-1 min-w-[38px] min-h-[40px] text-[12px] border hair hover:bg-ink hover:text-snow hover:border-ink transition-colors">{s}</button>)}
                  </div>
                )}
              </m.div>
            ) : (
              <m.button key="btn" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setQa(true)} aria-label={`Quick add ${p.name}`}
                className="pointer-events-auto ml-auto flex items-center gap-2 h-11 px-4 bg-snow border hair hover:border-ink text-[10px] uppercase tracking-[0.2em] transition-colors">
                <Icon name="plus" size={14} /><span className="max-md:hidden">Quick add</span>
              </m.button>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="mt-4 flex justify-between gap-4 items-start">
        <div>
          <h3 className={`font-display leading-tight ${featured ? "text-[28px] md:text-[34px]" : "text-[21px] md:text-[22px]"}`}>{p.name}</h3>
          <p className="text-[12px] text-stone mt-1">{color.name}</p>
        </div>
        <div className="text-right text-[13px] tabular-nums shrink-0">
          {p.salePrice ? <><span className="block">{money(p.salePrice)}</span><s className="text-stone text-[12px]">{money(p.price)}</s></> : money(p.price)}
        </div>
      </div>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-x-2">
        <div className="flex flex-wrap -ml-2" role="radiogroup" aria-label={`${p.name} colour`}>
          {p.colors.map((c) => (
            <button key={c.id} role="radio" aria-checked={c.id === color.id} aria-label={c.name} onClick={() => pick(p.slug, c.id)} className="w-8 h-8 flex items-center justify-center">
              <span className={`block w-3.5 h-3.5 rounded-full border border-ink/20 transition-transform ${c.id === color.id ? "ring-1 ring-offset-2 ring-offset-snow ring-ink scale-110" : "hover:scale-110"}`} style={{ background: swatchBg(c) }} />
            </button>
          ))}
        </div>
        <span className="flex items-center gap-1.5 text-[11px] text-stone"><Stars value={p.rating} size={10} />{p.rating}</span>
      </div>
    </m.article>
  );
});

// memo: the grid never re-renders cards because of scroll or unrelated state
export default memo(ProductCard);
