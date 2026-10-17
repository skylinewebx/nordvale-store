import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { AnimatePresence, m } from "framer-motion";
import { BRAND } from "../config/assets";
import { CATEGORIES, Category } from "../data/products";
import { getLenis, lockScroll, scrollToId } from "../lib/scroll";
import { totals, useStore } from "../store/useStore";
import { Icon } from "./Icons";

export function useGoSection() {
  const nav = useNavigate(); const loc = useLocation();
  return (id: string) => {
    if (loc.pathname === "/") scrollToId(id);
    else { nav("/"); setTimeout(() => scrollToId(id), 500); }
  };
}

/** category links smooth-scroll to that category's section on the home page (from any other page: go home first) */
export function useGoCategory() {
  const go = useGoSection();
  return (c: Category) => go(`cat-${c}`);
}

const TOP = "inline-flex items-center text-[12.5px] leading-none uppercase tracking-[0.08em] nav-u py-3";

export default function Navbar() {
  const [menu, setMenu] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const cart = useStore((s) => s.cart); const promo = useStore((s) => s.promo);
  const wish = useStore((s) => s.wishlist.length); const set = useStore((s) => s.set);
  const heroCat = useStore((s) => s.heroCat);
  const count = totals(cart, promo).count;
  const go = useGoSection(); const goCat = useGoCategory(); const loc = useLocation(); const navigate = useNavigate();

  useEffect(() => { const f = () => setScrolled(window.scrollY > 24); f(); window.addEventListener("scroll", f, { passive: true }); return () => window.removeEventListener("scroll", f); }, []);
  useEffect(() => { setMenu(false); }, [loc.pathname]);
  useEffect(() => { lockScroll(menu); return () => { if (menu) lockScroll(false); }; }, [menu]);

  const iconBtn = "relative w-11 h-11 flex items-center justify-center text-ink/90 hover:text-ink hover:scale-110 transition-[transform,color] duration-300";
  const close = (fn: () => void) => () => { setMenu(false); setTimeout(fn, 320); };
  const onHome = loc.pathname === "/";
  return (
    <header className="fixed top-0 inset-x-0 z-50">
      <nav className={`transition-[background-color,box-shadow] duration-500 ${scrolled ? "bg-snow shadow-[0_1px_0_rgb(var(--hair)/0.1)]" : "bg-transparent"}`} aria-label="Main">
        <div className={`mx-auto w-full px-5 md:px-10 max-w-[1560px] flex items-center justify-between gap-6 transition-[height] duration-500 ${scrolled ? "h-14" : "h-[68px] md:h-20"}`} style={{ transitionTimingFunction: "cubic-bezier(.22,1,.36,1)" }}>
          <Link to="/" onClick={() => { if (onHome) window.scrollTo({ top: 0, behavior: "smooth" }); }} className="font-display text-[19px] md:text-[21px] tracking-[0.42em] pl-[0.1em] shrink-0" style={{ fontWeight: 450 }} aria-label={`${BRAND.name} home`}>{BRAND.name}</Link>

          <ul className="hidden xl:flex items-center gap-7 2xl:gap-9">
            {CATEGORIES.map((c) => (
              <li key={c.id}><button onClick={() => goCat(c.id)} className={TOP}>{c.label}</button></li>
            ))}
            <li><button onClick={() => go("collection")} className={TOP}>Collections</button></li>
            <li><Link to="/craftsmanship" className={`${TOP} ${loc.pathname === "/craftsmanship" ? "after:!scale-x-100" : ""}`}>Craftsmanship</Link></li>
            <li><button onClick={() => go("contact")} className={TOP}>Contact</button></li>
          </ul>

          <div className="flex items-center justify-end -mr-2 shrink-0">
            <button className={`${iconBtn} hidden sm:flex`} onClick={() => set({ searchOpen: true })} aria-label="Search"><Icon name="search" /></button>
            <button className={`${iconBtn} hidden sm:flex`} onClick={() => set({ wishlistOpen: true })} aria-label={`Wishlist, ${wish} items`}>
              <Icon name="heart" />{wish > 0 && <span className="absolute top-[11px] right-[9px] w-[7px] h-[7px] rounded-full bg-wine" />}
            </button>
            <button className={iconBtn} onClick={() => set({ cartOpen: true })} aria-label={`Cart, ${count} items`}>
              <Icon name="bag" />{count > 0 && <span className="absolute top-[10px] right-[8px] w-2 h-2 rounded-full bg-wine ring-2 ring-snow" />}
            </button>
            <button className={`${iconBtn} xl:hidden`} onClick={() => setMenu(true)} aria-label="Open menu"><Icon name="menu" /></button>
          </div>
        </div>
      </nav>

      <AnimatePresence>
        {menu && (
          <m.div className="fixed inset-0 z-[90] bg-snow flex flex-col pt-[env(safe-area-inset-top)]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.35 }} role="dialog" aria-modal="true" aria-label="Menu" data-lenis-prevent>
            <div className="px-5 h-[68px] flex items-center justify-between shrink-0">
              <span className="font-display text-[19px] tracking-[0.42em]" style={{ fontWeight: 450 }}>{BRAND.name}</span>
              <button className={`${iconBtn} -mr-2`} onClick={() => setMenu(false)} aria-label="Close menu"><Icon name="close" /></button>
            </div>
            <ul className="px-5 flex-1 flex flex-col justify-center overflow-y-auto">
              {[...CATEGORIES.map((c) => [c.label, () => goCat(c.id)] as const), ["Collections", () => go("collection")] as const, ["Craftsmanship", () => navigate("/craftsmanship")] as const, ["Contact", () => go("contact")] as const].map(([l, fn], k) => (
                <m.li key={l} initial={{ y: 24, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.06 * k + 0.12, duration: 0.6, ease: [0.22, 1, 0.36, 1] }} className="border-b hair">
                  <button onClick={close(fn)} className="font-display text-[clamp(30px,9vw,44px)] py-3 min-h-[56px] w-full text-left" style={{ fontWeight: 300 }}>{l}</button>
                </m.li>
              ))}
            </ul>
            <div className="px-5 py-6 flex gap-6 text-[12.5px] uppercase tracking-[0.2em] text-stone shrink-0 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
              <button onClick={close(() => set({ searchOpen: true }))}>Search</button>
              <button onClick={close(() => set({ wishlistOpen: true }))}>Wishlist ({wish})</button>
              <Link to="/track" onClick={() => setMenu(false)}>Track order</Link>
            </div>
          </m.div>
        )}
      </AnimatePresence>
    </header>
  );

}
