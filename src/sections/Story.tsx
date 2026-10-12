import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { P } from "../config/assets";
import { ProductImage } from "../components/ProductImage";
import { getHeroProduct, products } from "../data/products";
import { Icon } from "../components/Icons";
import SmartImg from "../components/SmartImg";
import { Reveal, SectionHead } from "../components/ui";
import { fabrics, storyLines, whyUs } from "../data/content";
import { perfLite, reducedMotion } from "../lib/env";

// Counter text is written at most every 90 ms (a textContent write per frame forces layout + paint: it cost ~6 ms/frame while scrolling)
const writer = (el: HTMLElement) => { let last = 0; return (v: number, force = false) => { const n = performance.now(); if (force || n - last > 90) { el.textContent = String(Math.round(v)); last = n; } }; };

// GSAP setup runs in its own short task right after the section mounts (the section is below the fold, so nothing flashes)
const deferSetup = (setup: () => (() => void) | void) => { let c: (() => void) | void; const id = setTimeout(() => { c = setup(); }, 40); return () => { clearTimeout(id); if (c) c(); }; };

gsap.registerPlugin(ScrollTrigger);

/* ───────────────────────── Brand story ─────────────────────────
   Text on the left (lines reveal one by one, scrubbed, with a thin line and counters),
   image on the right (slides in from the right with fade + slight scale, then drifts with parallax).
   Uses /assets/images/story.webp; without it, the featured product photo is shown instead. */
const { product: HERO, color: HERO_COLOR } = getHeroProduct();
const STATS = [
  { to: new Date().getFullYear() - 2019, label: "Years of craft" },
  { to: products.length, label: "Pieces" },
  { to: products.reduce((n, p) => n + p.colors.length, 0), label: "Colourways" },
];

export function Story() {
  const root = useRef<HTMLElement>(null);
  useEffect(() => deferSetup(() => {
    const reduced = reducedMotion(), lite = perfLite();
    const ctx = gsap.context(() => {
      const counters = gsap.utils.toArray<HTMLElement>(".st-count");
      if (reduced) return;
      counters.forEach((el) => { el.textContent = "0"; });
      gsap.fromTo(".st-line", { yPercent: 115, opacity: 0 }, { yPercent: 0, opacity: 1, ease: "none", stagger: 0.28, scrollTrigger: { trigger: ".st-text", start: "top 78%", end: "bottom 48%", scrub: 0.8 } });
      gsap.fromTo(".st-sub", { opacity: 0, y: 20 }, { opacity: 1, y: 0, ease: "none", scrollTrigger: { trigger: ".st-sub", start: "top 92%", end: "top 70%", scrub: 0.8 } });
      gsap.fromTo(".st-img", { xPercent: 18, opacity: 0, scale: 1.08 }, { xPercent: 0, opacity: 1, scale: 1, ease: "none", scrollTrigger: { trigger: ".st-imgwrap", start: "top 92%", end: "top 38%", scrub: 0.9 } });
      if (!lite) gsap.fromTo(".st-par", { yPercent: -6 }, { yPercent: 6, ease: "none", scrollTrigger: { trigger: ".st-imgwrap", start: "top bottom", end: "bottom top", scrub: true } });
      // thin lines draw as you scroll
      gsap.fromTo(".st-vline", { scaleY: 0 }, { scaleY: 1, ease: "none", scrollTrigger: { trigger: root.current, start: "top 70%", end: "bottom 60%", scrub: 0.6 } });
      gsap.fromTo(".st-hline", { scaleX: 0 }, { scaleX: 1, ease: "power2.out", duration: 1.4, scrollTrigger: { trigger: ".st-stats", start: "top 88%" } });
      // counters
      counters.forEach((el) => {
        const o = { v: 0 }, to = Number(el.dataset.to);
        const w = writer(el);
        gsap.to(o, { v: to, duration: 1.8, ease: "power2.out", scrollTrigger: { trigger: ".st-stats", start: "top 88%" }, onUpdate: () => w(o.v), onComplete: () => w(to, true) });
      });
    }, root);
    return () => ctx.revert();
  }), []);

  return (
    <section ref={root} id="story" className="relative py-28 md:py-44 wrap grid md:grid-cols-12 gap-12 md:gap-16 items-center">
      <div className="st-vline hidden md:block absolute left-0 top-28 bottom-28 w-px bg-ink/15 origin-top" aria-hidden="true" />
      <div className="st-text md:col-span-6 md:pl-10">
        <p className="eyebrow mb-8">Our Story</p>
        <h2 className="font-display font-light text-[clamp(26px,3.3vw,46px)] leading-[1.2]" aria-label={storyLines.join(" ")}>
          {storyLines.map((l) => (
            <span key={l} className="block overflow-hidden pb-[0.12em]" aria-hidden="true"><span className="st-line block">{l}</span></span>
          ))}
        </h2>
        <p className="st-sub mt-10 max-w-md text-[14px] text-ink/70">Nordvale began with a single sample, cut from a fleece so dense it held its shape on the hanger. Sixteen pieces later, across hoodies, jackets, trousers and tees, we still design around one idea: quality you can feel, craft you can see.</p>
        <div className="st-stats mt-12 max-w-md">
          <div className="st-hline h-px bg-ink/30 origin-left" />
          <dl className="grid grid-cols-3 gap-4 pt-6">
            {STATS.map((s) => (
              <div key={s.label}>
                <dd className="font-display text-[clamp(34px,4vw,52px)] leading-none tabular-nums"><span className="st-count inline-block" style={{ contain: "layout paint", minWidth: `${String(s.to).length}ch` }} data-to={s.to}>{s.to}</span></dd>
                <dt className="eyebrow mt-2">{s.label}</dt>
              </div>
            ))}
          </dl>
        </div>
      </div>
      <div className="st-imgwrap md:col-span-6">
        <div className="st-img">
          <figure className="relative aspect-[4/5] overflow-hidden">
            <div className="st-par absolute inset-x-0 -top-[6%] h-[112%]">
              <SmartImg src={P.story} alt="The model wearing the Nordvale Nordic Drift hoodie in a plain light studio" eager className="absolute inset-0"
                fallback={<ProductImage product={HERO} colorId={HERO_COLOR.id} variant="detail" className="absolute inset-0" />} />
            </div>
          </figure>
        </div>
      </div>
    </section>
  );
}

