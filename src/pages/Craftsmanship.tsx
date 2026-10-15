import { useEffect, useId, useRef, useState } from "react";
import { Link } from "react-router-dom";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Icon } from "../components/Icons";
import { fabrics, Fabric } from "../data/content";
import { products } from "../data/products";
import { reducedMotion } from "../lib/env";
import { useSeo } from "../lib/seo";

gsap.registerPlugin(ScrollTrigger);

// brief names + filenames (public/assets/fabrics/fabric-<file>.webp). Missing files fall back to a procedural textile texture.
const META: Record<string, { title: string; file: string; tint: string; match: RegExp; care: string[]; tex: { f: string; o: number; t: "fractalNoise" | "turbulence"; d: number } }> = {
  fleece: { title: "Heavyweight Fleece", file: "fleece", tint: "#8d8782", match: /fleece/i, care: ["Wash cold, inside out", "Tumble dry low or line dry", "Skip fabric softener: it flattens the brushed pile"], tex: { f: "0.9", o: 4, t: "fractalNoise", d: 4 } },
  terry: { title: "French Terry", file: "french-terry", tint: "#b9b2a8", match: /terry/i, care: ["Machine wash at 30°C", "Dry flat to keep the loops even", "Iron on reverse, low heat"], tex: { f: "0.55", o: 3, t: "turbulence", d: 9 } },
  "faux-leather": { title: "Faux Leather", file: "faux-leather", tint: "#4a3a32", match: /leather/i, care: ["Wipe with a damp cloth", "Never tumble dry or iron", "Hang on a wide hanger, away from heat"], tex: { f: "0.09", o: 5, t: "fractalNoise", d: 14 } },
  wool: { title: "Wool & Tweed", file: "wool-tweed", tint: "#7a6f62", match: /wool|tweed/i, care: ["Dry clean or hand wash cool", "Air out between wears", "Steam, don't press, to restore the crease"], tex: { f: "0.5 0.75", o: 4, t: "fractalNoise", d: 7 } },
  linen: { title: "European Linen", file: "linen", tint: "#c9bda6", match: /linen/i, care: ["Wash at 30°C, gentle cycle", "Line dry: creases are part of the charm", "Iron damp for a crisp finish"], tex: { f: "0.012 0.8", o: 3, t: "fractalNoise", d: 10 } },
  "cotton-jersey": { title: "Cotton Jersey", file: "cotton-jersey", tint: "#d9d2c5", match: /jersey|cotton|knit/i, care: ["Wash at 30°C with similar colours", "Tumble dry low", "Fold, don't hang: it keeps the neckline true"], tex: { f: "0.7 0.04", o: 3, t: "fractalNoise", d: 3 } },
};

/** Procedural textile: SVG feTurbulence + displacement, tinted per fabric. Used only while the real macro photo is missing. */
function FabricTexture({ kind }: { kind: string }) {
  const id = useId().replace(/:/g, ""); const m = META[kind]; const t = m.tex;
  return (
    <svg className="absolute inset-0 w-full h-full" role="img" aria-label={`${m.title} texture`} preserveAspectRatio="xMidYMid slice">
      <filter id={id} x="0" y="0" width="100%" height="100%">
        <feTurbulence type={t.t} baseFrequency={t.f} numOctaves={t.o} seed="7" result="n" />
        <feDisplacementMap in="n" in2="n" scale={t.d} xChannelSelector="R" yChannelSelector="G" result="d" />
        <feColorMatrix in="d" type="matrix" values="0.33 0.33 0.33 0 0  0.33 0.33 0.33 0 0  0.33 0.33 0.33 0 0  0 0 0 0 1" result="g" />
        <feComponentTransfer in="g"><feFuncA type="table" tableValues="0.55 0.2" /></feComponentTransfer>
      </filter>
      <rect width="100%" height="100%" fill={m.tint} />
      <rect width="100%" height="100%" filter={`url(#${id})`} style={{ mixBlendMode: "multiply" }} />
    </svg>
  );
}

