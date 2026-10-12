import { useEffect, useRef } from "react";
import gsap from "gsap";
import meta from "./hoodieParts.json";
import { isTouch, usePerfLite } from "../lib/env";
import { heroProgress, useHero } from "./heroState";

// YOUR hoodie, cut into real parts (scripts/cut-hoodie.mjs): hood, body, pocket, hem, four sleeve pieces.
// They float apart, then glide together and lock as you scroll. Transform-only; the pointer adds a gentle depth shift.
type Part = { x: number; y: number; w: number; h: number };
const PARTS = meta.parts as Record<string, Part>;
// exploded offsets: [dx, dy, rotation°, depth] (dx/dy in % of the hoodie's width; depth = pointer parallax strength)
const OFF: Record<string, [number, number, number, number]> = {
  hood: [3, -60, 7, 1.4], body: [0, 32, -3, 0.6], pocket: [58, 50, 14, 1.8], hem: [-38, 76, -9, 1.2],
  slL1: [-74, -26, -26, 1.6], slL2: [-84, 48, 18, 2], slR1: [78, -30, 24, 1.6], slR2: [90, 42, -20, 2],
};
const ORDER = ["body", "hood", "slL1", "slR1", "pocket", "hem", "slL2", "slR2"].filter((k) => PARTS[k]);
const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

export default function HeroDismantle({ active }: { active: boolean }) {
  const stage = useRef<HTMLDivElement>(null);
  const els = useRef<Record<string, HTMLImageElement | null>>({});
  const shadow = useRef<HTMLDivElement>(null);
  const lite = usePerfLite();
  const ptr = useRef({ x: 0, y: 0, tx: 0, ty: 0 });

  // ready when every part has loaded
  useEffect(() => {
    let n = 0; const total = ORDER.length;
    ORDER.forEach((k) => { const el = els.current[k]; if (!el) return; const done = () => { n++; useHero.getState().setProgress(n / total); if (n === total) useHero.getState().setReady(); }; if (el.complete && el.naturalWidth) done(); else { el.addEventListener("load", done, { once: true }); el.addEventListener("error", done, { once: true }); } });
  }, []);

  useEffect(() => {
    if (isTouch() || lite) return;
    const move = (e: PointerEvent) => { ptr.current.tx = (e.clientX / window.innerWidth - 0.5) * 2; ptr.current.ty = (e.clientY / window.innerHeight - 0.5) * 2; };
    window.addEventListener("pointermove", move, { passive: true });
    return () => window.removeEventListener("pointermove", move);
  }, [lite]);

  useEffect(() => {
    if (!active) return;
    const tick = (time: number, deltaTime: number) => {
      const st = stage.current; if (!st) return;
      const w = st.clientWidth, p = heroProgress.v, t = time;
      const k = 1 - Math.pow(0.001, deltaTime / 1000); // frame-rate independent smoothing (any refresh rate)
      ptr.current.x += (ptr.current.tx - ptr.current.x) * k * 0.25; ptr.current.y += (ptr.current.ty - ptr.current.y) * k * 0.25;
      ORDER.forEach((name, i) => {
        const el = els.current[name]; if (!el) return;
        const e = ease(Math.min(1, Math.max(0, (p - i * 0.03) / 0.68))), r = 1 - e;
        const [dx, dy, rot, depth] = OFF[name];
        const fx = Math.sin(t * 0.9 + i * 1.3) * 0.012 * w * r, fy = Math.cos(t * 0.7 + i) * 0.014 * w * r;
        const px = ptr.current.x * depth * 0.012 * w * (0.4 + r), py = ptr.current.y * depth * 0.01 * w * (0.4 + r);
        const maxX = (window.innerWidth - w) / 2 + w * 0.22, rawX = (dx / 100) * w, offX = Math.sign(rawX) * Math.min(Math.abs(rawX), maxX); // never leave the screen
        el.style.transform = `translate3d(${offX * r + fx + px}px, ${(dy / 100) * w * r + fy + py}px, 0) rotate(${rot * r + Math.sin(t * 0.6 + i) * 2 * r}deg)`;
      });
      if (shadow.current) shadow.current.style.transform = `translate3d(0, 0, 0) scale(${0.55 + 0.45 * ease(p)})`, shadow.current.style.opacity = String(0.25 + 0.5 * ease(p));
    };
    gsap.ticker.add(tick);
    return () => gsap.ticker.remove(tick);
  }, [active]);

  const ratio = meta.width / meta.height;
  return (
    <div className="w-full h-full flex items-end justify-center pt-[68px] pb-[2%]">
      <div ref={stage} className="relative" style={{ aspectRatio: String(ratio), height: "100%", maxWidth: "min(94vw, 900px)", maxHeight: "100%" }} role="img" aria-label="A black Nordvale hoodie assembling from separate pieces">
        <div ref={shadow} className="absolute left-[8%] right-[8%] -bottom-[4%] h-[8%] rounded-[50%] bg-black/45 blur-2xl" aria-hidden="true" />
        {ORDER.map((k) => (
          <img key={k} ref={(el) => { els.current[k] = el; }} src={`/assets/hero/parts/${k}.webp`} alt="" draggable={false} decoding="async" fetchPriority="high"
            className="absolute select-none pointer-events-none" style={{ left: `${PARTS[k].x}%`, top: `${PARTS[k].y}%`, width: `${PARTS[k].w}%`, height: `${PARTS[k].h}%`, willChange: "transform" }} />
        ))}
      </div>
    </div>
  );
}
