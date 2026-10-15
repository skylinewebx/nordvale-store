import { useEffect, useMemo, useRef } from "react";
import { Link } from "react-router-dom";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import ProductCard from "../components/ProductCard";
import { Icon } from "../components/Icons";
import { Category, getCategory, photoKey, stylesOf } from "../data/products";
import { cardUrl, useCatalog } from "../lib/catalog";
import { reducedMotion } from "../lib/env";
import { loadImage } from "../lib/imageCache";

// each category enters differently (title tracks in; products rise / slide from the sides / scale up, staggered)
const ENTER: Record<Category, "up" | "left" | "right" | "zoom"> = { hoodies: "up", jackets: "left", trousers: "right", tshirts: "zoom" };

/** preload the card images of a category (all 4 colours of the 4 styles would be too much: default colour + the next 2) */
export function preloadCategory(cat: Category, items: Record<string, { v: string; cw: number; ch: number; w: number; h: number; lqip: string }>) {
  stylesOf(cat).forEach((p) => p.colors.slice(0, 2).forEach((c) => { const k = photoKey(p.slug, c.slug), it = items[k]; if (it) loadImage(cardUrl(k, it as never), "low").catch(() => {}); }));
}

export default function CategorySection({ cat, next }: { cat: Category; next?: Category }) {
  const info = getCategory(cat);
  const styles = useMemo(() => stylesOf(cat), [cat]);
  const root = useRef<HTMLElement>(null);
  const items = useCatalog((s) => s.items);

  useEffect(() => {
    const el = root.current; if (!el) return;
    const cards = [...el.querySelectorAll<HTMLElement>(".pcard[data-rv]")];
    if (reducedMotion()) { el.classList.add("in"); cards.forEach((c) => c.classList.add("in")); return; }
    const title = ScrollTrigger.create({ trigger: el, start: "top 72%", once: true, onEnter: () => el.classList.add("in") });
    const batch = ScrollTrigger.batch(cards, { start: "top 94%", once: true, onEnter: (els) => els.forEach((c, i) => setTimeout(() => c.classList.add("in"), 140 + i * 110)) });
    // preload this section's images when it is near, and the NEXT section's images when this one is on screen
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { preloadCategory(cat, items); if (next) setTimeout(() => preloadCategory(next, items), 400); io.disconnect(); } }, { rootMargin: "140% 0px" });
    io.observe(el);
    const safety = setTimeout(() => { if (el.getBoundingClientRect().top < window.innerHeight * 0.7) { el.classList.add("in"); cards.forEach((c) => c.classList.add("in")); } }, 2200);
    return () => { title.kill(); batch.forEach((t) => t.kill()); io.disconnect(); clearTimeout(safety); };
  }, [cat, next]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <section ref={root} id={`cat-${cat}`} className="cat-sec sec relative wrap" data-enter={ENTER[cat]} aria-labelledby={`cat-h-${cat}`}>
      <div className="grid md:grid-cols-[1fr_auto] gap-6 md:gap-12 items-end mb-12 md:mb-20">
        <div>
          <p className="eyebrow">0{["hoodies", "jackets", "trousers", "tshirts"].indexOf(cat) + 1} · {info.label}</p>
          <h2 id={`cat-h-${cat}`} className="cat-title mt-4 text-[clamp(44px,10.5vw,150px)] leading-[0.92]" style={{ fontWeight: 200 }}><span className="inline-block">{info.title}</span></h2>
        </div>
        <div className="md:max-w-[340px] md:pb-3">
          <p className="cat-desc text-[14px] leading-relaxed text-ink/70">{info.description}</p>
          <Link to={`/category/${info.slug}`} className="cat-link mt-6 inline-flex items-center gap-3 text-[11px] uppercase tracking-[0.24em] min-h-[44px] group">
            <span className="nav-u py-1">Explore {info.label}</span><span className="w-9 h-9 rounded-full border border-ink/30 flex items-center justify-center group-hover:bg-ink group-hover:text-snow group-hover:border-ink group-hover:translate-x-1 transition-[background-color,color,border-color,transform] duration-500"><Icon name="arrow" size={14} /></span>
          </Link>
        </div>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-4 md:gap-x-8 lg:gap-x-10 gap-y-12">
        {styles.map((p, i) => <ProductCard key={p.slug} p={p} index={i} priority={cat === "hoodies" && i < 2} />)}
      </div>
    </section>
  );
}