function FabricImage({ kind }: { kind: string }) {
  const [ok, setOk] = useState(true);
  const m = META[kind];
  return ok
    ? <img src={`${import.meta.env.BASE_URL}assets/fabrics/fabric-${m.file}.webp`} alt={`${m.title}, macro photograph of the cloth`} loading="lazy" decoding="async" draggable={false} onError={() => setOk(false)} className="absolute inset-0 w-full h-[116%] -top-[8%] object-cover will-change-transform" data-par />
    : <FabricTexture kind={kind} />;
}

function Counter({ to, suffix = "" }: { to: number; suffix?: string }) {
  const el = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const e = el.current; if (!e) return;
    if (reducedMotion()) { e.textContent = String(to); return; }
    const o = { v: 0 };
    const st = ScrollTrigger.create({ trigger: e, start: "top 90%", once: true, onEnter: () => gsap.to(o, { v: to, duration: 1.6, ease: "power3.out", onUpdate: () => { e.textContent = String(Math.round(o.v)); } }) });
    return () => st.kill();
  }, [to]);
  return <span ref={el} className="tabular-nums">0</span>;
}

function Row({ f, i }: { f: Fabric; i: number }) {
  const m = META[f.key]; const left = i % 2 === 0;
  const using = products.filter((p) => m.match.test(p.fabric.type)).slice(0, 5);
  return (
    <section className={`cf-row relative grid md:grid-cols-2 gap-8 md:gap-20 items-center ${left ? "" : "md:[&>*:first-child]:order-2"}`} aria-labelledby={`f-${f.key}`}>
      <div className="cf-img relative aspect-[4/5] overflow-hidden group bg-mist" data-side={left ? "left" : "right"}>
        <div className="absolute inset-0 transition-transform duration-[1400ms] ease-[cubic-bezier(.22,1,.36,1)] group-hover:scale-[1.06]"><FabricImage kind={f.key} /></div>
        <p className="absolute left-5 bottom-4 text-[10px] uppercase tracking-[0.26em] text-white/90 drop-shadow">{f.gsmRange}</p>
      </div>
      <div className="cf-txt" data-side={left ? "right" : "left"}>
        <p className="flex items-center gap-4 text-stone"><span className="text-[44px] md:text-[64px] leading-none text-ink/20" style={{ fontWeight: 200 }}>0{i + 1}</span><Icon name={f.icon} size={26} /></p>
        <h2 id={`f-${f.key}`} className="mt-5 text-[clamp(28px,3.6vw,46px)] tracking-[0.08em]" style={{ fontWeight: 200 }}>{m.title}</h2>
        <p className="mt-4 text-[15px] leading-relaxed text-ink/75 max-w-[460px]">{f.note}</p>
        <div className="mt-7 grid grid-cols-2 gap-6 max-w-[420px] border-t hair pt-6">
          <div><p className="eyebrow">Weight</p><p className="mt-1 text-[34px] leading-none" style={{ fontWeight: 200 }}><Counter to={f.gsmNum} /><span className="text-[13px] text-stone ml-1">GSM</span></p></div>
          <div><p className="eyebrow">Warmth</p><p className="mt-2 flex gap-1.5" aria-label={`Warmth ${f.warmth} of 5`}>{[1, 2, 3, 4, 5].map((n) => <span key={n} className={`h-[3px] w-7 ${n <= f.warmth ? "bg-wine" : "bg-ink/15"}`} />)}</p><p className="mt-2 text-[12px] text-stone">{f.feel}</p></div>
        </div>
        {using.length > 0 && (
          <div className="mt-7"><p className="eyebrow mb-3">Used in</p>
            <ul className="flex flex-wrap gap-2">{using.map((p) => <li key={p.slug}><Link to={`/product/${p.slug}`} className="inline-flex items-center min-h-[40px] px-4 rounded-full border hair text-[11px] uppercase tracking-[0.16em] hover:bg-ink hover:text-snow hover:border-ink transition-colors duration-300">{p.name}</Link></li>)}</ul>
          </div>
        )}
        <div className="mt-7"><p className="eyebrow mb-2">Care</p><ul className="text-[13px] text-ink/70 space-y-1">{m.care.map((c) => <li key={c} className="flex gap-2"><span className="text-wine">·</span>{c}</li>)}</ul></div>
      </div>
    </section>
  );
}