/* ───────────────────────── Fabric & craftsmanship ───────────────────────── */
function FabricFallback({ k }: { k: string }) {
  const bg: Record<string, string> = {
    fleece: "repeating-linear-gradient(135deg, rgba(255,255,255,.06) 0 2px, transparent 2px 6px), linear-gradient(160deg,#6f6c68,#3d3b39)",
    "brushed-cotton": "repeating-linear-gradient(90deg, rgba(255,255,255,.08) 0 1px, transparent 1px 4px), linear-gradient(160deg,#cdbfae,#8d8070)",
    terry: "radial-gradient(circle, rgba(0,0,0,.09) 1.6px, transparent 2.2px) 0 0/11px 11px, linear-gradient(#dcd6ca,#b9b1a2)",
    "faux-leather": "radial-gradient(ellipse at 30% 25%, rgba(255,255,255,.22), transparent 45%), repeating-linear-gradient(60deg, rgba(0,0,0,.08) 0 1px, transparent 1px 7px), linear-gradient(150deg,#4a2f24,#1c1210)",
    wool: "repeating-linear-gradient(45deg, rgba(255,255,255,.08) 0 2px, transparent 2px 8px), repeating-linear-gradient(-45deg, rgba(0,0,0,.14) 0 2px, transparent 2px 8px), linear-gradient(#8d8d90,#5f5f63)",
    linen: "repeating-linear-gradient(90deg, rgba(255,255,255,.18) 0 1px, transparent 1px 5px), repeating-linear-gradient(0deg, rgba(0,0,0,.05) 0 1px, transparent 1px 6px), linear-gradient(160deg,#e3d7bd,#c3b393)",
    "cotton-jersey": "repeating-linear-gradient(90deg, rgba(0,0,0,.05) 0 1px, transparent 1px 3px), linear-gradient(160deg,#ece7dc,#cfc8b8)",
    knit: "radial-gradient(circle at 50% 50%, rgba(0,0,0,.10) 2px, transparent 3px) 0 0/10px 10px, linear-gradient(160deg,#b88a56,#8a6338)",
  };
  return <div className="absolute inset-0" style={{ background: bg[k] ?? "#999" }} />;
}

