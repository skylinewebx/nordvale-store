import { FormEvent, useEffect, useState } from "react";
import { Link, useParams, useSearchParams, useNavigate } from "react-router-dom";
import { BRAND, money } from "../config/assets";
import { Icon } from "../components/Icons";
import ProductDetail from "../components/ProductDetail";
import { effectivePrice, getProduct } from "../data/products";
import { useSeo } from "../lib/seo";
import { Order, useStore } from "../store/useStore";

export function ProductPage() {
  const { slug } = useParams(); const nav = useNavigate(); const viewed = useStore((s) => s.viewed);
  const p = getProduct(slug ?? "");
  useSeo(p ? `${p.name} — ${p.type} | NORDVALE` : "Not found", p ? `${p.tagline} ${p.fabric.type}, ${p.fabric.gsm} GSM. Made in ${p.madeIn}.` : "", p ? { "@context": "https://schema.org", "@type": "Product", name: p.name, description: p.story, offers: { "@type": "Offer", priceCurrency: BRAND.currencyCode, price: p.salePrice ?? p.price, availability: p.stock === "out" ? "https://schema.org/OutOfStock" : "https://schema.org/InStock" }, aggregateRating: { "@type": "AggregateRating", ratingValue: p.rating, reviewCount: p.reviewCount } } : undefined);
  useEffect(() => { if (p) viewed(p.slug); }, [p, viewed]);
  if (!p) return <NotFound />;
  return <main><div className="wrap pt-6"><Link to="/#collection" className="text-[11px] uppercase tracking-[0.18em] link-u">← Collection</Link></div><ProductDetail key={p.slug} product={p} onOpen={(s) => { nav(`/product/${s}`); window.scrollTo(0, 0); }} /></main>;
}

export function Confirmation() {
  useSeo("Order confirmed — NORDVALE", "Thank you for your order.");
  const [q] = useSearchParams(); const order = useStore((s) => s.lastOrder);
  if (!order || order.id !== q.get("id")) return <main className="wrap py-32 text-center"><h1 className="text-[40px]">No recent order</h1><Link to="/" className="btn btn-solid mt-8">Back to shop</Link></main>;
  return (
    <main className="wrap py-20 md:py-32 max-w-2xl text-center">
      <div className="w-16 h-16 mx-auto rounded-full border border-ink flex items-center justify-center"><Icon name="check" size={28} /></div>
      <h1 className="text-[clamp(34px,5vw,56px)] mt-8">Thank you, {order.name.split(" ")[0]}.</h1>
      <p className="text-stone mt-4">Your order <b className="font-normal text-ink tracking-widest">{order.id}</b> is confirmed. A receipt has been sent to {order.email}.</p>
      <dl className="mt-12 text-left border-t hair">
        {[["Payment", order.method], ["Total", money(order.total)], ["Estimated delivery", "2–4 working days"]].map(([k, v]) => <div key={k} className="flex justify-between py-4 border-b hair text-[14px]"><dt className="text-stone">{k}</dt><dd>{v}</dd></div>)}
      </dl>
      <div className="mt-12 flex flex-col sm:flex-row gap-4 justify-center"><Link className="btn btn-solid" to={`/track?id=${order.id}`}>Track order</Link><Link className="btn btn-line" to="/">Continue shopping</Link></div>
    </main>
  );
}

const STEPS = ["Order placed", "Packed", "Shipped", "Out for delivery", "Delivered"];

export function Track() {
  useSeo("Track your order — NORDVALE", "Check the status of your Nordvale order.");
  const [q] = useSearchParams(); const orders = useStore((s) => s.orders);
  const [id, setId] = useState(q.get("id") ?? ""); const [found, setFound] = useState<Order | "none" | null>(null);
  const lookup = (e?: FormEvent) => { e?.preventDefault(); const k = id.trim().toUpperCase(); if (!k) return; setFound(orders.find((o) => o.id === k) ?? "none"); };
  // Mock progress: advances with the age of the order (demo only).
  const stage = (o: Order) => Math.min(4, Math.floor((Date.now() - new Date(o.date).getTime()) / 36e5 / 6));
  return (
    <main className="wrap py-16 md:py-28 max-w-2xl">
      <h1 className="text-[clamp(34px,5vw,52px)]">Track your order</h1>
      <p className="text-stone text-[14px] mt-3">Enter the order number from your confirmation email. (Demo: shows orders placed on this device.)</p>
      <form onSubmit={lookup} className="mt-10 flex gap-4 items-end"><label className="flex-1"><span className="sr-only">Order number</span><input className="field" placeholder="e.g. NV7K2P9Q" value={id} onChange={(e) => setId(e.target.value)} /></label><button className="btn btn-solid" type="submit">Track</button></form>
      {found === "none" && <p role="alert" className="mt-8 text-accent text-[14px]">We couldn't find that order on this device.</p>}
      {found && found !== "none" && (
        <div className="mt-14">
          <p className="eyebrow">Order {found.id}</p>
          <ol className="mt-8 space-y-0">
            {STEPS.map((s, i) => { const on = i <= stage(found); return (
              <li key={s} className="flex gap-5 pb-8 last:pb-0 relative">
                {i < STEPS.length - 1 && <span className={`absolute left-[7px] top-4 bottom-0 w-px ${i < stage(found) ? "bg-ink" : "bg-ink/15"}`} />}
                <span className={`w-4 h-4 rounded-full border shrink-0 mt-1 ${on ? "bg-ink border-ink" : "border-ink/30"}`} />
                <span className={on ? "text-ink" : "text-stone"}>{s}</span>
              </li>); })}
          </ol>
          <ul className="mt-10 border-t hair">{found.items.map((i) => { const p = getProduct(i.slug)!; return <li key={i.key} className="flex justify-between py-3 text-[13px] border-b hair"><span>{p.name} × {i.qty} · {i.size}</span><span>{money(effectivePrice(p) * i.qty)}</span></li>; })}</ul>
        </div>
      )}
    </main>
  );
}

export function NotFound() {
  useSeo("Page not found — NORDVALE", "The page you are looking for doesn't exist.");
  return (
    <main className="min-h-[70vh] flex flex-col items-center justify-center text-center px-6">
      <p className="eyebrow">Error 404</p>
      <h1 className="text-[clamp(64px,14vw,160px)] leading-none mt-4 italic">Lost in the snow.</h1>
      <p className="text-stone mt-6">This page has drifted away.</p>
      <Link to="/" className="btn btn-solid mt-10">Back to the collection</Link>
    </main>
  );
}

export function Privacy() {
  useSeo("Privacy — NORDVALE", "How Nordvale handles your data.");
  return (
    <main className="wrap py-20 max-w-2xl space-y-6 text-[14px] text-ink/75 leading-relaxed">
      <h1 className="text-[44px] text-ink">Privacy notice</h1>
      <p>This is a demo store. Your bag, wishlist and recently viewed items are saved in your browser's local storage only; nothing is sent to a server.</p>
      <p>When connected to a real backend, we will collect only what is needed to fulfil orders (name, address, contact details) and process payments through our providers. We never store card numbers.</p>
      <p>Replace this text with your own policy before launch. <Link to="/" className="underline">Back home</Link></p>
    </main>
  );
}