export default function Craftsmanship() {
  useSeo("Craftsmanship — NORDVALE", "Six fabrics, chosen for weight, warmth and how they age. How Nordvale cuts, stitches and sizes its clothes.");
  const root = useRef<HTMLDivElement>(null);
  const line = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const r = root.current; if (!r) return;
    const ctx = gsap.context(() => {
      if (reducedMotion()) { r.querySelectorAll<HTMLElement>(".cf-img, .cf-txt").forEach((e) => { e.style.opacity = "1"; e.style.transform = "none"; }); if (line.current) line.current.style.transform = "scaleY(1)"; return; }
      r.querySelectorAll<HTMLElement>(".cf-img, .cf-txt").forEach((e) => {
        const dir = e.dataset.side === "left" ? -1 : 1;
        gsap.fromTo(e, { opacity: 0, x: dir * 70 }, { opacity: 1, x: 0, duration: 1.1, ease: "power3.out", scrollTrigger: { trigger: e, start: "top 85%", once: true } });
      });
      r.querySelectorAll<HTMLElement>("[data-par]").forEach((img) => gsap.fromTo(img, { yPercent: -5 }, { yPercent: 5, ease: "none", scrollTrigger: { trigger: img.parentElement!.parentElement!, start: "top bottom", end: "bottom top", scrub: true } }));
      if (line.current) gsap.fromTo(line.current, { scaleY: 0 }, { scaleY: 1, ease: "none", scrollTrigger: { trigger: r.querySelector(".cf-list"), start: "top 60%", end: "bottom 70%", scrub: true } });
    }, r);
    return () => ctx.revert();
  }, []);

  return (
    <main ref={root}>
      <header className="wrap pt-14 md:pt-24 pb-16 md:pb-28 text-center">
        <p className="eyebrow">Craftsmanship</p>
        <h1 className="mt-5 text-[clamp(38px,8.5vw,120px)] tracking-[0.12em] leading-[0.95]" style={{ fontWeight: 200 }}>CLOTH WITH WEIGHT</h1>
        <p className="mt-7 mx-auto max-w-[520px] text-[15px] text-ink/70 leading-relaxed">Six fabrics, chosen for how they feel on day one and how they look on day one thousand. Everything we make starts here.</p>
        <span className="block mx-auto mt-10 w-px h-14 bg-ink/30" aria-hidden="true" />
      </header>

      <div className="cf-list wrap relative space-y-24 md:space-y-40 pb-24 md:pb-40">
        <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-px bg-ink/10 -translate-x-1/2" aria-hidden="true"><div ref={line} className="absolute inset-0 bg-wine origin-top" /></div>
        {fabrics.map((f, i) => <Row key={f.key} f={f} i={i} />)}
      </div>

      <section className="bg-mist py-20 md:py-32" aria-labelledby="cf-end">
        <div className="wrap grid md:grid-cols-3 gap-10 md:gap-16">
          <div className="md:col-span-3 max-w-[640px]"><p className="eyebrow">The finish</p><h2 id="cf-end" className="mt-4 text-[clamp(28px,4vw,52px)] tracking-[0.08em]" style={{ fontWeight: 200 }}>Stitched to be kept.</h2></div>
          {[
            ["needle", "Stitching", "Double-needle seams, bartacked stress points and reinforced shoulders. Every seam is built to survive years of washing."],
            ["ruler", "Sizing", "A size chart for every category, true-to-size fits and free exchanges on the first swap. Oversized styles say so on the page."],
            ["leaf", "Sustainability", "Organic and recycled fibres, vegan leather, water-based dyes and small runs to keep waste low. Fewer pieces, made properly."],
          ].map(([ic, t, d]) => (
            <div key={t} className="border-t hair pt-6"><Icon name={ic} size={26} /><h3 className="mt-5 text-[20px] tracking-[0.12em] uppercase" style={{ fontWeight: 300 }}>{t}</h3><p className="mt-3 text-[14px] text-ink/70 leading-relaxed">{d}</p></div>
          ))}
          <div className="md:col-span-3 pt-4"><Link to="/#collection" className="btn btn-solid">Shop the collection</Link></div>
        </div>
      </section>
    </main>
  );
}
