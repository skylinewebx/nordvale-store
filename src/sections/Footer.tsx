import { Link } from "react-router-dom";
import { BRAND } from "../config/assets";
import { useGoSection } from "../components/Navbar";

export default function Footer() {
  const go = useGoSection();
  const col = "space-y-1 text-[13px] text-ink/60 [&_a]:min-h-[36px] [&_a]:inline-flex [&_a]:items-center [&_a:hover]:text-ink";
  return (
    <footer className="theme-red pt-20 pb-10 text-ink">
      <div className="wrap grid sm:grid-cols-2 lg:grid-cols-4 gap-12">
        <div><p className="font-display text-[26px] tracking-[0.38em]">{BRAND.name}</p><p className="text-[13px] text-ink/50 mt-4 max-w-[220px]">{BRAND.tagline}</p></div>
        <nav aria-label="Shop"><p className="eyebrow !text-ink/40 mb-4">Shop</p><ul className={col}><li><button onClick={() => go("collection")}>Collection</button></li><li><button onClick={() => go("lookbook")}>Lookbook</button></li><li><button onClick={() => go("craft")}>Fabrics</button></li><li><button onClick={() => go("size-guide")}>Size guide</button></li></ul></nav>
        <nav aria-label="Help"><p className="eyebrow !text-ink/40 mb-4">Help</p><ul className={col}><li><Link to="/track">Track order</Link></li><li><button onClick={() => go("faq")}>Shipping & returns</button></li><li><button onClick={() => go("contact")}>Contact</button></li><li><Link to="/privacy">Privacy</Link></li></ul></nav>
        <div><p className="eyebrow !text-ink/40 mb-4">Payments</p><p className="text-[13px] text-ink/60 leading-relaxed">Cash on delivery · Cards · JazzCash / Easypaisa · PayPal & Stripe worldwide</p></div>
      </div>
      <div className="wrap mt-16 pt-6 border-t border-ink/10 flex flex-col sm:flex-row justify-between gap-2 text-[11px] text-ink/40"><span>© {new Date().getFullYear()} {BRAND.name}. All rights reserved.</span><span>Designed for the cold.</span></div>
    </footer>
  );
}

