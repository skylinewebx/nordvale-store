import { Link } from "react-router-dom";
import { BRAND } from "../config/assets";
import { BUSINESS } from "../config/business";
import { CATEGORIES } from "../data/products";
import { useGoCategory, useGoSection } from "../components/Navbar";

export default function Footer() {
  const go = useGoSection(); const goCat = useGoCategory();
  const col = "space-y-0.5 text-[15px] text-ink/90 [&_a]:min-h-[36px] [&_a]:inline-flex [&_a]:items-center [&_button]:min-h-[36px] [&_a:hover]:text-ink [&_button:hover]:text-ink [&_a]:transition-colors [&_button]:transition-colors";
  return (
    <footer className="bg-mist border-t hair pt-16 md:pt-24 pb-10 text-ink">
      <div className="wrap grid sm:grid-cols-2 lg:grid-cols-4 gap-12">
        <div><p className="text-[24px] tracking-[0.42em]" style={{ fontWeight: 300 }}>{BRAND.name}</p><p className="text-[15px] text-ink/90 mt-4 max-w-[240px] leading-relaxed">{BRAND.tagline}</p><address className="not-italic text-[15px] text-ink/90 mt-5 leading-relaxed">{BUSINESS.street}<br />{BUSINESS.city}, {BUSINESS.state} {BUSINESS.zip}<br /><a href={`tel:${BUSINESS.phone.replace(/\s/g, "")}`} className="hover:text-ink">{BUSINESS.phoneDisplay}</a></address><p className="text-[12.5px] text-ink/90 mt-3">Ships from Houston, TX</p></div>
        <nav aria-label="Shop"><p className="eyebrow mb-4">Shop</p><ul className={col}>
          {CATEGORIES.map((c) => <li key={c.id}><button onClick={() => goCat(c.id)}>{c.label}</button></li>)}
          <li><button onClick={() => go("collection")}>Collections</button></li>
        </ul></nav>
        <nav aria-label="Brand and help"><p className="eyebrow mb-4">Brand &amp; help</p><ul className={col}>
          <li><Link to="/craftsmanship">Craftsmanship</Link></li>
          <li><Link to="/faq">FAQ</Link></li>
          <li><Link to="/size-guide">Size guide</Link></li>
          <li><Link to="/shipping-returns">Shipping &amp; returns</Link></li>
          <li><Link to="/track">Order tracking</Link></li>
          <li><Link to="/privacy">Privacy</Link></li>
        </ul></nav>
        <nav aria-label="More"><p className="eyebrow mb-4">More</p><ul className={col}>
          <li><Link to="/story">Our story</Link></li>
          <li><Link to="/reviews">Reviews</Link></li>
          <li><button onClick={() => go("contact")}>Contact</button></li>
        </ul><p className="eyebrow mt-8 mb-2">Payments</p><p className="text-[12.5px] text-ink/90 leading-relaxed">Cards · Cash on delivery (US) · JazzCash / Easypaisa · PayPal &amp; Stripe</p></nav>
      </div>
      <div className="wrap mt-14 pt-6 border-t hair flex flex-col sm:flex-row justify-between gap-2 text-[12.5px] text-ink/90"><span>© {new Date().getFullYear()} {BRAND.name}. All rights reserved.</span><span>Designed for the cold.</span></div>
    </footer>
  );
}
