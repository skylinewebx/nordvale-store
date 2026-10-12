import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { animate, m, MotionValue, useMotionValue, useSpring, useTransform } from "framer-motion";
import { Icon } from "../components/Icons";
import { ProductImage } from "../components/ProductImage";
import { lookbook } from "../data/content";
import { getProduct } from "../data/products";
import { useStore } from "../store/useStore";

// Winter Essentials: draggable carousel with inertia. Cards use the same photos as the collection.
function Card({ i, x, center, w, vw, onOpen, moved }: { i: number; x: MotionValue<number>; center: number; w: number; vw: number; onOpen: () => void; moved: React.MutableRefObject<boolean> }) {
  const item = lookbook[i]; const p = getProduct(item.slug)!;
  const color = p.colors[item.color] ?? p.colors[0];
  // distance of this card's centre from the viewport centre, in card widths
  const d = useTransform(x, (v) => Math.min(1.8, Math.abs(center + v - vw / 2) / (w || 1)));
  const scale = useTransform(d, (v) => 1 - v * 0.07);
  const opacity = useTransform(d, (v) => 1 - v * 0.32);
  return (
    <m.li className="shrink-0 w-[74vw] sm:w-[44vw] md:w-[30vw] lg:w-[24vw]" initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "0px -5% 0px 0px" }} transition={{ duration: 0.9, delay: Math.min(i, 4) * 0.08, ease: [0.22, 1, 0.36, 1] }}>
      <m.button style={{ scale, opacity }} className="group block w-full text-left" onClick={() => { if (!moved.current) onOpen(); }} aria-label={`${item.title}: ${p.name}, ${color.name}`}>
        <div className="relative aspect-[3/4] overflow-hidden select-none">
          <div className="absolute inset-0 transition-transform duration-[1200ms] ease-out group-hover:scale-[1.05]"><ProductImage product={p} colorId={color.id} className="absolute inset-0" /></div>
          <span className="absolute top-4 left-4 eyebrow !text-ink/70">0{i + 1}</span>
        </div>
        <div className="mt-4 flex justify-between items-baseline gap-3"><h3 className="font-display text-[24px] md:text-[26px]">{item.title}</h3><span className="text-[12px] text-stone shrink-0">{p.name}</span></div>
      </m.button>
    </m.li>
  );
}

export default function Lookbook() {
  const set = useStore((s) => s.set);
  const vp = useRef<HTMLDivElement>(null); const track = useRef<HTMLUListElement>(null);
  const x = useMotionValue(0); const moved = useRef(false);
  const [meas, setMeas] = useState({ min: 0, vw: 0, w: 0, centers: [] as number[] });

  const measure = useCallback(() => {
    if (!vp.current || !track.current) return;
    const kids = [...track.current.children] as HTMLElement[];
    const vw = vp.current.clientWidth;
    setMeas({ vw, min: -Math.max(0, track.current.scrollWidth - vw), w: kids[0]?.offsetWidth ?? 0, centers: kids.map((k) => k.offsetLeft + k.offsetWidth / 2) });
  }, []);
  useLayoutEffect(() => { measure(); const ro = new ResizeObserver(measure); vp.current && ro.observe(vp.current); return () => ro.disconnect(); }, [measure]);

  const progress = useTransform(x, [meas.min || -1, 0], [1, 0]);
  const bar = useSpring(progress, { stiffness: 120, damping: 24, mass: 0.4 });
  const [idx, setIdx] = useState(0);
  useEffect(() => x.on("change", (v) => {
    const c = meas.vw / 2 - v; let best = 0, bd = Infinity;
    meas.centers.forEach((cc, i) => { const dd = Math.abs(cc - c); if (dd < bd) { bd = dd; best = i; } });
    setIdx((p) => (p === best ? p : best));
  }), [x, meas]);

  const go = (dir: number) => {
    const next = Math.max(0, Math.min(lookbook.length - 1, idx + dir));
    const target = Math.max(meas.min, Math.min(0, meas.vw / 2 - (meas.centers[next] ?? 0)));
    animate(x, target, { type: "spring", stiffness: 140, damping: 24 });
  };

  return (
    <section id="lookbook" className="relative bg-mist/50 overflow-hidden py-24 md:py-36" aria-labelledby="lb-h">
      <div className="wrap mb-10 md:mb-14 flex items-end justify-between gap-6">
        <div><p className="eyebrow">Winter Essentials</p><h2 id="lb-h" className="mt-3 text-[clamp(28px,4.2vw,48px)] leading-[1.1]">The <em>lookbook.</em></h2></div>
        <div className="hidden md:flex gap-2">
          <button className="w-12 h-12 border hair flex items-center justify-center hover:bg-ink hover:text-snow transition-colors disabled:opacity-30" onClick={() => go(-1)} disabled={idx === 0} aria-label="Previous"><Icon name="arrow" className="rotate-180" /></button>
          <button className="w-12 h-12 border hair flex items-center justify-center hover:bg-ink hover:text-snow transition-colors disabled:opacity-30" onClick={() => go(1)} disabled={idx === lookbook.length - 1} aria-label="Next"><Icon name="arrow" /></button>
        </div>
      </div>

      <div ref={vp} className="cursor-grab active:cursor-grabbing" role="region" aria-roledescription="carousel" aria-label="Winter essentials">
        <m.ul
          ref={track} drag="x" style={{ x }} className="flex gap-4 md:gap-8 px-5 md:px-10 w-max"
          dragConstraints={{ left: meas.min, right: 0 }} dragElastic={0.12} dragTransition={{ power: 0.28, timeConstant: 320, bounceStiffness: 220, bounceDamping: 30 }}
          onPointerDown={() => (moved.current = false)} onDrag={(_, i) => { if (Math.abs(i.offset.x) > 6) moved.current = true; }}
        >
          {lookbook.map((l, i) => <Card key={l.title} i={i} x={x} center={meas.centers[i] ?? 0} w={meas.w} vw={meas.vw} moved={moved} onOpen={() => set({ openProduct: l.slug })} />)}
          <li className="shrink-0 w-2 md:w-10" aria-hidden="true" />
        </m.ul>
      </div>

      <div className="wrap mt-10 flex items-center gap-5">
        <span className="eyebrow tabular-nums w-14">{String(idx + 1).padStart(2, "0")} / {String(lookbook.length).padStart(2, "0")}</span>
        <div className="flex-1 h-px bg-ink/15 relative overflow-hidden"><m.div className="absolute inset-0 bg-ink origin-left" style={{ scaleX: bar }} /></div>
        <span className="eyebrow">Drag →</span>
      </div>
    </section>
  );
}
