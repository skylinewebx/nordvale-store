import { lazy, Suspense, useEffect } from "react";
import { Route, Routes, useLocation } from "react-router-dom";
import { AnimatePresence, m } from "framer-motion";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import CartDrawer from "./components/CartDrawer";
import Navbar from "./components/Navbar";
import { CookieNotice, ProductModal, SearchOverlay, WishlistDrawer } from "./components/Overlays";
import { initScroll, refreshOnceWhenSettled } from "./lib/scroll";
import { startFpsMonitor } from "./lib/perf";
import { cardUrl, preloadHigh, useCatalog, warmCards } from "./lib/catalog";
import { photoKey, products } from "./data/products";
import Home from "./pages/Home";

// route-level code splitting: checkout and the secondary pages load on demand
const Checkout = lazy(() => import("./pages/Checkout"));
const Confirmation = lazy(() => import("./pages/Misc").then((m) => ({ default: m.Confirmation })));
const NotFound = lazy(() => import("./pages/Misc").then((m) => ({ default: m.NotFound })));
const Privacy = lazy(() => import("./pages/Misc").then((m) => ({ default: m.Privacy })));
const ProductPage = lazy(() => import("./pages/ProductPage"));
const Craftsmanship = lazy(() => import("./pages/Craftsmanship"));
const CategoryPage = lazy(() => import("./pages/CategoryPage"));
const StoryPage = lazy(() => import("./pages/Pages").then((m) => ({ default: m.StoryPage })));
const ReviewsPage = lazy(() => import("./pages/Pages").then((m) => ({ default: m.ReviewsPage })));
const HelpPage = lazy(() => import("./pages/Pages").then((m) => ({ default: m.HelpPage })));
const Track = lazy(() => import("./pages/Misc").then((m) => ({ default: m.Track })));
import Deferred from "./components/Deferred";
import Footer from "./sections/Footer";

export default function App() {
  const location = useLocation(); const { pathname } = location;
  useEffect(() => { initScroll(); refreshOnceWhenSettled(); return startFpsMonitor(); }, []);

  // Speed: priority-load the first visible cards, then warm EVERY card image in idle time (decoded, kept in memory)
  const catLoaded = useCatalog((s) => s.loaded);
  useEffect(() => {
    if (!catLoaded) return;
    const items = useCatalog.getState().items;
    const u = (slug: string, color: string) => { const k = photoKey(slug, color); return items[k] ? cardUrl(k, items[k]) : null; };
    const defaults = products.map((p) => u(p.slug, p.colors[0].slug)).filter(Boolean) as string[];
    const others = products.flatMap((p) => p.colors.slice(1).map((c) => u(p.slug, c.slug))).filter(Boolean) as string[];
    preloadHigh(defaults.slice(0, 4)); // first row only, immediately
    const go = () => requestAnimationFrame(() => requestAnimationFrame(() => warmCards([...defaults.slice(4), ...others])));
    if (document.readyState === "complete") go(); else window.addEventListener("load", go, { once: true });
  }, [catLoaded]);
  return (
    <>
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[200] focus:bg-snow focus:p-3">Skip to content</a>
      <Navbar />
      <div id="main">
        {/* opacity-only page transition: a transformed ancestor would break the hero's pinned (position: fixed) scroll */}
        <AnimatePresence mode="wait" initial={false} onExitComplete={() => { window.scrollTo(0, 0); ScrollTrigger.refresh(); }}>
          <m.div key={location.pathname} className={pathname === "/" || pathname.startsWith("/product/") ? "" : "pt-[68px] md:pt-20"} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}>
            <Suspense fallback={<div className="min-h-[60vh]" />}>
            <Routes location={location}>
              <Route path="/" element={<Home />} />
              <Route path="/product/:slug" element={<ProductPage />} />
              <Route path="/craftsmanship" element={<Craftsmanship />} />
              <Route path="/category/:slug" element={<CategoryPage />} />
              <Route path="/story" element={<StoryPage />} />
              <Route path="/reviews" element={<ReviewsPage />} />
              <Route path={"/faq"} element={<HelpPage />} />
              <Route path="/size-guide" element={<HelpPage />} />
              <Route path="/shipping-returns" element={<HelpPage />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/order-confirmation" element={<Confirmation />} />
              <Route path="/track" element={<Track />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
            </Suspense>
          </m.div>
        </AnimatePresence>
      </div>
      {/* not needed for first paint: mounted right after load + idle (or earlier on demand) */}
      <Deferred minHeight="0px" delay={2600}><Footer /></Deferred>
      <Deferred minHeight="0px" delay={2100}><ProductModal /></Deferred>
      <Deferred minHeight="0px" delay={2400}><CartDrawer /></Deferred>
      <Deferred minHeight="0px" delay={2700}><WishlistDrawer /></Deferred>
      <Deferred minHeight="0px" delay={3000}><SearchOverlay /></Deferred>
      <Deferred minHeight="0px" delay={3300}><CookieNotice /></Deferred>
    </>
  );
}
