import { lazy, Suspense } from "react";
import Showcase from "../hero/Showcase";
import Collection from "../sections/Collection";
import CategorySection from "../sections/CategorySection";
import { useSeo } from "../lib/seo";
import { products } from "../data/products";
import { businessJsonLd } from "../config/business";

// Home = Showcase hero → 4 category sections → Full Collection → Contact → (Footer in App). Everything else lives on its own page.
const Contact = lazy(() => import("../sections/Info").then((m) => ({ default: m.Contact })));

const ld = { ...businessJsonLd, makesOffer: products.map((p) => ({ "@type": "Offer", itemOffered: { "@type": "Product", name: p.name } })) };

export default function Home() {
  useSeo("NORDVALE — Hoodies, Jackets, Trousers & T-Shirts", "Sixteen considered pieces across hoodies, jackets, trousers and t-shirts. Ships from Houston, Texas.", ld);
  return (
    <main>
      <Showcase />
      <CategorySection cat="hoodies" next="jackets" />
      <CategorySection cat="jackets" next="trousers" />
      <CategorySection cat="trousers" next="tshirts" />
      <CategorySection cat="tshirts" />
      <Collection />
      <Suspense fallback={<div className="min-h-[60vh]" />}><Contact /></Suspense>
    </main>
  );
}
