import { lazy, Suspense } from "react";
import Hero from "../hero/Hero";
import Deferred from "../components/Deferred";
import TextBand from "../components/TextBand";
import Collection from "../sections/Collection";
import { Craft, Story, WhyUs } from "../sections/Story";
import { useSeo } from "../lib/seo";
import { products } from "../data/products";

// Heavier / below-the-fold sections are code-split.
const Lookbook = lazy(() => import("../sections/Lookbook"));
const Reviews = lazy(() => import("../sections/Reviews"));
const RecentlyViewed = lazy(() => import("../sections/Info").then((m) => ({ default: m.RecentlyViewed })));
const Faq = lazy(() => import("../sections/Info").then((m) => ({ default: m.Faq })));
const Newsletter = lazy(() => import("../sections/Info").then((m) => ({ default: m.Newsletter })));
const Contact = lazy(() => import("../sections/Info").then((m) => ({ default: m.Contact })));

const ld = { "@context": "https://schema.org", "@type": "Store", name: "NORDVALE", description: "Hoodies, jackets, trousers and t-shirts.", makesOffer: products.map((p) => ({ "@type": "Offer", itemOffered: { "@type": "Product", name: p.name } })) };

export default function Home() {
  useSeo("NORDVALE — Hoodies, Jackets, Trousers & T-Shirts", "Sixteen considered pieces across hoodies, jackets, trousers and t-shirts, cut and sewn with care, built to last.", ld);
  return (
    <main>
      <Hero />
      <Deferred minHeight="110vh" delay={300}><Story /></Deferred>
      <Deferred minHeight="620vh" delay={900}><Craft /></Deferred>
      <Deferred minHeight="360vh" delay={1500} refresh><Collection /><TextBand /></Deferred>
      <Deferred minHeight="720vh" delay={2000}>
      <Suspense fallback={<div className="min-h-[80vh]" />}>
        <Lookbook />
        <WhyUs />

        <Reviews />
        <RecentlyViewed />
        <Faq />
        <Newsletter />
        <Contact />
      </Suspense>
      </Deferred>
    </main>
  );
}
