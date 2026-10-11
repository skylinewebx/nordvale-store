import { useEffect } from "react";
import { Route, Routes, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import CartDrawer from "./components/CartDrawer";
import Navbar from "./components/Navbar";
import { CookieNotice, ProductModal, SearchOverlay, WishlistDrawer } from "./components/Overlays";
import Loader from "./hero/Loader";
import { initScroll } from "./lib/scroll";
import { cardUrl, preloadHigh, useCatalog, warmCards } from "./lib/catalog";
import { photoKey, products } from "./data/products";
import Checkout from "./pages/Checkout";
import Home from "./pages/Home";
import { Confirmation, NotFound, Privacy, ProductPage, Track } from "./pages/Misc";
import Footer from "./sections/Footer";

export default function App() {
  const location = useLocation(); const { pathname } = location;
  useEffect(() => { initScroll(); }, []);

  // Speed: priority-load the first visible cards, then warm EVERY card image in idle time (decoded, kept in memory)
  const catLoaded = useCatalog((s) => s.loaded);
  useEffect(() => {
    if (!catLoaded) return;
    const items = useCatalog.getState().items;
    const u = (slug: string, color: string) => { const k = photoKey(slug, color); return items[k] ? cardUrl(k, items[k]) : null; };
    const defaults = products.map((p) => u(p.slug, p.colors[0].slug)).filter(Boolean) as string[];
    const others = products.flatMap((p) => p.colors.slice(1).map((c) => u(p.slug, c.slug))).filter(Boolean) as string[];
    preloadHigh(defaults.slice(0, 8));
    const go = () => requestAnimationFrame(() => requestAnimationFrame(() => warmCards([...defaults.slice(8), ...others])));
    if (document.readyState === "complete") go(); else window.addEventListener("load", go, { once: true });
  }, [catLoaded]);
  return (
    <>
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[200] focus:bg-snow focus:p-3">Skip to content</a>
      {pathname === "/" && <Loader />}
      <Navbar />
      <div id="main">
        {/* opacity-only page transition: a transformed ancestor would break the hero's pinned (position: fixed) scroll */}
        <AnimatePresence mode="wait" initial={false} onExitComplete={() => { window.scrollTo(0, 0); ScrollTrigger.refresh(); }}>
          <motion.div key={location.pathname} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.35, ease: "easeInOut" }}>
            <Routes location={location}>
              <Route path="/" element={<Home />} />
              <Route path="/product/:slug" element={<ProductPage />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/order-confirmation" element={<Confirmation />} />
              <Route path="/track" element={<Track />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </motion.div>
        </AnimatePresence>
      </div>
      <Footer />
      <ProductModal />
      <CartDrawer />
      <WishlistDrawer />
      <SearchOverlay />
      <CookieNotice />
    </>
  );
}
