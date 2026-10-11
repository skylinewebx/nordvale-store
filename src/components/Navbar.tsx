import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { BRAND } from "../config/assets";
import { scrollToId } from "../lib/scroll";
import { totals, useStore } from "../store/useStore";
import { Icon } from "./Icons";

const MSGS = ["Free shipping on orders over $150", "Winter Sale — use code WINTER10 for 10% off", "30-day free returns · Ships in 24h"];
const LINKS = [["Collection", "collection"], ["Lookbook", "lookbook"], ["Craft", "craft"], ["Reviews", "reviews"], ["Contact", "contact"]] as const;

export function useGoSection() {
  const nav = useNavigate(); const loc = useLocation();
  return (id: string) => {
    if (loc.pathname === "/") scrollToId(id);
    else { nav("/"); setTimeout(() => scrollToId(id), 450); }
  };
}

export default function Navbar() {
  const [i, setI] = useState(0);
  const [menu, setMenu] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const cart = useStore((s) => s.cart); const promo = useStore((s) => s.promo);
  const wish = useStore((s) => s.wishlist.length); const set = useStore((s) => s.set);
  const count = totals(cart, promo).count;
  const go = useGoSection();

  useEffect(() => { const t = setInterval(() => setI((n) => (n + 1) % MSGS.length), 4500); return () => clearInterval(t); }, []);
  useEffect(() => { const f = () => setScrolled(window.scrollY > 10); f(); window.addEventListener("scroll", f, { passive: true }); return () => window.removeEventListener("scroll", f); }, []);

  const iconBtn = "relative w-12 h-12 flex items-center justify-center hover:opacity-60 transition-opacity";
  return (
    <header className="sticky top-0 z-50">
      <div className="bg-ink text-snow h-9 flex items-center justify-center overflow-hidden" role="region" aria-label="Announcements">
        <AnimatePresence mode="wait">
          <motion.p key={i} initial={{ y: 12, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -12, opacity: 0 }} transition={{ duration: 0.4 }} className="text-[10px] uppercase tracking-[0.2em] font-light px-4 text-center">{MSGS[i]}</motion.p>
        </AnimatePresence>
      </div>
      <nav className={`transition-colors duration-500 border-b ${scrolled ? "bg-snow/85 backdrop-blur-md hair" : "bg-snow/60 backdrop-blur-sm border-transparent"}`} aria-label="Main">
        <div className="wrap h-14 md:h-16 grid grid-cols-[1fr_auto_1fr] items-center">
          <div className="flex items-center">
            <button className={`${iconBtn} md:hidden -ml-3`} onClick={() => setMenu(true)} aria-label="Open menu"><Icon name="menu" /></button>
            <ul className="hidden md:flex gap-8">
              {LINKS.map(([l, id]) => <li key={id}><button onClick={() => go(id)} className="text-[11px] uppercase tracking-[0.18em] link-u py-2">{l}</button></li>)}
            </ul>
          </div>
          <Link to="/" className="font-display text-[22px] md:text-[26px] tracking-[0.38em] pl-[0.38em]" aria-label={`${BRAND.name} home`}>{BRAND.name}</Link>
          <div className="flex items-center justify-end -mr-3">
            <button className={iconBtn} onClick={() => set({ searchOpen: true })} aria-label="Search"><Icon name="search" /></button>
            <button className={`${iconBtn} hidden sm:flex`} onClick={() => set({ wishlistOpen: true })} aria-label={`Wishlist, ${wish} items`}>
              <Icon name="heart" />{wish > 0 && <span className="absolute top-2.5 right-2 text-[9px] bg-ink text-snow w-4 h-4 rounded-full flex items-center justify-center">{wish}</span>}
            </button>
            <Link to="/track" className={`${iconBtn} hidden md:flex`} aria-label="Track order"><Icon name="truck" /></Link>
            <button className={iconBtn} onClick={() => set({ cartOpen: true })} aria-label={`Cart, ${count} items`}>
              <Icon name="bag" />{count > 0 && <span className="absolute top-2.5 right-2 text-[9px] bg-ink text-snow w-4 h-4 rounded-full flex items-center justify-center">{count}</span>}
            </button>
          </div>
        </div>
      </nav>

      <AnimatePresence>
        {menu && (
          <motion.div className="fixed inset-0 z-[90] bg-snow flex flex-col" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} role="dialog" aria-modal="true" aria-label="Menu">
            <div className="wrap h-14 flex items-center justify-between">
              <span className="font-display text-[22px] tracking-[0.38em]">{BRAND.name}</span>
              <button className={`${iconBtn} -mr-3`} onClick={() => setMenu(false)} aria-label="Close menu"><Icon name="close" /></button>
            </div>
            <ul className="wrap flex-1 flex flex-col justify-center gap-1">
              {LINKS.map(([l, id], k) => (
                <motion.li key={id} initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.08 * k + 0.1 }}>
                  <button onClick={() => { setMenu(false); setTimeout(() => go(id), 250); }} className="font-display text-[40px] font-light py-2 min-h-[56px] w-full text-left">{l}</button>
                </motion.li>
              ))}
              <li className="mt-6 flex gap-6 text-[12px] uppercase tracking-[0.18em] text-stone">
                <Link to="/track" onClick={() => setMenu(false)}>Track order</Link>
                <button onClick={() => { setMenu(false); set({ wishlistOpen: true }); }}>Wishlist ({wish})</button>
              </li>
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
