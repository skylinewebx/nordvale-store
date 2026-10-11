import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { BRAND, money } from "../config/assets";
import { CartLines, PromoField, ShipBar, Summary } from "../components/CartDrawer";
import { useSeo } from "../lib/seo";
import { PAY_METHODS, PayMethod, startPayment } from "../lib/payments";
import { totals, useStore } from "../store/useStore";

type F = { name: string; email: string; phone: string; address: string; city: string; postal: string; country: string; wallet: string; provider: string };
const empty: F = { name: "", email: "", phone: "", address: "", city: "", postal: "", country: "Pakistan", wallet: "", provider: "JazzCash" };

export default function Checkout() {
  useSeo("Checkout — NORDVALE", "Complete your Nordvale order.");
  const cart = useStore((s) => s.cart); const promo = useStore((s) => s.promo); const place = useStore((s) => s.placeOrder);
  const nav = useNavigate();
  const [f, setF] = useState<F>(empty); const [err, setErr] = useState<Partial<Record<keyof F, string>>>({});
  const [method, setMethod] = useState<PayMethod>("cod"); const [busy, setBusy] = useState(false);
  const t = totals(cart, promo);

  if (cart.length === 0) return (
    <main className="wrap py-32 text-center"><h1 className="text-[40px]">Your bag is empty</h1><Link to="/" className="btn btn-solid mt-8">Continue shopping</Link></main>
  );

  const validate = () => {
    const e: typeof err = {};
    if (f.name.trim().length < 2) e.name = "Enter your full name";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(f.email)) e.email = "Enter a valid email";
    if (!/^[+\d][\d\s-]{6,}$/.test(f.phone)) e.phone = "Enter a valid phone number";
    if (f.address.trim().length < 6) e.address = "Enter your street address";
    if (f.city.trim().length < 2) e.city = "Enter your city";
    if (f.postal.trim().length < 3) e.postal = "Enter a postal code";
    if (f.country.trim().length < 2) e.country = "Enter your country";
    if (method === "wallet" && !/^[+\d][\d\s-]{9,}$/.test(f.wallet)) e.wallet = "Enter your wallet number";
    setErr(e);
    return Object.keys(e).length === 0;
  };
  const submit = async (ev: FormEvent) => {
    ev.preventDefault();
    if (!validate()) { setTimeout(() => document.querySelector<HTMLElement>("[aria-invalid='true']")?.focus(), 50); return; }
    setBusy(true);
    await startPayment(method, t.total, { walletNumber: f.wallet, walletProvider: f.provider });
    const o = place({ method: PAY_METHODS.find((m) => m.id === method)!.title, email: f.email, name: f.name });
    nav(`/order-confirmation?id=${o.id}`);
  };
  const inp = (k: keyof F, label: string, extra: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <label className="block"><span className="eyebrow">{label}</span>
      <input className={`field ${err[k] ? "err" : ""}`} value={f[k]} aria-invalid={!!err[k]} onChange={(e) => setF({ ...f, [k]: e.target.value })} {...extra} />
      {err[k] && <span role="alert" className="block text-[12px] text-accent mt-1">{err[k]}</span>}</label>
  );

  return (
    <main className="wrap py-12 md:py-20">
      <h1 className="text-[clamp(32px,4vw,48px)] mb-2">Checkout</h1>
      <p className="text-[12px] text-stone mb-12">Demo checkout — no real payment is processed.</p>
      <form onSubmit={submit} noValidate className="grid lg:grid-cols-[1fr_440px] gap-14 lg:gap-24">
        <div className="space-y-14">
          <fieldset className="space-y-6"><legend className="text-[26px] mb-6">Shipping details</legend>
            {inp("name", "Full name", { autoComplete: "name" })}
            <div className="grid sm:grid-cols-2 gap-6">{inp("email", "Email", { type: "email", autoComplete: "email" })}{inp("phone", "Phone", { type: "tel", autoComplete: "tel" })}</div>
            {inp("address", "Street address", { autoComplete: "street-address" })}
            <div className="grid sm:grid-cols-3 gap-6">{inp("city", "City", { autoComplete: "address-level2" })}{inp("postal", "Postal code", { autoComplete: "postal-code" })}{inp("country", "Country", { autoComplete: "country-name" })}</div>
          </fieldset>

          <fieldset><legend className="text-[26px] mb-6">Payment</legend>
            <div className="space-y-3" role="radiogroup">
              {PAY_METHODS.map((m) => (
                <label key={m.id} className={`block border p-5 cursor-pointer transition-colors min-h-[64px] ${method === m.id ? "border-ink" : "hair hover:border-ink/50"}`}>
                  <span className="flex items-start gap-4">
                    <input type="radio" name="pay" className="mt-1 accent-ink w-4 h-4" checked={method === m.id} onChange={() => setMethod(m.id)} />
                    <span><span className="block text-[14px]">{m.title}</span><span className="block text-[12px] text-stone">{m.note}</span></span>
                  </span>
                  {method === m.id && m.id === "wallet" && (
                    <span className="block mt-5 pl-8 space-y-5">
                      <span className="flex gap-3">{["JazzCash", "Easypaisa"].map((p) => <button type="button" key={p} aria-pressed={f.provider === p} onClick={() => setF({ ...f, provider: p })} className={`min-h-[44px] px-5 text-[12px] border ${f.provider === p ? "bg-ink text-snow border-ink" : "hair"}`}>{p}</button>)}</span>
                      {inp("wallet", `${f.provider} number`, { type: "tel", placeholder: "03XX XXXXXXX" })}
                    </span>
                  )}
                  {method === m.id && m.id === "card" && <span className="block mt-4 ml-8 p-4 border border-dashed hair text-[12px] text-stone">{/* TODO(Stripe): mount <PaymentElement /> here. Card data goes straight to Stripe, never through this app. */}Stripe card field mounts here. Set VITE_STRIPE_PUBLISHABLE_KEY and see src/lib/payments.ts.</span>}
                  {method === m.id && m.id === "intl" && <span className="block mt-4 ml-8 p-4 border border-dashed hair text-[12px] text-stone">PayPal / Stripe buttons mount here. Set VITE_PAYPAL_CLIENT_ID and see src/lib/payments.ts.</span>}
                </label>
              ))}
            </div>
          </fieldset>
        </div>

        <aside className="lg:sticky lg:top-28 self-start" aria-label="Order summary">
          <h2 className="text-[26px] mb-2">Order summary</h2>
          <CartLines compact />
          <div className="space-y-5 pt-4 border-t hair"><ShipBar /><PromoField /><Summary />
            <button className="btn btn-solid w-full" type="submit" disabled={busy}>{busy ? "Placing order…" : method === "cod" ? `Place order · ${money(t.total)}` : `Pay ${money(t.total)}`}</button>
            <p className="text-[11px] text-stone text-center">By ordering you agree to our terms. Questions? {BRAND.email}</p>
          </div>
        </aside>
      </form>
    </main>
  );
}
