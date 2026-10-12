import { useEffect, useRef } from "react";
import gsap from "gsap";
import { isMobile, reducedMotion, usePerfLite } from "../lib/env";
import { heroProgress } from "./heroState";

// Light rays + soft drifting particles behind the hoodie. Pure CSS/canvas, no assets.
//  · rays: ONE small rotating layer (transform-only CSS animation, runs on the compositor)
//  · particles: pre-rendered glow sprites blitted onto a HALF-resolution canvas (no per-frame gradients)
//  · nothing runs while the hero is off-screen, and LITE mode / reduced motion switch it all off
interface P { x: number; y: number; r: number; vx: number; vy: number; a: number; ph: number; warm: boolean }

const sprite = (rgb: string) => {
  const s = document.createElement("canvas"); s.width = s.height = 64;
  const g = s.getContext("2d")!; const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0, `rgba(${rgb},1)`); grad.addColorStop(1, `rgba(${rgb},0)`);
  g.fillStyle = grad; g.fillRect(0, 0, 64, 64); return s;
};

export default function HeroFX({ active }: { active: boolean }) {
  const cv = useRef<HTMLCanvasElement>(null);
  const still = reducedMotion();
  const lite = usePerfLite();

  useEffect(() => {
    const c = cv.current; if (!c || lite || !active) return; // no loop at all while off-screen
    const g = c.getContext("2d")!;
    const white = sprite("255,255,255"), warm = sprite("168,98,60");
    const count = isMobile() ? 14 : 26, SCALE = 0.5;
    let w = 0, h = 0;
    const parts: P[] = [];
    const resize = () => { const r = c.getBoundingClientRect(); w = c.width = Math.max(1, Math.round(r.width * SCALE)); h = c.height = Math.max(1, Math.round(r.height * SCALE)); };
    resize();
    if (!parts.length) for (let i = 0; i < count; i++) parts.push({ x: Math.random() * w, y: Math.random() * h, r: 4 + Math.random() * 9, vx: (Math.random() - 0.5) * 0.08, vy: -0.04 - Math.random() * 0.1, a: 0.25 + Math.random() * 0.5, ph: Math.random() * 6.28, warm: Math.random() < 0.25 });
    const draw = (time: number) => {
      const t = time / 1000, boost = 1 + heroProgress.v * 1.6;
      g.clearRect(0, 0, w, h);
      for (const p of parts) {
        p.x += p.vx * boost + Math.sin(t * 0.4 + p.ph) * 0.08; p.y += p.vy * boost;
        if (p.y < -20) { p.y = h + 20; p.x = Math.random() * w; } if (p.x < -20) p.x = w + 20; if (p.x > w + 20) p.x = -20;
        g.globalAlpha = p.a * (0.6 + 0.4 * Math.sin(t * 1.2 + p.ph)) * (p.warm ? 0.5 : 1);
        const d = p.r * 2; g.drawImage(p.warm ? warm : white, p.x - p.r, p.y - p.r, d, d);
      }
    };
    gsap.ticker.add(draw);
    const ro = new ResizeObserver(resize); ro.observe(c);
    return () => { gsap.ticker.remove(draw); ro.disconnect(); };
  }, [active, lite]);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
      <div className="hero-rays absolute inset-0">
        <div
          className="absolute left-1/2 top-[44%] w-[120vmin] h-[120vmin] -ml-[60vmin] -mt-[60vmin]"
          style={{
            background: "repeating-conic-gradient(from 0deg at 50% 50%, rgba(255,255,255,0.45) 0deg 3deg, rgba(255,255,255,0) 3deg 17deg)",
            WebkitMaskImage: "radial-gradient(circle at 50% 50%, #000 0%, rgba(0,0,0,0.5) 35%, transparent 70%)",
            maskImage: "radial-gradient(circle at 50% 50%, #000 0%, rgba(0,0,0,0.5) 35%, transparent 70%)",
            animation: still || lite ? undefined : "heroSpin 140s linear infinite",
          }}
        />
      </div>
      {!lite && <canvas ref={cv} className="absolute inset-0 w-full h-full" />}
    </div>
  );
}
