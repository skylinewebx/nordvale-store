import { useCallback, useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { BRAND, money, P } from "../config/assets";
import { effectivePrice, getHeroProduct } from "../data/products";
import { isMobile, reducedMotion, veryLowEnd } from "../lib/env";
import { useStore } from "../store/useStore";
import { assetExists, heroProgress, useHero } from "./heroState";
import HeroFX from "./HeroFX";
import { HeroStatic, HeroVideo } from "./HeroMedia";

import HeroPlaceholder from "./HeroPlaceholder";

type Mode = "video" | "static" | "webgl";
const isIOS = () => /iP(hone|ad|od)/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
const saveData = () => !!(navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData;

// The featured product comes from ONE place: the `heroFeatured` flag in src/data/products.ts.
const { product: HERO, color: HERO_COLOR } = getHeroProduct();

export default function Hero() {
  const root = useRef<HTMLElement>(null);
  const [mode, setMode] = useState<Mode | null>(null);
  const [hasStatic, setHasStatic] = useState(false);
  const [visible, setVisible] = useState(true);
  const reduced = reducedMotion();
  const entered = useHero((s) => s.entered);
  const set = useStore((s) => s.set); const pick = useStore((s) => s.pickColor);

  const shop = (colorId = HERO_COLOR.id) => { pick(HERO.slug, colorId); set({ openProduct: HERO.slug }); };

  // Pick the best available hero once.
  //   video  → desktop + Android (smooth scrub)        static → iOS, low-end, save-data, reduced motion
  //   webgl  → built-in procedural SVG hoodie (no WebGL / no 3D library), used only while the real assets don't exist yet
  useEffect(() => {
    (async () => {
      const q = new URLSearchParams(location.search).get("hero");
      const [vid, stat] = await Promise.all([assetExists(P.heroVideo), assetExists(P.heroStatic)]);
      setHasStatic(stat);
      const lite = reduced || veryLowEnd() || isIOS() || saveData();
      let m: Mode = "webgl";
      if (q === "3d") m = "webgl";
      else if (q === "static" && stat) m = "static";
      else if (vid && !(lite && stat)) m = "video";
      else if (stat) m = "static";
      useHero.getState().setMode(m === "video" ? "frames" : m === "webgl" ? "webgl" : "static");
      setMode(m);
    })();
  }, [reduced]);

  // Hidden until the loader has left, then a staggered entrance.
  useEffect(() => {
    const q = gsap.utils.selector(root);
    const items = q(".hero-enter");
    if (reduced) { gsap.set(items, { opacity: 1, y: 0 }); gsap.set(q(".hero-mask > span"), { yPercent: 0 }); return; }
    if (!entered) { gsap.set(items, { opacity: 0, y: 18 }); gsap.set(q(".hero-mask > span"), { yPercent: 110 }); return; }
    const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
    tl.to(q(".hero-intro .hero-mask > span"), { yPercent: 0, duration: 1.1, stagger: 0.12 }, 0.1)
      .to(items, { opacity: 1, y: 0, duration: 1, stagger: 0.12 }, 0.2);
    return () => { tl.kill(); };
  }, [entered, reduced]);

  // Pin + scrub timeline: drives heroProgress (read by video / static / webgl each frame) and every overlay.
  useEffect(() => {
    if (!mode || !root.current) return;
    const q = gsap.utils.selector(root);
    if (reduced) {
      heroProgress.v = 1;
      gsap.set(q(".hero-intro"), { opacity: 0 });
      gsap.set(q(".hero-outro-line"), { yPercent: 0, opacity: 1 });
      gsap.set(q(".hero-outro"), { pointerEvents: "auto" });
      return;
    }
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: { trigger: root.current, start: "top top", end: "bottom bottom", scrub: 0.8 }, // position: sticky (below), not pin: no fixed↔absolute swaps, no layout shift
      });
      tl.to(heroProgress, { v: 1, duration: 1, ease: "power1.inOut" }, 0)
        // giant outlined word drifts sideways (parallax) and rises slightly
        .fromTo(".hero-word", { xPercent: 7, yPercent: 4 }, { xPercent: -9, yPercent: -3, duration: 1 }, 0)
        // intro copy and the hint leave early
        .to(".hero-intro", { opacity: 0, y: -26, duration: 0.14 }, 0.05)
        .to(".hero-hint", { opacity: 0, y: 10, duration: 0.08 }, 0.02)
        // thin progress line
        .fromTo(".hero-progress", { scaleY: 0 }, { scaleY: 1, duration: 1 }, 0)
        // soft glow pulse at the moment the pieces lock together
        .fromTo(".hero-glow", { opacity: 0, scale: 0.6 }, { opacity: 0.95, scale: 1.12, duration: 0.07, ease: "power2.out" }, 0.74)
        .to(".hero-glow", { opacity: 0.22, scale: 1, duration: 0.16, ease: "power2.inOut" }, 0.81)
        // brand reveals line by line
        .fromTo(".hero-outro-line", { yPercent: 115, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.09, stagger: 0.03, ease: "power3.out" }, 0.84)
        .set(".hero-outro", { pointerEvents: "auto" }, 0.9);
    }, root);
    return () => { ctx.revert(); heroProgress.v = 0; };
  }, [mode, reduced]);

  // Pause work when the hero is off-screen.
  useEffect(() => {
    if (!root.current) return;
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { rootMargin: "100px" });
    io.observe(root.current);
    return () => io.disconnect();
  }, []);

  const fallback = useCallback(() => { if (hasStatic) { useHero.getState().setMode("static"); setMode("static"); } }, [hasStatic]);
  const price = effectivePrice(HERO);

  return (
    <section ref={root} id="top" className="relative w-full bg-snow" style={{ height: `${100 + (isMobile() ? 260 : 320)}svh` }} aria-label={`Featured: ${HERO.name}`}>
      <div className="sticky top-0 h-[100svh] w-full overflow-hidden">
      <div className="absolute inset-0" style={{ background: mode === "webgl" ? "radial-gradient(ellipse at 50% 42%, #fbfaf7 0%, #e9e5de 62%, #d9d4cb 100%)" : "#f4f2ee" }} />

      {/* thin outlined giant word (parallax) */}
      <div className="hero-word absolute inset-x-0 top-[24%] md:top-[18%] flex justify-center pointer-events-none select-none" aria-hidden="true">
        <svg viewBox="0 0 1800 330" className="w-[250vw] md:w-[135vw] max-w-none shrink-0" fill="none">
          <text x="900" y="250" textAnchor="middle" fontFamily="Cormorant Garamond, serif" fontWeight="300" fontSize="300" letterSpacing="22" stroke="#1c1c1e" strokeOpacity="0.14" strokeWidth="1.3">{HERO.name.toUpperCase()}</text>
        </svg>
      </div>

      <HeroFX active={visible} />

      {/* glow pulse when the hoodie locks together */}
      <div className="hero-glow absolute left-1/2 top-[46%] w-[min(90vw,780px)] aspect-square -translate-x-1/2 -translate-y-1/2 rounded-full pointer-events-none opacity-0" style={{ background: "radial-gradient(circle, rgba(255,255,255,0.95) 0%, rgba(255,246,232,0.55) 30%, rgba(255,255,255,0) 68%)" }} aria-hidden="true" />

      <div className="absolute inset-x-0 top-0 bottom-[27%] md:bottom-[22%] pt-14 md:pt-16">
        {mode === "video" && <HeroVideo active={visible} onError={fallback} />}
        {mode === "static" && <HeroStatic active={visible} />}
        {mode === "webgl" && <HeroPlaceholder active={visible} color={HERO_COLOR.hex} />}
      </div>

      {/* intro */}
      <div className="hero-intro absolute inset-x-0 top-[21%] md:top-[19%] text-center px-6 pointer-events-none">
        <p className="hero-enter eyebrow">Best seller · Winter 2026</p>
        <h1 className="mt-4 text-[clamp(30px,6vw,64px)] leading-[1.05]">
          <span className="hero-mask block overflow-hidden pb-[0.1em]"><span className="block">Made piece by piece.</span></span>
          <span className="hero-mask block overflow-hidden pb-[0.1em]"><span className="block italic">Worn for years.</span></span>
        </h1>
      </div>

      {/* scroll hint + progress */}
      <div className="hero-hint hero-enter absolute bottom-[7.5rem] md:bottom-24 inset-x-0 flex flex-col items-center gap-3 pointer-events-none" style={{ opacity: reduced ? 0 : undefined }}>
        <span className="eyebrow">Scroll to assemble</span>
        <span className="block w-px h-9 bg-ink/50 origin-top" style={{ animation: reduced ? undefined : "hintPulse 2.2s ease-in-out infinite" }} />
      </div>
      <div className="absolute right-4 md:right-8 top-[28%] bottom-[28%] w-px bg-ink/10 pointer-events-none" aria-hidden="true"><div className="hero-progress absolute inset-0 bg-ink/60 origin-top scale-y-0" /></div>

      {/* outro: reveals line by line after assembly */}
      <div className="hero-outro absolute inset-x-0 bottom-[6%] md:bottom-[7%] text-center px-6 pointer-events-none">
        <div className="overflow-hidden"><h2 className="hero-outro-line text-[clamp(32px,6.5vw,76px)] tracking-[0.28em] pl-[0.28em] leading-none opacity-0">{BRAND.name}</h2></div>
        <div className="overflow-hidden mt-3"><p className="hero-outro-line text-[12px] md:text-[14px] text-stone tracking-wide opacity-0">{BRAND.tagline}</p></div>
        <div className="overflow-hidden mt-5"><p className="hero-outro-line text-[13px] opacity-0"><span className="font-display text-[19px]">{HERO.name}</span><span className="text-stone"> · {HERO_COLOR.name} · </span><span className="tabular-nums">{money(price)}</span>{HERO.salePrice && <s className="text-stone ml-2 text-[12px]">{money(HERO.price)}</s>}</p></div>
        <div className="overflow-hidden mt-5 py-1">
          <div className="hero-outro-line flex items-center justify-center gap-5 opacity-0">
            <button className="btn btn-solid" onClick={() => shop()}>Shop Now</button>
            <div className="flex" role="group" aria-label={`${HERO.name} colours`}>
              {HERO.colors.map((c) => (
                <button key={c.id} onClick={() => shop(c.id)} aria-label={`Shop ${HERO.name} in ${c.name}`} className="w-10 h-10 flex items-center justify-center">
                  <span className={`block w-4 h-4 rounded-full border border-ink/20 transition-transform hover:scale-125 ${c.id === HERO_COLOR.id ? "ring-1 ring-ink ring-offset-2 ring-offset-snow" : ""}`} style={{ background: c.hex2 ? `linear-gradient(135deg, ${c.hex} 50%, ${c.hex2} 50%)` : c.hex }} />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
      </div>
    </section>
  );
}
