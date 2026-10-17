import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { BRAND, money } from "../config/assets";
import { colorOf, effectivePrice, getProduct } from "../data/products";
import { PROMOS, totals, useStore } from "../store/useStore";
import { Icon } from "./Icons";
import { ProductImage } from "./ProductImage";
import { Overlay } from "./ui";

export function CartLines({ compact = false }: { compact?: boolean }) {
  const cart = useStore((s) => s.cart); const setQty = useStore((s) => s.setQty); const remove = useStore((s) => s.remove);
  return (
    <ul className="divide-y hair">
      {cart.map((i) => {
        const p = getProduct(i.slug); if (!p) return null;
        const col = colorOf(p, i.colorId);
        return (
          <li key={i.key} className="flex gap-4 py-5">
            <ProductImage product={p} colorId={i.colorId} className={`${compact ? "w-16 h-20" : "w-24 h-28"} shrink-0`} />
            <div className="flex-1 min-w-0 flex flex-col">
              <div className="flex justify-between gap-3"><h3 className="font-display text-[19px] leading-tight">{p.name}</h3><span className="text-[15px] tabular-nums">{money(effectivePrice(p) * i.qty)}</span></div>
              <p className="text-[12.5px] text-stone mt-1">{col.name} · {i.size}</p>
              <div className="mt-auto pt-3 flex items-center justify-between">
                <div className="flex items-center border hair">
                  <button className="w-11 h-11 flex items-center justify-center" onClick={() => setQty(i.key, i.qty - 1)} aria-label={`Decrease quantity of ${p.name}`}><Icon name="minus" size={14} /></button>
                  <span className="w-7 text-center text-[15px] tabular-nums" aria-live="polite">{i.qty}</span>
                  <button className="w-11 h-11 flex items-center justify-center" onClick={() => setQty(i.key, i.qty + 1)} aria-label={`Increase quantity of ${p.name}`}><Icon name="plus" size={14} /></button>
                </div>
                <button className="text-[12.5px] uppercase tracking-[0.16em] text-stone hover:text-ink min-h-[44px] px-2" onClick={() => remove(i.key)}>Remove</button>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

export function PromoField() {
  const promo = useStore((s) => s.promo); const apply = useStore((s) => s.applyPromo); const clear = useStore((s) => s.clearPromo);
  const [v, setV] = useState(""); const [err, setErr] = useState("");
  if (promo) return <div className="flex items-center justify-between text-[15px] py-2"><span>Code <b className="font-normal tracking-widest">{promo}</b> · {PROMOS[promo].label}</span><button className="text-stone underline min-h-[44px] px-2" onClick={clear}>Remove</button></div>;
  // Not a <form>: this component is also rendered inside the checkout form.
  const submit = () => { setErr(apply(v) ? "" : "That code isn't valid."); setV(""); };
  return (
    <div>
      <div className="flex gap-3 items-end">
        <label className="flex-1"><span className="sr-only">Promo code</span><input className={`field ${err ? "err" : ""}`} placeholder="Promo code (try WINTER10)" value={v} onChange={(e) => setV(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); submit(); } }} /></label>
        <button className="btn btn-line !px-5" type="button" onClick={submit}>Apply</button>
      </div>
      {err && <p className="text-[12.5px] text-accent mt-2" role="alert">{err}</p>}
    </div>
  );
}

export function Summary() {
  const cart = useStore((s) => s.cart); const promo = useStore((s) => s.promo);
  const t = totals(cart, promo);
  const row = "flex justify-between text-[15px]";
  return (
    <div className="space-y-2">
      <div className={row}><span className="text-stone">Subtotal</span><span className="tabular-nums">{money(t.subtotal)}</span></div>
      {t.discount > 0 && <div className={row}><span className="text-stone">Discount</span><span className="tabular-nums">−{money(t.discount)}</span></div>}
      <div className={row}><span className="text-stone">Shipping</span><span>{t.shipping === 0 ? "Free" : money(t.shipping)}</span></div>
      <div className="flex justify-between pt-3 border-t hair text-[16px]"><span>Total</span><span className="tabular-nums">{money(t.total)}</span></div>
    </div>
  );
}

export function ShipBar() {
  const cart = useStore((s) => s.cart); const promo = useStore((s) => s.promo);
  const t = totals(cart, promo);
  const pct = Math.min(100, ((BRAND.freeShippingThreshold - t.remaining) / BRAND.freeShippingThreshold) * 100);
  return (
    <div>
      <p className="text-[12.5px] text-stone">{t.remaining > 0 ? <>You're <b className="font-normal text-ink">{money(t.remaining)}</b> away from free shipping</> : "You've unlocked free shipping"}</p>
      <div className="mt-2 h-px bg-ink/10 relative"><div className="absolute inset-y-0 left-0 bg-ink transition-all duration-700" style={{ width: `${pct}%` }} /></div>
    </div>
  );
}

export default function CartDrawer() {
  const open = useStore((s) => s.cartOpen); const set = useStore((s) => s.set); const cart = useStore((s) => s.cart);
  const nav = useNavigate();
  const close = () => set({ cartOpen: false });
  return (
    <Overlay open={open} onClose={close} side="right" label="Shopping cart" z={90}>
      <div className="flex items-center justify-between px-6 h-16 border-b hair shrink-0">
        <h2 className="text-[22px]">Your Bag</h2>
        <button className="w-12 h-12 -mr-3 flex items-center justify-center" onClick={close} aria-label="Close cart"><Icon name="close" /></button>
      </div>
      {cart.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-6 px-6 text-center">
          <Icon name="bag" size={32} className="text-stone" />
          <p className="text-stone text-[15px]">Your bag is empty.</p>
          <button className="btn btn-line" onClick={() => { close(); setTimeout(() => document.getElementById("collection")?.scrollIntoView({ behavior: "smooth" }), 300); }}>Explore the collection</button>
        </div>
      ) : (
        <>
          <div className="px-6 pt-5"><ShipBar /></div>
          <div className="flex-1 overflow-y-auto px-6 overscroll-contain" data-lenis-prevent><CartLines compact /></div>
          <div className="px-6 py-5 border-t hair space-y-4 shrink-0 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
            <PromoField /><Summary />
            <button className="btn btn-solid w-full" onClick={() => { close(); nav("/checkout"); }}>Checkout</button>
          </div>
        </>
      )}
    </Overlay>
  );
}