export function Craft() {
  const root = useRef<HTMLElement>(null);
  const measureRef = useRef<() => void>(() => {});
  useEffect(() => deferSetup(() => {
    const reduced = reducedMotion(), lite = perfLite();
    const ctx = gsap.context(() => {
      const rows = gsap.utils.toArray<HTMLElement>(".cf-row");
      if (reduced) return;
      const q = (row: HTMLElement, s: string) => row.querySelector<HTMLElement>(s)!;
      // initial (hidden) states, set once
      rows.forEach((row, i) => {
        const dir = i % 2 === 0 ? -1 : 1; // even rows: image on the left, slides in from the left
        gsap.set(q(row, ".cf-fig"), { xPercent: dir * 14, opacity: 0 });
        gsap.set(q(row, ".cf-txt"), { xPercent: -dir * 8, opacity: 0 });
        gsap.set(q(row, ".cf-dot"), { scale: 0 });
        gsap.set(row.querySelectorAll(".cf-bar"), { scaleX: 0 });
        q(row, ".cf-gsm").textContent = "0"; q(row, ".cf-warm").textContent = "0";
      });
      // ONE batched trigger for all rows' entrances (instead of one trigger per row)
      ScrollTrigger.batch(rows, {
        start: "top 80%", once: true, interval: 0.1,
        onEnter: (batch) => batch.forEach((row) => {
          const i = rows.indexOf(row as HTMLElement);
          const gsm = q(row as HTMLElement, ".cf-gsm"), warm = q(row as HTMLElement, ".cf-warm");
          const o = { g: 0, w: 0 }, wg = writer(gsm), ww = writer(warm);
          gsap.timeline()
            .to(q(row as HTMLElement, ".cf-fig"), { xPercent: 0, opacity: 1, duration: 1.2, ease: "power3.out", clearProps: "transform,opacity" }) // clearProps: the layer is released once it has landed
            .to(q(row as HTMLElement, ".cf-txt"), { xPercent: 0, opacity: 1, duration: 1.1, ease: "power3.out", clearProps: "transform,opacity" }, 0.12)
            .to(q(row as HTMLElement, ".cf-dot"), { scale: 1, duration: 0.5, ease: "back.out(2.4)", clearProps: "transform" }, 0.1)
            .to(o, { g: Number(gsm.dataset.to), w: Number(warm.dataset.to), duration: 1.8, ease: "power2.out", onUpdate: () => { wg(o.g); ww(o.w); }, onComplete: () => { wg(o.g, true); ww(o.w, true); } }, 0.35)
            .to((row as HTMLElement).querySelectorAll(".cf-bar"), { scaleX: 1, duration: 0.5, stagger: 0.12, ease: "power2.out", clearProps: "transform" }, 0.6);
          void i;
        }),
      });
      gsap.fromTo(".cf-line", { scaleY: 0 }, { scaleY: 1, ease: "none", scrollTrigger: { trigger: ".cf-list", start: "top 65%", end: "bottom 70%", scrub: 0.6 } });
      // ONE trigger for all parallax layers: positions are cached on refresh, so scrolling reads no layout
      if (!lite) {
        const items = rows.map((row) => { const el = q(row, ".cf-par"); gsap.set(el, { force3D: true }); return { row, el, set: gsap.quickSetter(el, "yPercent") as (v: number) => void, top: 0, h: 0 }; });
        const measure = () => items.forEach((it) => { const r = it.row.getBoundingClientRect(); it.top = r.top + window.scrollY; it.h = r.height; });
        measureRef.current = measure; measure(); ScrollTrigger.addEventListener("refresh", measure);
        ScrollTrigger.create({ trigger: ".cf-list", start: "top bottom", end: "bottom top", onUpdate: () => {
          if (document.documentElement.dataset.lite) { for (const it of items) it.set(0); return; } // LITE mode (FPS monitor): no parallax
          const y = window.scrollY, vh = window.innerHeight;
          for (const it of items) { if (it.top > y + vh || it.top + it.h < y) continue; it.set(((y + vh - it.top) / (vh + it.h) * 2 - 1) * 7); }
        } });
      }
    }, root);
    return () => { ScrollTrigger.removeEventListener("refresh", measureRef.current); ctx.revert(); };
  }), []);

  return (
    <section ref={root} id="craft" className="py-24 md:py-36 bg-ink text-snow overflow-hidden">
      <div className="wrap">
        <SectionHead eyebrow="Fabric & Craftsmanship" title={<>Cloth with <em>real weight.</em></>} />
        <div className="cf-list relative pl-8 md:pl-0 space-y-16 md:space-y-28">
          {/* thin line connecting the items; draws as you scroll */}
          <div className="absolute top-0 bottom-0 left-[3px] md:left-1/2 w-px bg-snow/10" aria-hidden="true">
            <div className="cf-line absolute inset-0 bg-snow/50 origin-top" />
          </div>
          {fabrics.map((f, i) => {
            const left = i % 2 === 0;
            return (
              <article key={f.key} className="cf-row relative grid md:grid-cols-12 gap-8 md:gap-12 items-center">
                <span className="cf-dot absolute -left-[33px] md:left-1/2 -top-6 md:-top-14 w-[7px] h-[7px] -ml-[0px] md:-ml-[3px] rounded-full bg-snow z-20" aria-hidden="true" />
                <figure className={`cf-fig group md:col-span-7 ${left ? "" : "md:col-start-6 md:order-2"}`}>
                  <div className="relative aspect-square overflow-hidden bg-snow/5">
                    <div className="cf-par absolute inset-x-0 -top-[8%] h-[116%]">
                      <SmartImg src={P.fabric(f.key)} alt={`Macro close-up of ${f.name} fabric`} className="absolute inset-0" imgClass="transition-transform duration-[1400ms] ease-out group-hover:scale-[1.07]" fallback={<FabricFallback k={f.key} />} />
                    </div>
                    <figcaption className="absolute bottom-4 left-4 eyebrow !text-snow/70 pointer-events-none">{f.gsmRange}</figcaption>
                  </div>
                </figure>
                <div className={`cf-txt md:col-span-5 ${left ? "md:col-start-8" : "md:col-start-1 md:order-1"}`}>
                  <div className="flex items-center gap-4 text-snow/60">
                    <span className="font-display text-[56px] md:text-[72px] font-light leading-none text-snow/25">{String(i + 1).padStart(2, "0")}</span>
                    <Icon name={f.icon} size={34} sw={0.8} />
                  </div>
                  <h3 className="text-[clamp(28px,3vw,38px)] leading-tight mt-4">{f.name}</h3>
                  <p className="text-[13px] text-snow/60 mt-4 leading-relaxed max-w-sm">{f.note}</p>
                  <dl className="mt-8 grid grid-cols-2 gap-6 border-t border-snow/15 pt-6">
                    <div>
                      <dt className="eyebrow !text-snow/45">Weight</dt>
                      <dd className="mt-2 font-display text-[40px] leading-none tabular-nums"><span className="cf-gsm inline-block" style={{ contain: "layout paint", minWidth: `${String(f.gsmNum).length}ch` }} data-to={f.gsmNum}>{f.gsmNum}</span><span className="text-[13px] font-sans text-snow/50 ml-1">GSM</span></dd>
                    </div>
                    <div>
                      <dt className="eyebrow !text-snow/45">Warmth</dt>
                      <dd className="mt-2">
                        <span className="font-display text-[40px] leading-none tabular-nums"><span className="cf-warm inline-block" style={{ contain: "layout paint", minWidth: "1ch" }} data-to={f.warmth}>{f.warmth}</span><span className="text-[13px] font-sans text-snow/50 ml-1">/ 5</span></span>
                        <span className="flex gap-1 mt-3" aria-hidden="true">{[1, 2, 3, 4, 5].map((n) => <span key={n} className="relative w-5 h-[2px] bg-snow/20 overflow-hidden"><span className={`cf-bar absolute inset-0 origin-left bg-snow ${n <= f.warmth ? "" : "hidden"}`} /></span>)}</span>
                      </dd>
                    </div>
                  </dl>
                  <p className="mt-6 text-[12px] text-snow/50"><span className="text-snow/80">{f.feel}</span> · Best for {f.bestFor.toLowerCase()}</p>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export function WhyUs() {
  return (
    <section id="why" className="py-24 md:py-36 wrap">
      <SectionHead eyebrow="Why Nordvale" title={<>Made to be <em>kept.</em></>} />
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-x-10 gap-y-14">
        {whyUs.map((w, i) => (
          <Reveal key={w.title} delay={i * 0.08}>
            <Icon name={w.icon} size={32} sw={0.8} className="text-accent" />
            <h3 className="text-[24px] mt-5">{w.title}</h3>
            <p className="text-[13px] text-ink/65 mt-3 leading-relaxed">{w.text}</p>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
