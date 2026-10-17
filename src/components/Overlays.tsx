import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, m } from "framer-motion";
import { money } from "../config/assets";
import { getProduct, products } from "../data/products";
import { useStore } from "../store/useStore";
import { Icon } from "./Icons";
import { ProductImage } from "./ProductImage";
import ProductDetail from "./ProductDetail";
import { Overlay } from "./ui";

export function ProductModal() {
  const slug = useStore((s) => s.openProduct); const set = useStore((s) => s.set); const viewed = useStore((s) => s.viewed);
  const scroller = useRef<HTMLDivElement>(null);
  const [last, setLast] = useState<string | null>(null);
  useEffect(() => { if (slug) { setLast(slug); viewed(slug); scroller.current?.scrollTo({ top: 0 }); } }, [slug, viewed]);
  const p = getProduct(slug ?? last ?? "");
  const close = () => set({ openProduct: null });
  return (
    <Overlay open={!!slug} onClose={close} label={p ? `${p.name} details` : "Product details"}>
      <div className="flex items-center justify-between px-5 h-14 border-b hair shrink-0">
        <span className="eyebrow">Product</span>
        <div className="flex items-center">
          {p && <Link to={`/product/${p.slug}`} onClick={close} className="text-[12.5px] uppercase tracking-[0.18em] link-u mr-4 hidden sm:block">Open full page</Link>}
          <button className="w-12 h-12 -mr-3 flex items-center justify-center" onClick={close} aria-label="Close product"><Icon name="close" /></button>
        </div>
      </div>
      <div ref={scroller} className="flex-1 overflow-y-auto overscroll-contain" data-lenis-prevent>
        {p && <ProductDetail key={p.slug} product={p} onOpen={(s) => set({ openProduct: s })} />}
      </div>
    </Overlay>
  );
}

export function WishlistDrawer() {
  const open = useStore((s) => s.wishlistOpen); const set = useStore((s) => s.set); const wish = useStore((s) => s.wishlist); const toggle = useStore((s) => s.toggleWish);
  const items = wish.map(getProduct).filter(Boolean) as NonNullable<ReturnType<typeof getProduct>>[];
  const close = () => set({ wishlistOpen: false });
  return (
    <Overlay open={open} onClose={close} side="right" label="Wishlist" z={90}>
      <div className="flex items-center justify-between px-6 h-16 border-b hair shrink-0">
        <h2 className="text-[22px]">Wishlist</h2>
        <button className="w-12 h-12 -mr-3 flex items-center justify-center" onClick={close} aria-label="Close wishlist"><Icon name="close" /></button>
      </div>
      <div className="flex-1 overflow-y-auto px-6 overscroll-contain" data-lenis-prevent>
        {items.length === 0 ? <p className="text-stone text-[15px] text-center mt-24">Nothing saved yet. Tap the heart on any piece.</p> : (
          <ul className="divide-y hair">
            {items.map((p) => (
              <li key={p.slug} className="flex gap-4 py-5">
                <button onClick={() => { close(); setTimeout(() => set({ openProduct: p.slug }), 300); }} className="w-20 h-24 shrink-0" aria-label={`View ${p.name}`}><ProductImage product={p} colorId={p.colors[0].id} className="w-full h-full" /></button>
                <div className="flex-1"><h3 className="font-display text-[19px]">{p.name}</h3><p className="text-[12.5px] text-stone">{p.category}</p><p className="text-[15px] mt-1">{money(p.salePrice ?? p.price)}</p></div>
                <button className="w-11 h-11 flex items-center justify-center" onClick={() => toggle(p.slug)} aria-label={`Remove ${p.name}`}><Icon name="close" size={16} /></button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Overlay>
  );
}

export function SearchOverlay() {
  const open = useStore((s) => s.searchOpen); const set = useStore((s) => s.set);
  const [q, setQ] = useState(""); const input = useRef<HTMLInputElement>(null);
  const results = useMemo(() => {
    const t = q.trim().toLowerCase(); if (!t) return products;
    return products.filter((p) => [p.name, p.category, p.tagline, ...p.colors.map((c) => c.name)].join(" ").toLowerCase().includes(t));
  }, [q]);
  const close = () => set({ searchOpen: false });
  useEffect(() => { if (open) setTimeout(() => input.current?.focus(), 150); else setQ(""); }, [open]);
  return (
    <Overlay open={open} onClose={close} label="Search" z={80}>
      <div className="wrap w-full flex-1 flex flex-col pt-4 overflow-hidden">
        <div className="flex items-center gap-3 border-b hair">
          <Icon name="search" className="text-stone shrink-0" />
          <input ref={input} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search pieces, colours, fabrics" className="flex-1 bg-transparent min-h-[64px] text-[20px] font-display outline-none" aria-label="Search products" />
          <button className="w-12 h-12 flex items-center justify-center" onClick={close} aria-label="Close search"><Icon name="close" /></button>
        </div>
        <div className="flex-1 overflow-y-auto py-6 overscroll-contain" data-lenis-prevent>
          <p className="eyebrow mb-4" aria-live="polite">{q ? `${results.length} result${results.length === 1 ? "" : "s"}` : "All pieces"}</p>
          <AnimatePresence mode="popLayout">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {results.map((p) => (
                <m.button layout key={p.slug} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-left" onClick={() => { close(); setTimeout(() => set({ openProduct: p.slug }), 300); }}>
                  <div className="aspect-[3/4] relative"><ProductImage product={p} colorId={p.colors[0].id} className="absolute inset-0" /></div>
                  <p className="font-display text-[19px] mt-2">{p.name}</p><p className="text-[12.5px] text-stone">{p.category}</p>
                </m.button>
              ))}
            </div>
          </AnimatePresence>
          {results.length === 0 && <p className="text-stone text-center mt-16">Nothing matches “{q}”.</p>}
        </div>
      </div>
    </Overlay>
  );
}

export function CookieNotice() {
  const c = useStore((s) => s.cookies); const set = useStore((s) => s.setCookies);
  // plain CSS entrance (no framer exit/delay): it stays until the visitor clicks Accept or Decline
  if (c !== "unset") return null;
  return (
    <div role="region" aria-label="Cookie notice" className="cookie-in fixed z-[95] bottom-4 left-4 right-4 md:right-auto md:max-w-[400px] bg-snow border hair p-5 shadow-[0_10px_40px_rgba(0,0,0,0.12)]">
      <p className="text-[15px] text-ink/90">We use a few cookies to remember your bag and improve the site. See our <Link className="underline" to="/privacy">privacy notice</Link>.</p>
      <div className="flex gap-3 mt-4"><button type="button" className="btn btn-solid flex-1 !px-4" onClick={() => set("accepted")}>Accept</button><button type="button" className="btn btn-line flex-1 !px-4" onClick={() => set("declined")}>Decline</button></div>
    </div>
  );
}

