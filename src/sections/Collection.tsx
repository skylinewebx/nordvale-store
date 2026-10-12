import { startTransition, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, animate, LayoutGroup, m, useMotionValue, useTransform } from "framer-motion";
import { Icon } from "../components/Icons";
import ProductCard from "../components/ProductCard";
import { Overlay, Reveal } from "../components/ui";
import { CATEGORIES, Category, effectivePrice, FIT_GROUPS, products } from "../data/products";
import { useCatalog } from "../lib/catalog";
import { reducedMotion } from "../lib/env";

const family = (hex: string) => {
  const n = parseInt(hex.slice(1), 16), r = (n >> 16) / 255, g = ((n >> 8) & 255) / 255, b = (n & 255) / 255;
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn;
  if (d < 0.1) return "Neutral";
  let h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; h = (h * 60 + 360) % 360;
  if (h < 50 || h >= 340) return "Warm"; if (h < 170) return "Green"; if (h < 260) return "Blue"; return "Purple";
};
const FAMS: Record<string, string> = { Neutral: "#a3a3a6", Warm: "#c0653a", Green: "#5a7a4a", Blue: "#3f66b0", Purple: "#8a5ab8" };
const PRICES = [["", "Any"], ["lt", "Under $100"], ["mid", "$100 – $180"], ["gt", "Over $180"]] as const;
const SORTS = { featured: "Featured", asc: "Price: low to high", desc: "Price: high to low", rating: "Top rated" } as const;
const TABS: { id: "all" | Category; label: string }[] = [{ id: "all", label: "All" }, ...CATEGORIES];

/** Number that eases to its new value: the live product count. */
function Count({ n }: { n: number }) {
  const mv = useMotionValue(n);
  const text = useTransform(mv, (v) => String(Math.round(v)).padStart(2, "0"));
  useEffect(() => { if (reducedMotion()) mv.set(n); else { const c = animate(mv, n, { duration: 0.6, ease: [0.22, 1, 0.36, 1] }); return () => c.stop(); } }, [n, mv]);
  return <m.span>{text}</m.span>;
}

