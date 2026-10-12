import { useEffect, useMemo, useRef } from "react";
import gsap from "gsap";
import { heroProgress, useHero } from "./heroState";

// Procedural stand-in for the hero video: a light SVG hoodie whose parts float apart and glide together as you scroll.
// Pure transforms driven by the same `heroProgress` as the video (no WebGL, no extra library).
const shade = (hex: string, amt: number) => { const n = parseInt(hex.slice(1), 16); const f = (v: number) => Math.max(0, Math.min(255, Math.round(v + amt * 255))); return `#${((1 << 24) | (f(n >> 16) << 16) | (f((n >> 8) & 255) << 8) | f(n & 255)).toString(16).slice(1)}`; };
const lift = (hex: string) => { const n = parseInt(hex.slice(1), 16); const l = (0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255; return l < 0.22 ? "#3a3a40" : hex; };

// [name, dx, dy, rotation] (exploded offset, in SVG units)
const OFFS: Record<string, [number, number, number]> = {
  hood: [18, -120, 12], body: [0, 46, -5], hem: [-34, 150, -9], pocket: [92, 120, 14],
  lu: [-150, -34, -40], ll: [-176, 120, 26], ru: [152, -52, 38], rl: [176, 100, -28], s1: [-70, -110, 40], s2: [74, -126, -35],
};
const ORDER = Object.keys(OFFS);
const PIVOT: Record<string, [number, number]> = { hood: [200, 148], body: [200, 272], hem: [200, 380], pocket: [200, 315], lu: [100, 236], ll: [76, 330], ru: [300, 236], rl: [324, 330], s1: [185, 214], s2: [214, 214] };
const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

export default function HeroPlaceholder({ active, color }: { active: boolean; color: string }) {
  const svg = useRef<SVGSVGElement>(null);
  const base = lift(color);
  const c = useMemo(() => ({ base, light: shade(base, 0.08), dark: shade(base, -0.1), darker: shade(base, -0.18) }), [base]);

  useEffect(() => { useHero.getState().setReady(); }, []);

  useEffect(() => {
    if (!active) return;
    const els = ORDER.map((k) => svg.current!.querySelector<SVGGElement>(`[data-p="${k}"]`)!);
    const tick = () => {
      const p = heroProgress.v, t = performance.now() / 1000;
      ORDER.forEach((k, i) => {
        const e = ease(Math.min(1, Math.max(0, (p - i * 0.035) / 0.7))), r = 1 - e;
        const [dx, dy, rot] = OFFS[k];
        const [px, py] = PIVOT[k];
        els[i].setAttribute("transform", `translate(${(dx * r).toFixed(1)} ${(dy * r + Math.sin(t * 0.8 + i) * 5 * r).toFixed(1)}) rotate(${(rot * r + Math.sin(t * 0.6 + i) * 2 * r).toFixed(2)} ${px} ${py})`);
      });
      // after assembly: a slow breathing sway, as if it were turning
    };
    gsap.ticker.add(tick);
    return () => gsap.ticker.remove(tick);
  }, [active]);

  return (
    <svg ref={svg} viewBox="0 0 400 480" className="w-full h-full max-h-full" role="img" aria-label="A hoodie assembling from separate pieces" preserveAspectRatio="xMidYMid meet">
      <defs>
        <linearGradient id="hp-body" x1="0" x2="1"><stop offset="0" stopColor={c.light} /><stop offset="0.55" stopColor={c.base} /><stop offset="1" stopColor={c.dark} /></linearGradient>
        <linearGradient id="hp-slv" x1="0" x2="1"><stop offset="0" stopColor={c.base} /><stop offset="1" stopColor={c.darker} /></linearGradient>
      </defs>
      <g>
        <g data-p="hood">
          <ellipse cx="200" cy="148" rx="64" ry="58" fill={c.dark} /><ellipse cx="200" cy="168" rx="36" ry="28" fill={c.darker} />
        </g>
        <g data-p="lu"><rect x="-22" y="0" width="44" height="100" rx="20" transform="translate(112 188) rotate(14)" fill="url(#hp-slv)" /></g>
        <g data-p="ll"><rect x="-20" y="0" width="40" height="96" rx="18" transform="translate(88 281) rotate(14)" fill="url(#hp-slv)" /><rect x="-21" y="84" width="42" height="18" rx="6" transform="translate(88 281) rotate(14)" fill={c.darker} /></g>
        <g data-p="ru"><rect x="-22" y="0" width="44" height="100" rx="20" transform="translate(288 188) rotate(-14)" fill="url(#hp-slv)" /></g>
        <g data-p="rl"><rect x="-20" y="0" width="40" height="96" rx="18" transform="translate(312 281) rotate(-14)" fill="url(#hp-slv)" /><rect x="-21" y="84" width="42" height="18" rx="6" transform="translate(312 281) rotate(-14)" fill={c.darker} /></g>
        <g data-p="body"><rect x="110" y="170" width="180" height="204" rx="26" fill="url(#hp-body)" /></g>
        <g data-p="hem"><rect x="108" y="366" width="184" height="28" rx="9" fill={c.darker} /></g>
        <g data-p="pocket"><rect x="145" y="288" width="110" height="54" rx="12" fill={c.light} opacity="0.9" /></g>
        <g data-p="s1"><rect x="184" y="186" width="3" height="56" rx="1.5" fill="#e8e3d8" /></g>
        <g data-p="s2"><rect x="213" y="186" width="3" height="56" rx="1.5" fill="#e8e3d8" /></g>
      </g>
    </svg>
  );
}
