import { forwardRef, memo, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { m } from "framer-motion";
import { money } from "../config/assets";
import { colorOf, effectivePrice, Product } from "../data/products";
import { useStore } from "../store/useStore";
import { Icon } from "./Icons";
import { SwapImage } from "./ProductImage";
import { HangShadow, Hung, isHanging, Sway } from "./Hanger";
import { photoKey } from "../data/products";
import { useCatalog } from "../lib/catalog";

// one shared observer: only cards on screen sway (the CSS animation is paused otherwise)
let io: IntersectionObserver | null = null;
const watch = (el: Element) => { io ??= new IntersectionObserver((es) => es.forEach((e) => (e.target as HTMLElement).toggleAttribute("data-in", e.isIntersecting)), { rootMargin: "60px" }); io.observe(el); return () => io?.unobserve(el); };

export const swatchBg = (c: { hex: string; hex2?: string }) => (c.hex2 ? `linear-gradient(135deg, ${c.hex} 50%, ${c.hex2} 50%)` : c.hex);

interface Props { p: Product; index?: number; priority?: boolean; animateLayout?: boolean }

/** Collection card: transparent cut-out on the page tone, hairline frame, thin index, name, price, 4 colour dots (hover / tap swaps the image). */
const ProductCard = forwardRef<HTMLDivElement, Props>(function ProductCard({ p, index = 0, priority = false, animateLayout = false }, ref) {
  const wished = useStore((s) => s.wishlist.includes(p.slug)); const toggle = useStore((s) => s.toggleWish);
  const picked = useStore((s) => s.picked[p.slug]); const pick = useStore((s) => s.pickColor);
  const color = colorOf(p, picked);
  const [hover, setHover] = useState(false);
  const hang = isHanging(p.category);
  const gb = useCatalog((st) => st.items[photoKey(p.slug, color.slug)]?.gb);
  const art = useRef<HTMLElement>(null);
  useEffect(() => (art.current ? watch(art.current) : undefined), []);
  const col = index % 4; // column variety: 0 & 2 rise from below, 1 slides from the left, 3 from the right
  return (
    <m.div ref={ref} layout={animateLayout ? "position" : false} exit={{ opacity: 0, transition: { duration: 0.15 } }} transition={{ layout: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } }} className="pcard-wrap">
      <article ref={art} className="pcard group" data-rv={col === 1 ? "left" : col === 3 ? "right" : "up"} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}>
        <div className="flex items-center justify-between h-8 text-[12.5px] tracking-[0.22em] tabular-nums text-stone">
          <span>{String(index + 1).padStart(2, "0")}</span>
          <button className="w-8 h-8 -mr-2 flex items-center justify-center text-ink/90 hover:text-wine transition-colors" onClick={() => toggle(p.slug)} aria-pressed={wished} aria-label={wished ? `Remove ${p.name} from wishlist` : `Add ${p.name} to wishlist`}>
            <Icon name="heart" size={16} className={wished ? "fill-wine text-wine" : ""} />
          </button>
        </div>
        <Link to={`/product/${p.slug}?color=${color.slug}`} className="block relative aspect-[3/4] border hair overflow-hidden" aria-label={`${p.name}, ${money(effectivePrice(p))}`}>
          {hang ? (
            <div className="absolute inset-x-0 top-[3%] aspect-[9/10] transition-transform duration-[900ms] ease-[cubic-bezier(.22,1,.36,1)] group-hover:scale-[1.03]">
              <Sway delay={(index % 5) * 1.3}><Hung><SwapImage product={p} colorId={color.id} priority={priority} className="absolute inset-0" /></Hung></Sway>
              <HangShadow gb={gb} className="left-[12%] right-[12%]" />
            </div>
          ) : (<>
            <span className="absolute left-[18%] right-[18%] bottom-[1.2%] h-[4.5%] pointer-events-none transition-opacity duration-500" style={{ opacity: hover ? 1 : 0.8, background: "radial-gradient(ellipse at center, rgba(38,34,33,0.34), transparent 70%)" }} />
            <div className="absolute inset-0 transition-transform duration-[900ms] ease-[cubic-bezier(.22,1,.36,1)] group-hover:scale-[1.045] group-hover:-translate-y-1">
              <SwapImage product={p} colorId={color.id} priority={priority} className="absolute inset-0" />
            </div>
          </>)}
          {p.salePrice && <span className="absolute left-3 top-3 text-[12.5px] tracking-[0.18em] uppercase text-wine">−{Math.round((1 - p.salePrice / p.price) * 100)}%</span>}
        </Link>
        <div className="mt-4 flex items-baseline justify-between gap-3">
          <h3 className="text-[15px] md:text-[15px] uppercase tracking-[0.2em]" style={{ fontWeight: 450 }}>{p.name}</h3>
          <p className="text-[15px] tabular-nums shrink-0"><span className="text-wine">{money(effectivePrice(p))}</span>{p.salePrice && <s className="ml-2 text-stone text-[12.5px]">{money(p.price)}</s>}</p>
        </div>
        <div className="mt-2.5 flex items-center gap-1 -ml-1.5" role="group" aria-label={`${p.name} colours`}>
          {p.colors.map((c) => (
            <button key={c.id} onMouseEnter={() => pick(p.slug, c.id)} onFocus={() => pick(p.slug, c.id)} onClick={() => pick(p.slug, c.id)} aria-label={c.name} aria-pressed={c.id === color.id} className="w-7 h-7 flex items-center justify-center">
              <span className={`block w-3 h-3 rounded-full border border-ink/20 transition-transform duration-300 ${c.id === color.id ? "scale-125 ring-1 ring-ink/70 ring-offset-2 ring-offset-snow" : "hover:scale-125"}`} style={{ background: swatchBg(c) }} />
            </button>
          ))}
          <span className="ml-1.5 text-[12.5px] text-stone truncate">{color.name}</span>
        </div>
      </article>
    </m.div>
  );
});
export default memo(ProductCard);
