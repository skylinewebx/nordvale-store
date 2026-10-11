import { useEffect, useRef } from "react";
import gsap from "gsap";
import { P } from "../config/assets";
import { heroProgress, useHero } from "./heroState";

// Scroll-scrubbed assembly video. Encode it all-intra (see ASSETS.md) so seeking to any frame is instant.
// `mix-blend-multiply` lets the warm off-white video background melt into the page gradient.
export function HeroVideo({ active, onError }: { active: boolean; onError: () => void }) {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const v = ref.current!;
    const ready = () => useHero.getState().setReady();
    const prog = () => { if (v.duration && v.buffered.length) useHero.getState().setProgress(v.buffered.end(v.buffered.length - 1) / v.duration); };
    const fail = () => { ready(); onError(); };
    v.addEventListener("loadeddata", ready); v.addEventListener("progress", prog); v.addEventListener("error", fail);
    return () => { v.removeEventListener("loadeddata", ready); v.removeEventListener("progress", prog); v.removeEventListener("error", fail); };
  }, [onError]);

  useEffect(() => {
    if (!active) return;
    const v = ref.current!; let cur = 0;
    const tick = () => {
      if (!v.duration || v.seeking) return;
      const target = heroProgress.v * v.duration * 0.998;
      cur += (target - cur) * 0.2; // ease toward the scroll position
      if (Math.abs(cur - v.currentTime) > 0.015) v.currentTime = cur;
    };
    gsap.ticker.add(tick);
    return () => gsap.ticker.remove(tick);
  }, [active]);

  return <video ref={ref} src={P.heroVideo} muted playsInline preload="auto" tabIndex={-1} aria-label="A hoodie assembling from separate pieces" className="w-full h-full object-contain mix-blend-multiply" />;
}

// Static fallback (iOS, low-end devices, reduced motion): the assembled hoodie eases in with scroll.
export function HeroStatic({ active }: { active: boolean }) {
  const img = useRef<HTMLImageElement>(null);
  useEffect(() => {
    const el = img.current!;
    const done = () => useHero.getState().setReady();
    if (el.complete) done(); else { el.addEventListener("load", done); el.addEventListener("error", done); }
    if (!active) return;
    const tick = () => { const p = heroProgress.v; el.style.opacity = String(0.2 + 0.8 * Math.min(1, p * 1.6)); el.style.transform = `scale(${0.88 + 0.12 * p})`; };
    gsap.ticker.add(tick);
    return () => { gsap.ticker.remove(tick); el.removeEventListener("load", done); };
  }, [active]);
  return <img ref={img} src={P.heroStatic} alt="A charcoal Nordvale hoodie" decoding="async" className="w-full h-full object-contain mix-blend-multiply will-change-transform" />;
}