/** Thin ring that follows the pointer over product cards (desktop with a fine pointer only). */
function CursorFollower({ scope }: { scope: React.RefObject<HTMLElement> }) {
  const el = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches || reducedMotion()) return;
    const s = scope.current, c = el.current; if (!s || !c) return;
    let x = 0, y = 0, tx = 0, ty = 0, on = 0, want = 0, raf = 0;
    const loop = () => {
      x += (tx - x) * 0.2; y += (ty - y) * 0.2; on += (want - on) * 0.18;
      c.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%) scale(${0.4 + 0.6 * on})`; c.style.opacity = String(on);
      raf = Math.abs(tx - x) > 0.2 || Math.abs(ty - y) > 0.2 || Math.abs(want - on) > 0.01 ? requestAnimationFrame(loop) : 0;
    };
    const kick = () => { if (!raf) raf = requestAnimationFrame(loop); };
    const move = (e: PointerEvent) => { tx = e.clientX; ty = e.clientY; want = (e.target as HTMLElement).closest("[data-cursor]") && !(e.target as HTMLElement).closest("button[aria-label^='Quick add'], button[aria-pressed], [role=radio], [role=group]") ? 1 : 0; kick(); };
    const leave = () => { want = 0; kick(); };
    s.addEventListener("pointermove", move); s.addEventListener("pointerleave", leave);
    return () => { s.removeEventListener("pointermove", move); s.removeEventListener("pointerleave", leave); cancelAnimationFrame(raf); };
  }, [scope]);
  return (
    <div ref={el} aria-hidden="true" className="fixed left-0 top-0 z-40 w-[84px] h-[84px] rounded-full border border-ink/40 flex items-center justify-center pointer-events-none opacity-0 max-md:hidden">
      <span className="eyebrow !text-ink">View</span>
    </div>
  );
}

function Chip({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return <button onClick={onClick} aria-pressed={on} className={`min-h-[44px] px-4 text-[12px] border transition-colors ${on ? "bg-ink text-snow border-ink" : "hair hover:border-ink"}`}>{children}</button>;
}

export default function Collection() {
  const section = useRef<HTMLElement>(null);
  const loaded = useCatalog((s) => s.loaded);
  const [tab, setTab] = useState<"all" | Category>("all");
  const [fam, setFam] = useState<string | null>(null);
  const [size, setSize] = useState("");
  const [fit, setFit] = useState("");
  const [price, setPrice] = useState("");
  const [sort, setSort] = useState<keyof typeof SORTS>("featured");
  const [drawer, setDrawer] = useState(false);
  const [lay, setLay] = useState(false); // layout animations are enabled on first intent (pointer/touch/focus on the filter bar)
  const [cap, setCap] = useState(8); // progressive mount: first 8 cards now, the rest in idle steps

  const inTab = useMemo(() => products.filter((p) => tab === "all" || p.category === tab), [tab]);
  const sizeOptions = useMemo(() => [...new Set(inTab.flatMap((p) => p.sizes))], [inTab]);

  const list = useMemo(() => {
    let l = inTab.filter((p) =>
      (!fam || p.colors.some((c) => family(c.hex) === fam)) &&
      (!size || p.sizes.includes(size)) &&
      (!fit || p.fitGroup === fit) &&
      (!price || (price === "lt" ? effectivePrice(p) < 100 : price === "mid" ? effectivePrice(p) >= 100 && effectivePrice(p) <= 180 : effectivePrice(p) > 180)));
    if (sort === "featured") l = [...l].sort((a, b) => Number(!!b.heroFeatured) - Number(!!a.heroFeatured) || Number(!!b.bestSeller) - Number(!!a.bestSeller));
    if (sort === "asc") l = [...l].sort((a, b) => effectivePrice(a) - effectivePrice(b));
    if (sort === "desc") l = [...l].sort((a, b) => effectivePrice(b) - effectivePrice(a));
    if (sort === "rating") l = [...l].sort((a, b) => b.rating - a.rating);
    return l;
  }, [inTab, fam, size, fit, price, sort]);
  const activeCount = [fam, size, fit, price, sort !== "featured" ? sort : ""].filter(Boolean).length;
  const clear = () => { setFam(null); setSize(""); setFit(""); setPrice(""); setSort("featured"); };
  const switchTab = (t: "all" | Category) => { setTab(t); setSize(""); };
  useEffect(() => {
    if (cap >= products.length) return;
    const id = setTimeout(() => startTransition(() => setCap((c) => c + 4)), 120);
    return () => clearTimeout(id);
  }, [cap]);
  const shown = list.slice(0, cap);

  return (
    <section ref={section} id="collection" className="pt-28 md:pt-44 pb-28 md:pb-44 wrap" aria-labelledby="col-h">
      {/* editorial title with a live count */}
      <Reveal className="mb-10 md:mb-14 flex items-end justify-between gap-6">
        <div>
          <p className="eyebrow">The Collection</p>
          <h2 id="col-h" className="mt-3 text-[clamp(44px,8.5vw,120px)] leading-[0.95] font-light tracking-[-0.02em]">Considered <em className="font-light">pieces.</em></h2>
        </div>
        <p className="font-display font-light text-[clamp(44px,8vw,110px)] leading-[0.9] text-ink/20 tabular-nums select-none" aria-live="polite" aria-label={`${list.length} pieces`}><Count n={list.length} /></p>
      </Reveal>

      {/* sticky pill bar */}
      <div onPointerEnter={() => setLay(true)} onTouchStart={() => setLay(true)} onFocus={() => setLay(true)} className="sticky z-30 top-[92px] md:top-[100px] -mx-5 px-5 md:-mx-10 md:px-10 py-3 mb-8 md:mb-12 bg-snow/90 border-y hair rounded-none">
        <div className="flex items-center gap-3">
          <LayoutGroup id="pills">
            <div className="flex gap-1 overflow-x-auto no-scrollbar flex-1 -mx-1 px-1" role="tablist" aria-label="Category">
              {TABS.map((t) => (
                <button key={t.id} role="tab" aria-selected={tab === t.id} onClick={() => switchTab(t.id)} className={`relative shrink-0 min-h-[44px] px-5 rounded-full text-[11px] uppercase tracking-[0.18em] transition-colors duration-300 ${tab === t.id ? "text-snow" : "text-stone hover:text-ink"}`}>
                  {tab === t.id && <m.span layoutId="pill" className="absolute inset-0 rounded-full bg-ink" transition={{ type: "spring", stiffness: 420, damping: 36 }} />}
                  <span className="relative">{t.label}<span className="ml-1.5 opacity-50 text-[10px]">{t.id === "all" ? products.length : products.filter((p) => p.category === t.id).length}</span></span>
                </button>
              ))}
            </div>
          </LayoutGroup>
          <button onClick={() => setDrawer(true)} className="shrink-0 min-h-[44px] px-5 rounded-full border hair hover:border-ink transition-colors flex items-center gap-2 text-[11px] uppercase tracking-[0.18em]" aria-label={`Filters${activeCount ? `, ${activeCount} active` : ""}`}>
            <Icon name="menu" size={14} />Filters{activeCount > 0 && <span className="w-4 h-4 rounded-full bg-ink text-snow text-[9px] flex items-center justify-center">{activeCount}</span>}
          </button>
        </div>
      </div>

      {/* bento grid: one large featured card, the rest standard (2 columns on mobile) */}
      <div role="tabpanel" className="card-grid grid grid-cols-2 lg:grid-cols-4 gap-x-5 md:gap-x-8 lg:gap-x-10 gap-y-14 md:gap-y-24">
        {!loaded && Array.from({ length: 8 }).map((_, i) => (
          <div key={i}><div className="skeleton relative aspect-[3/4] rounded-[20px]" /><div className="mt-6 h-4 w-1/2 skeleton relative rounded" /></div>
        ))}
        {loaded && (
          <AnimatePresence mode="popLayout" initial={false}>
            {shown.map((p, i) => <ProductCard key={p.slug} p={p} index={i} priority={i < 4} animateLayout={lay} />)}
          </AnimatePresence>
        )}
      </div>
      {loaded && list.length === 0 && <p className="text-center text-stone py-24">No pieces match those filters. <button className="underline" onClick={clear}>Clear filters</button></p>}

      <CursorFollower scope={section} />

      {/* compact filter drawer */}
      <Overlay open={drawer} onClose={() => setDrawer(false)} side="right" label="Filters" z={85}>
        <div className="flex items-center justify-between px-6 h-16 border-b hair shrink-0">
          <h2 className="text-[22px]">Filters</h2>
          <button className="w-12 h-12 -mr-3 flex items-center justify-center" onClick={() => setDrawer(false)} aria-label="Close filters"><Icon name="close" /></button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-9 overscroll-contain" data-lenis-prevent>
          <fieldset><legend className="eyebrow mb-3">Colour</legend>
            <div className="flex gap-1 -ml-1">{Object.entries(FAMS).map(([k, hex]) => (
              <button key={k} aria-label={k} aria-pressed={fam === k} onClick={() => setFam(fam === k ? null : k)} className="w-11 h-11 flex items-center justify-center"><span className={`w-6 h-6 rounded-full border border-ink/15 transition-all ${fam === k ? "ring-1 ring-ink ring-offset-2 ring-offset-snow" : ""}`} style={{ background: hex }} /></button>
            ))}</div></fieldset>
          <fieldset><legend className="eyebrow mb-3">Fit</legend><div className="flex flex-wrap gap-2">{FIT_GROUPS.map((f) => <Chip key={f} on={fit === f} onClick={() => setFit(fit === f ? "" : f)}>{f}</Chip>)}</div></fieldset>
          <fieldset><legend className="eyebrow mb-3">Size</legend><div className="flex flex-wrap gap-2">{sizeOptions.map((s) => <Chip key={s} on={size === s} onClick={() => setSize(size === s ? "" : s)}>{s}</Chip>)}</div></fieldset>
          <fieldset><legend className="eyebrow mb-3">Price</legend><div className="flex flex-wrap gap-2">{PRICES.slice(1).map(([k, l]) => <Chip key={k} on={price === k} onClick={() => setPrice(price === k ? "" : k)}>{l}</Chip>)}</div></fieldset>
          <fieldset><legend className="eyebrow mb-3">Sort</legend><div className="flex flex-wrap gap-2">{Object.entries(SORTS).map(([k, l]) => <Chip key={k} on={sort === k} onClick={() => setSort(k as keyof typeof SORTS)}>{l}</Chip>)}</div></fieldset>
        </div>
        <div className="px-6 py-5 border-t hair flex gap-3 shrink-0 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
          <button className="btn btn-line flex-1" onClick={clear} disabled={activeCount === 0}>Clear</button>
          <button className="btn btn-solid flex-[2]" onClick={() => setDrawer(false)}>Show {list.length} pieces</button>
        </div>
      </Overlay>
    </section>
  );
}
