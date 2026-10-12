import { FormEvent, useState } from "react";
import { AnimatePresence, m } from "framer-motion";
import { Link } from "react-router-dom";
import { BRAND, money } from "../config/assets";
import { Icon, Stars } from "../components/Icons";
import { ProductImage } from "../components/ProductImage";
import { SectionHead } from "../components/ui";
import { faqs } from "../data/content";
import { CATEGORIES, Category, SIZE_CHARTS } from "../data/products";
import { getProduct } from "../data/products";
import { useStore } from "../store/useStore";

export function RecentlyViewed() {
  const recent = useStore((s) => s.recent); const set = useStore((s) => s.set);
  const items = recent.map(getProduct).filter(Boolean) as NonNullable<ReturnType<typeof getProduct>>[];
  if (!items.length) return null;
  return (
    <section className="py-16 wrap border-t hair" aria-label="Recently viewed">
      <p className="eyebrow mb-6">Recently viewed</p>
      <div className="flex gap-4 overflow-x-auto no-scrollbar -mx-5 px-5 md:mx-0 md:px-0">
        {items.map((p) => (
          <button key={p.slug} className="shrink-0 w-32 md:w-40 text-left group" onClick={() => set({ openProduct: p.slug })}>
            <div className="aspect-[3/4] relative overflow-hidden"><ProductImage product={p} colorId={p.colors[0].id} className="absolute inset-0" /></div>
            <p className="font-display text-[17px] mt-2">{p.name}</p><p className="text-[12px] text-stone">{money(p.salePrice ?? p.price)}</p>
          </button>
        ))}
      </div>
    </section>
  );
}

export function Faq() {
  const [open, setOpen] = useState<number | null>(0);
  const [guide, setGuide] = useState<Category>("hoodies");
  const chart = SIZE_CHARTS[guide];
  return (
    <section id="faq" className="py-24 md:py-36 wrap grid lg:grid-cols-2 gap-16">
      <div>
        <SectionHead eyebrow="FAQ" title={<>Good <em>questions.</em></>} />
        <div className="border-t hair">
          {faqs.map((f, i) => (
            <div key={f.q} className="border-b hair">
              <h3><button className="w-full flex justify-between items-center gap-6 text-left min-h-[60px] font-display text-[20px]" aria-expanded={open === i} aria-controls={`faq-${i}`} onClick={() => setOpen(open === i ? null : i)}>
                {f.q}<Icon name={open === i ? "minus" : "plus"} size={18} className="shrink-0" /></button></h3>
              <AnimatePresence initial={false}>
                {open === i && <m.div id={`faq-${i}`} initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.35 }} className="overflow-hidden"><p className="pb-6 text-[14px] text-ink/65 max-w-md">{f.a}</p></m.div>}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </div>
      <div id="size-guide">
        <SectionHead eyebrow="Size Guide" title={<>Find your <em>fit.</em></>} />
        <div className="flex gap-1 border-b hair mb-2" role="tablist" aria-label="Size guide category">
          {CATEGORIES.map((c) => <button key={c.id} role="tab" aria-selected={guide === c.id} onClick={() => setGuide(c.id)} className={`min-h-[44px] px-4 text-[11px] uppercase tracking-[0.16em] border-b -mb-px transition-colors ${guide === c.id ? "border-ink text-ink" : "border-transparent text-stone hover:text-ink"}`}>{c.label}</button>)}
        </div>
        <div className="overflow-x-auto -mx-5 px-5 md:mx-0 md:px-0">
          <table className="w-full text-[13px] text-center min-w-[360px]">
            <caption className="sr-only">{chart.title} measurements in centimetres</caption>
            <thead><tr className="text-stone text-[11px] uppercase tracking-[0.16em]">{chart.head.map((h, i) => <th key={h} scope="col" className={`py-3 font-light ${i === 0 ? "text-left" : ""}`}>{h}{i > 0 && guide !== "trousers" ? " (cm)" : ""}</th>)}</tr></thead>
            <tbody>{chart.rows.map((r) => <tr key={r[0]} className="border-t hair">{r.map((cell, i) => i === 0 ? <th key={i} scope="row" className="py-4 text-left font-light">{cell}</th> : <td key={i}>{cell}</td>)}</tr>)}</tbody>
          </table>
        </div>
        <p className="text-[12px] text-stone mt-6 max-w-sm">{chart.note}</p>
        <div className="mt-8 grid grid-cols-2 gap-4 text-[12px] text-stone">
          <div className="border hair p-4 flex gap-3"><Icon name="truck" size={22} />Free shipping over $150. 2–4 days domestic.</div>
          <div className="border hair p-4 flex gap-3"><Icon name="return" size={22} />30-day returns. First exchange free.</div>
        </div>
      </div>
    </section>
  );
}

const emailOk = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);

