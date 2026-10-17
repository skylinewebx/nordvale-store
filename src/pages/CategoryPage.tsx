import { useEffect, useRef } from "react";
import { Link, useParams } from "react-router-dom";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import ProductCard from "../components/ProductCard";
import { CATEGORIES, getCategory, stylesOf } from "../data/products";
import { reducedMotion } from "../lib/env";
import { useSeo } from "../lib/seo";
import { NotFound } from "./Misc";

/** /category/:slug lists every product of a category. */
export default function CategoryPage() {
  const { slug } = useParams();
  const info = CATEGORIES.find((c) => c.slug === slug || c.id === slug);
  if (!info) return <NotFound />;
  return <View id={info.id} />;
}

function View({ id }: { id: (typeof CATEGORIES)[number]["id"] }) {
  const info = getCategory(id); const list = stylesOf(id);
  const grid = useRef<HTMLDivElement>(null);
  useSeo(`${info.label} — NORDVALE`, info.description);
  useEffect(() => {
    const cards = [...(grid.current?.querySelectorAll<HTMLElement>(".pcard[data-rv]") ?? [])];
    if (reducedMotion()) { cards.forEach((c) => c.classList.add("in")); return; }
    const t = ScrollTrigger.batch(cards, { start: "top 94%", once: true, onEnter: (els) => els.forEach((c, i) => setTimeout(() => c.classList.add("in"), i * 100)) });
    const safety = setTimeout(() => cards.forEach((c) => { if (c.getBoundingClientRect().top < window.innerHeight) c.classList.add("in"); }), 1500);
    return () => { t.forEach((x) => x.kill()); clearTimeout(safety); };
  }, [id]);
  return (
    <main className="wrap pt-10 md:pt-20 pb-24 md:pb-40">
      <p className="eyebrow">{list.length} styles</p>
      <h1 className="mt-4 text-[clamp(44px,11vw,160px)] leading-[0.92] tracking-[0.1em]" style={{ fontWeight: 300 }}>{info.title}</h1>
      <p className="mt-6 max-w-[520px] text-[16px] leading-relaxed text-ink/90">{info.description}</p>
      <h2 className="sr-only">All {info.label} styles</h2>
      <div ref={grid} className="mt-14 md:mt-24 grid grid-cols-2 lg:grid-cols-4 gap-x-4 md:gap-x-8 lg:gap-x-10 gap-y-12 md:gap-y-20">
        {list.map((p, i) => <ProductCard key={p.slug} p={p} index={i} priority={i < 4} />)}
      </div>
      <nav className="mt-20 md:mt-32 flex flex-wrap gap-3" aria-label="Other categories">
        {CATEGORIES.filter((c) => c.id !== id).map((c) => <Link key={c.id} to={`/category/${c.slug}`} className="inline-flex items-center min-h-[44px] px-6 rounded-full border hair text-[12.5px] uppercase tracking-[0.2em] hover:bg-ink hover:text-snow hover:border-ink transition-colors duration-300">{c.label}</Link>)}
        <Link to="/#collection" className="inline-flex items-center min-h-[44px] px-6 rounded-full border hair text-[12.5px] uppercase tracking-[0.2em] hover:bg-ink hover:text-snow hover:border-ink transition-colors duration-300">Full collection</Link>
      </nav>
    </main>
  );
}
