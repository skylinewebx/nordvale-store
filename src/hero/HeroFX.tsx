import { useEffect, useRef } from "react";
import gsap from "gsap";
import { isMobile, perfLite, reducedMotion } from "../lib/env";
import { heroProgress } from "./heroState";

// Light rays + soft drifting particles behind the hoodie. Pure CSS/canvas, no assets.
// Rays are one rotating (transform-only) layer; particles are drawn on a small canvas and
// swirl a little faster as the hoodie assembles. Switched off for reduced motion / low-end.
interface P { x: number; y: number; r: number; vx: number; vy: number; a: number; ph: number; warm: boolean }

export default function HeroFX({ active }: { active: boolean }) {
  const cv = useRef<HTMLCanvasElement>(null);
  const still = reducedMotion();
  const lite = perfLite();

  useEffect(() => {
    const c = cv.current; if (!c || lite) return;
    const g = c.getContext("2d")!;
    const count = isMobile() ? 22 : 44;
    let w = 0, h = 0;
    const parts: P[] = [];
    const resize = () => { const r = c.getBoundingClientRect(); w = c.width = Math.round(r.width); h = c.height = Math.round(r.height); };
    resize();
    for (let i = 0; i < count; i++) parts.push({ x: Math.random() * w, y: Math.random() * h, r: 1.5 + Math.random() * 4.5, vx: (Math.random() - 0.5) * 0.12, vy: -0.05 - Math.random() * 0.18, a: 0.25 + Math.random() * 0.5, ph: Math.random() * 6.28, warm: Math.random() < 0.25 });
    const draw = (time: number) => {
      if (!active) return;
      const t = time / 1000, boost = 1 + heroProgress.v * 1.6;
      g.clearRect(0, 0, w, h);
      for (const p of parts) {
        p.x += p.vx * boost + Math.sin(t * 0.4 + p.ph) * 0.12; p.y += p.vy * boost;
        if (p.y < -10) { p.y = h + 10; p.x = Math.random() * w; } if (p.x < -10) p.x = w + 10; if (p.x > w + 10) p.x = -10;
        const tw = 0.6 + 0.4 * Math.sin(t * 1.2 + p.ph), rad = p.r * 4;
        const grad = g.createRadialGradient(p.x, p.y, 0, p.x, p.y, rad);
        const col = p.warm ? "168,98,60" : "255,255,255";
        grad.addColorStop(0, `rgba(${col},${p.a * tw * (p.warm ? 0.5 : 1)})`); grad.addColorStop(1, `rgba(${col},0)`);
        g.fillStyle = grad; g.beginPath(); g.arc(p.x, p.y, rad, 0, 6.2832); g.fill();
      }
    };
    gsap.ticker.add(draw);
    const ro = new ResizeObserver(resize); ro.observe(c);
    return () => { gsap.ticker.remove(draw); ro.disconnect(); };
  }, [active, lite]);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
      <div
        className="absolute left-1/2 top-[42%] w-[190vmax] h-[190vmax] -ml-[95vmax] -mt-[95vmax] will-change-transform"
        style={{
          background: "repeating-conic-gradient(from 0deg at 50% 50%, rgba(255,255,255,0.42) 0deg 3deg, rgba(255,255,255,0) 3deg 17deg)",
          WebkitMaskImage: "radial-gradient(circle at 50% 50%, #000 0%, rgba(0,0,0,0.55) 6%, transparent 17%)",
          maskImage: "radial-gradient(circle at 50% 50%, #000 0%, rgba(0,0,0,0.55) 6%, transparent 17%)",
          animation: still ? undefined : "heroSpin 140s linear infinite",
        }}
      />
      {!lite && <canvas ref={cv} className="absolute inset-0 w-full h-full" />}
    </div>
  );
}