export function Newsletter() {
  const [email, setEmail] = useState(""); const [state, setState] = useState<"idle" | "err" | "ok">("idle");
  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!emailOk(email)) return setState("err");
    // TODO: POST to your email provider (Mailchimp / Klaviyo / Resend) via a serverless function. Env: VITE_NEWSLETTER_ENDPOINT
    setState("ok");
  };
  return (
    <section className="py-24 md:py-32 theme-red text-ink">
      <div className="wrap max-w-2xl text-center">
        <p className="eyebrow !text-ink/50">Newsletter</p>
        <h2 className="mt-4 text-[clamp(28px,4vw,44px)]">Join the first frost.</h2>
        <p className="text-[14px] text-ink/60 mt-4">New drops, restocks and 10% off your first order.</p>
        {state === "ok" ? <p className="mt-10 font-display text-[22px]" role="status">Thank you. Check your inbox for WINTER10.</p> : (
          <form className="mt-10 flex flex-col sm:flex-row gap-4 items-end" onSubmit={submit} noValidate>
            <label className="flex-1 w-full text-left"><span className="sr-only">Email address</span>
              <input type="email" autoComplete="email" placeholder="Your email" value={email} onChange={(e) => { setEmail(e.target.value); setState("idle"); }} aria-invalid={state === "err"} className={`field !text-ink placeholder:text-ink/40 !border-ink/30 focus:!border-ink ${state === "err" ? "!border-accent" : ""}`} /></label>
            <button className="btn !border-ink text-ink hover:bg-ink hover:text-snow w-full sm:w-auto" type="submit">Subscribe</button>
          </form>
        )}
        {state === "err" && <p role="alert" className="text-[12px] text-accent mt-3">Please enter a valid email.</p>}
      </div>
    </section>
  );
}

export function Contact() {
  const [f, setF] = useState({ name: "", email: "", msg: "" }); const [err, setErr] = useState<Record<string, string>>({}); const [sent, setSent] = useState(false);
  const submit = (e: FormEvent) => {
    e.preventDefault();
    const er: Record<string, string> = {};
    if (f.name.trim().length < 2) er.name = "Please enter your name.";
    if (!emailOk(f.email)) er.email = "Please enter a valid email.";
    if (f.msg.trim().length < 10) er.msg = "Message should be at least 10 characters.";
    setErr(er);
    // TODO: send via your backend / Formspree / Resend. Env: VITE_CONTACT_ENDPOINT
    if (!Object.keys(er).length) setSent(true);
  };
  const L = ({ k, label, children }: { k: string; label: string; children: React.ReactNode }) => <label className="block"><span className="eyebrow">{label}</span>{children}{err[k] && <span role="alert" className="block text-[12px] text-accent mt-1">{err[k]}</span>}</label>;
  const ln = "flex items-center gap-4 min-h-[48px] link-u w-fit";
  return (
    <section id="contact" className="py-24 md:py-36 wrap grid lg:grid-cols-2 gap-16">
      <div>
        <SectionHead eyebrow="Contact" title={<>Say <em>hello.</em></>} />
        <ul className="space-y-1 text-[14px]">
          <li><a className={ln} href={`mailto:${BRAND.email}`}><Icon name="user" size={18} />{BRAND.email}</a></li>
          <li><a className={ln} href={`tel:${BRAND.phone.replace(/\s/g, "")}`}><Icon name="truck" size={18} />{BRAND.phone}</a></li>
          <li><a className={ln} href={`https://wa.me/${BRAND.whatsapp}`} target="_blank" rel="noopener noreferrer"><Icon name="whatsapp" size={18} />Chat on WhatsApp</a></li>
          <li><a className={ln} href="https://instagram.com" target="_blank" rel="noopener noreferrer"><Icon name="instagram" size={18} />@nordvale</a></li>
        </ul>
        <a href={`https://www.google.com/maps/search/${encodeURIComponent(BRAND.address)}`} target="_blank" rel="noopener noreferrer" className="mt-10 block relative h-52 border hair overflow-hidden group" aria-label={`Open map: ${BRAND.address}`}
          style={{ background: "repeating-linear-gradient(0deg,rgb(var(--c-ink) / 0.07) 0 1px,transparent 1px 34px),repeating-linear-gradient(90deg,rgb(var(--c-ink) / 0.07) 0 1px,transparent 1px 34px),rgb(var(--c-mist))" }}>
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2"><Icon name="pin" size={30} className="text-accent group-hover:-translate-y-1 transition-transform" /><span className="text-[13px]">{BRAND.address}</span><span className="eyebrow">Open in Maps</span></div>
        </a>
      </div>
      <form onSubmit={submit} noValidate className="space-y-7 self-end">
        {sent ? <p className="font-display text-[26px]" role="status">Thank you — we'll reply within one working day.</p> : <>
          <L k="name" label="Name"><input className={`field ${err.name ? "err" : ""}`} autoComplete="name" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></L>
          <L k="email" label="Email"><input type="email" className={`field ${err.email ? "err" : ""}`} autoComplete="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></L>
          <L k="msg" label="Message"><textarea rows={4} className={`field resize-none ${err.msg ? "err" : ""}`} value={f.msg} onChange={(e) => setF({ ...f, msg: e.target.value })} /></L>
          <button className="btn btn-solid w-full sm:w-auto" type="submit">Send message</button></>}
      </form>
    </section>
  );
}
