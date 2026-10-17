import { lazy, Suspense, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useSeo } from "../lib/seo";
import { Story, WhyUs } from "../sections/Story";

const Reviews = lazy(() => import("../sections/Reviews"));
const Faq = lazy(() => import("../sections/Info").then((m) => ({ default: m.Faq })));
const Fallback = <div className="min-h-[60vh]" />;

/** Simple content pages linked from the footer (the section code is reused as is). */
export function StoryPage() {
  useSeo("Our story — NORDVALE", "Why Nordvale, a Houston, Texas label, makes fewer, heavier, longer-lasting clothes.");
  return <main><h1 className="sr-only">Our story</h1><Story /><WhyUs /></main>;
}
export function ReviewsPage() {
  useSeo("Reviews — NORDVALE", "What customers say about Nordvale. Sample reviews for the demo store.");
  return <main><h1 className="sr-only">Customer reviews</h1><Suspense fallback={Fallback}><Reviews /></Suspense><p className="wrap pb-16 text-[12.5px] text-stone">Sample reviews and ratings: demo data, replace with real customer reviews.</p></main>;
}
/** FAQ, size guide and shipping & returns share one page; the route picks the anchor. */
export function HelpPage() {
  const { pathname } = useLocation();
  useSeo("FAQ, size guide, shipping & returns — NORDVALE", "Answers about sizing, shipping, returns and care.");
  useEffect(() => {
    const id = pathname.includes("size") ? "size-guide" : "faq";
    const t = setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" }), 700);
    return () => clearTimeout(t);
  }, [pathname]);
  return <main><h1 className="sr-only">FAQ, size guide, shipping and returns</h1><Suspense fallback={Fallback}><Faq /></Suspense></main>;
}
