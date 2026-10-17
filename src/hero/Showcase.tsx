import { memo, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BRAND, money } from "../config/assets";
import { Icon } from "../components/Icons";
import { Silhouette } from "../components/ProductImage";
import { HANG_ASPECT, HANG_TOP, HangShadow, hangShadowTop, Hung, isHanging, Sway } from "../components/Hanger";
import { CATEGORIES, Category, colorOf, effectivePrice, featuredOf, getCategory, photoKey, Product, stylesOf } from "../data/products";
import { cardUrl, detailUrl, useCatalog } from "../lib/catalog";
import { flip } from "../lib/flip";
import { isTouch, reducedMotion, usePerfLite } from "../lib/env";
import { useStore } from "../store/useStore";
import { Turn, TurnShadow, TurnSlider, TurnTarget, useTurn } from "../lib/turn";

/**
 * SHOWCASE HERO.
 *  State A: giant category title behind ONE featured product standing on a floor shadow.
 *  State B: carousel of the category's 4 styles (centre large, neighbours 0.7 scale, dimmed, blurred, same floor line).
 * Everything that moves is transform / opacity (the single exception is the title's letter-spacing, one element, 0.7s).
 */
const EASE = "cubic-bezier(.22,1,.36,1)";
const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

function useImg(p: Product) {
  const picked = useStore((s) => s.picked[p.slug]);
  const color = colorOf(p, picked);
  const key = photoKey(p.slug, color.slug);
  const it = useCatalog((s) => s.items[key]);
  return { key, it, color, detail: it ? detailUrl(key, it) : null, card: it ? cardUrl(key, it) : null };
}

/** one style (product) inside the stage; its transform is written by the stage loop */
const Item = memo(function Item({ p, i, setRef, priority, ctl, active }: { p: Product; i: number; setRef: (i: number, el: HTMLDivElement | null) => void; priority: boolean; ctl: Turn; active: boolean }) {
  const { it, detail, card, color } = useImg(p);
  const [ok, setOk] = useState(true);
  const hang = false; // hero = the standing model photos (no hanging)
  const modelUrl = `${import.meta.env.BASE_URL}assets/products/${photoKey(p.slug, color.slug)}-model.webp`;
  const isTop = isHanging(p.category);
  const src = isTop ? modelUrl : detail;
  const img = it && ok && detail ? (
    <img src={src!} {...(isTop ? {} : { srcSet: `${card} 540w, ${detail} 1080w`, sizes: "(max-width: 768px) 70vw, 460px" })} alt={`${p.name} in ${color.name}`} width={it.w} height={it.h} draggable={false}
      decoding="async" loading={priority ? "eager" : "lazy"} {...(priority ? ({ fetchpriority: "high" } as object) : {})} onError={() => setOk(false)}
      className={`absolute inset-0 w-full h-full object-contain ${hang ? "object-top" : "object-bottom"} pointer-events-none`} />
  ) : <Silhouette category={p.category} tint={color.hex} className="absolute inset-0 w-full h-full" />;
  return (
    <div ref={(el) => setRef(i, el)} className="sc-item absolute left-1/2 bottom-0 will-change-transform select-none" style={{ width: `calc(var(--ph) * ${hang ? HANG_ASPECT : 0.5625})`, height: "var(--ph)", opacity: 0 }} data-i={i} aria-hidden="true">
      {/* shadow: part of the item, so it scales and fades with it (floor shadow for trousers, soft shadow under hanging tops) */}
      {hang
        ? (active ? <TurnShadow soft ctl={ctl} className="left-[12%] right-[12%] h-[6%]" style={{ top: hangShadowTop(it?.gb) }} /> : <HangShadow gb={it?.gb} className="left-[12%] right-[12%]" />)
        : (active ? <TurnShadow ctl={ctl} className="left-[6%] right-[6%] -bottom-[2.2%] h-[5.5%]" /> : <span className="absolute left-[6%] right-[6%] -bottom-[2.2%] h-[5.5%] pointer-events-none" style={{ background: "radial-gradient(ellipse at center, rgba(38,34,33,0.42) 0%, rgba(38,34,33,0.16) 45%, transparent 72%)" }} />)}
      {hang ? (
        <Sway delay={i * 1.7}>
          <TurnTarget ctl={ctl} active={active} maskUrl={it && ok ? detail : null} maskTop={HANG_TOP}><Hung>{img}</Hung></TurnTarget>
        </Sway>
      ) : (
        <div className="sc-float absolute inset-0"><TurnTarget ctl={ctl} active={active} maskUrl={it && ok ? src : null}>{img}</TurnTarget></div>
      )}
    </div>
  );
});

interface StageProps { ctl: Turn; cat: Category; mode: "A" | "B"; idx: number; onIdx: (i: number) => void; onSwipeCat: (dir: 1 | -1) => void; onEnterB: () => void; onSelect: () => void; out?: boolean }

function Stage({ ctl, cat, mode, idx, onIdx, onSwipeCat, onEnterB, onSelect, out }: StageProps) {
  const styles = useMemo(() => stylesOf(cat), [cat]);
  const root = useRef<HTMLDivElement>(null);
  const items = useRef<(HTMLDivElement | null)[]>([]);
  const st = useRef({ pos: idx, target: idx, mix: mode === "B" ? 1 : 0, mixT: mode === "B" ? 1 : 0, px: 0, py: 0, tx: 0, ty: 0, raf: 0, last: 0, drag: null as null | { x: number; pos0: number; moved: boolean; v: number; lx: number; lt: number; id: number; turn: boolean; w: number }, step: 300 });
  const lite = usePerfLite();
  const reduced = reducedMotion();
  const live = useRef(true);
  const hang = false;
  const cur = useRef({ mode, idx, onIdx, hang }); cur.current = { mode, idx, onIdx, hang };

  const setRef = useCallback((i: number, el: HTMLDivElement | null) => { items.current[i] = el; }, []);

  const paint = useCallback(() => {
    const s = st.current, root_ = root.current; if (!root_) return;
    const w = root_.clientWidth;
    const ph = parseFloat(getComputedStyle(root_).getPropertyValue("--ph")) || 560;
    s.step = Math.min(ph * (cur.current.hang ? HANG_ASPECT : 0.5625) * 0.86, w * 0.5);
    const showB = s.mix;
    items.current.forEach((el, i) => {
      if (!el) return;
      const dx = i - s.pos, a = Math.min(1.6, Math.abs(dx));
      const x = dx * s.step * (0.5 + 0.5 * showB);
      const scale = 1 - 0.3 * Math.min(1, a) * (0.3 + 0.7 * showB);
      const opA = Math.max(0, 1 - Math.abs(dx) * 1.2);
      const opB = 1 - 0.5 * Math.min(1, a) - 0.2 * Math.max(0, a - 1);
      const op = opA * (1 - showB) + opB * showB;
      const front = Math.abs(dx) < 0.5;
      const tilt = front ? `rotateY(${(s.px * 5).toFixed(2)}deg) rotateX(${(-s.py * 2.5).toFixed(2)}deg) translate3d(${(s.px * 6).toFixed(1)}px, ${(s.py * 3).toFixed(1)}px, 0)` : "";
      el.style.transform = `translate3d(calc(-50% + ${x.toFixed(1)}px), 0, 0) scale(${scale.toFixed(3)}) ${tilt}`;
      el.style.transformOrigin = "50% 100%";
      el.style.opacity = op.toFixed(3);
      el.style.zIndex = String(10 - Math.round(a * 4));
      const blur = !lite && showB > 0.05 && a > 0.02 ? Math.min(1, a) * 2.2 * showB : 0;
      el.style.filter = blur > 0.05 ? `blur(${blur.toFixed(2)}px)` : "none";
      el.style.pointerEvents = op > 0.3 ? "auto" : "none";
    });
  }, [lite]);

  const loop = useCallback((t: number) => {
    const s = st.current; s.raf = 0;
    const dt = Math.min(64, t - (s.last || t)); s.last = t;
    const k = 1 - Math.pow(0.0025, dt / 1000); // frame-rate independent
    s.pos += (s.target - s.pos) * (s.drag ? 1 : clamp(k * 1.25, 0, 1));
    s.mix += (s.mixT - s.mix) * clamp(k * 1.1, 0, 1);
    s.px += (s.tx - s.px) * clamp(k * 0.9, 0, 1); s.py += (s.ty - s.py) * clamp(k * 0.9, 0, 1);
    if (!s.drag) { const n = Math.round(s.target); if (n !== cur.current.idx && cur.current.mode === "B") cur.current.onIdx(clamp(n, 0, 3)); }
    paint();
    const settled = Math.abs(s.target - s.pos) < 0.0015 && Math.abs(s.mixT - s.mix) < 0.002 && Math.abs(s.tx - s.px) < 0.002 && Math.abs(s.ty - s.py) < 0.002;
    if (!settled && live.current) { s.last = t; s.raf = requestAnimationFrame(loop); } else s.last = 0;
  }, [paint]);
  const kick = useCallback(() => { const s = st.current; if (!s.raf && live.current) s.raf = requestAnimationFrame(loop); }, [loop]);

  // keep the loop's targets in sync with props
  useLayoutEffect(() => { const s = st.current; s.mixT = mode === "B" ? 1 : 0; if (mode === "A") s.target = idx; kick(); }, [mode, idx, kick]);
  useLayoutEffect(() => { const s = st.current; if (mode === "B") { s.target = idx; kick(); } }, [idx]); // eslint-disable-line react-hooks/exhaustive-deps
  useLayoutEffect(() => { paint(); }, [paint]);
  useEffect(() => { const ro = new ResizeObserver(() => { paint(); }); root.current && ro.observe(root.current); return () => ro.disconnect(); }, [paint]);
  // pause everything off screen
  useEffect(() => {
    const el = root.current; if (!el) return;
    const io = new IntersectionObserver(([e]) => { live.current = e.isIntersecting; if (e.isIntersecting) kick(); else { cancelAnimationFrame(st.current.raf); st.current.raf = 0; } }, { rootMargin: "50px" });
    io.observe(el); return () => { io.disconnect(); cancelAnimationFrame(st.current.raf); };
  }, [kick]);

  // mouse parallax (desktop only)
  useEffect(() => {
    if (isTouch() || reduced || lite || out) return;
    const move = (e: PointerEvent) => { if (e.pointerType !== "mouse") return; const s = st.current; s.tx = (e.clientX / window.innerWidth - 0.5) * 2; s.ty = (e.clientY / window.innerHeight - 0.5) * 2; kick(); };
    window.addEventListener("pointermove", move, { passive: true });
    return () => window.removeEventListener("pointermove", move);
  }, [kick, reduced, lite, out]);

  // drag with inertia (B) / swipe (A)
  const onDown = (e: React.PointerEvent) => {
    if (out || (e.pointerType === "mouse" && e.button !== 0)) return;
    const s = st.current;
    const hit = (e.target as HTMLElement).closest<HTMLElement>(".sc-item");
    const turn = cur.current.mode === "A" && !!hit && Number(hit.dataset.i) === cur.current.idx;
    s.drag = { x: e.clientX, pos0: s.pos, moved: false, v: 0, lx: e.clientX, lt: performance.now(), id: e.pointerId, turn, w: hit?.clientWidth ?? 300 };
    if (turn) ctl.grab(e.clientX);
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
  };
  const onMove = (e: React.PointerEvent) => {
    const s = st.current, d = s.drag; if (!d) return;
    const dx = e.clientX - d.x;
    if (Math.abs(dx) > 6) d.moved = true;
    if (d.turn) { ctl.move(e.clientX, d.w); return; }
    const now = performance.now(); d.v = d.v * 0.7 + ((e.clientX - d.lx) / Math.max(1, now - d.lt)) * 0.3; d.lx = e.clientX; d.lt = now;
    if (cur.current.mode === "B" && d.moved) { s.pos = clamp(d.pos0 - dx / s.step, -0.35, 3.35); s.target = s.pos; kick(); }
  };
  const onUp = (e: React.PointerEvent) => {
    const s = st.current, d = s.drag; s.drag = null; if (!d) return;
    (e.currentTarget as HTMLElement).releasePointerCapture?.(d.id);
    const dx = e.clientX - d.x;
    if (d.turn) ctl.release();
    if (d.turn && d.moved) return;
    if (!d.moved) { // tap / click
      const hit = (e.target as HTMLElement).closest<HTMLElement>(".sc-item");
      const i = hit ? Number(hit.dataset.i) : -1;
      if (cur.current.mode === "A") { if (i >= 0) onEnterB(); }
      else if (i === cur.current.idx) onSelect();
      else if (i >= 0) { s.target = i; cur.current.onIdx(i); kick(); }
      return;
    }
    if (cur.current.mode === "B") { const t = clamp(Math.round(s.pos - d.v * 3.2), 0, 3); s.target = t; cur.current.onIdx(t); kick(); }
    else if (Math.abs(dx) > 50) onSwipeCat(dx < 0 ? 1 : -1);
  };

  // keyboard
  useEffect(() => {
    if (out) return;
    const key = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement; if (t && /INPUT|TEXTAREA|SELECT/.test(t.tagName)) return;
      if (window.scrollY > window.innerHeight * 0.5) return;
      const { mode: m, idx: i } = cur.current;
      if (e.key === "ArrowRight") { e.preventDefault(); if (m === "B") { const n = clamp(i + 1, 0, 3); st.current.target = n; onIdx(n); kick(); } else onSwipeCat(1); }
      if (e.key === "ArrowLeft") { e.preventDefault(); if (m === "B") { const n = clamp(i - 1, 0, 3); st.current.target = n; onIdx(n); kick(); } else onSwipeCat(-1); }
    };
    window.addEventListener("keydown", key); return () => window.removeEventListener("keydown", key);
  }, [out, onIdx, onSwipeCat, kick]);

  return (
    <div ref={root} onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp}
      className={`sc-stage absolute inset-0 ${out ? "sc-out pointer-events-none" : "sc-in"} ${mode === "B" ? "cursor-grab active:cursor-grabbing" : "cursor-pointer"}`} style={{ touchAction: "pan-y", perspective: "1200px" }} data-mode={mode}>
      <div className="absolute inset-x-0 bottom-0 h-0" style={{ perspective: "1200px" }}>
        {styles.map((p, i) => <Item key={p.slug} p={p} i={i} setRef={setRef} ctl={ctl} active={!out && i === idx} priority={i === styles.findIndex((x) => x.slug === featuredOf(cat).slug)} />)}
      </div>
    </div>
  );
}

function Title({ text, out }: { text: string; out?: boolean }) {
  return (
    <h1 className={`sc-title absolute inset-0 flex items-center justify-center pointer-events-none select-none ${out ? "sc-title-out" : "sc-title-in"}`} aria-hidden={out || undefined}>
      <span className="whitespace-nowrap font-display text-[11.5vw] md:text-[clamp(56px,9vw,124px)] leading-none text-ink/90" style={{ fontWeight: 300 }}>{text}</span>
    </h1>
  );
}

const SOCIAL: [string, string, string][] = [
  ["instagram", "Instagram", "https://instagram.com/nordvale"],
  ["facebook", "Facebook", "https://facebook.com/nordvale"],
  ["whatsapp", "WhatsApp", `https://wa.me/${BRAND.whatsapp}`],
  ["mail", "Email", `mailto:${BRAND.email}`],
];

export default function Showcase() {
  const nav = useNavigate();
  const cat = useStore((s) => s.heroCat); const setCat = useStore((s) => s.setHeroCat);
  const [mode, setMode] = useState<"A" | "B">("A");
  const info = getCategory(cat);
  const tops = false;
  const styles = useMemo(() => stylesOf(cat), [cat]);
  const featIdx = Math.max(0, styles.findIndex((p) => p.slug === info.heroFeatured));
  const [idx, setIdx] = useState(featIdx);
  const [groups, setGroups] = useState<{ id: number; cat: Category; out: boolean }[]>([{ id: 0, cat, out: false }]);
  const section = useRef<HTMLElement>(null);
  const ctl = useTurn();
  const seq = useRef(0); const prevCat = useRef(cat);
  useEffect(() => { const el = section.current; if (!el) return; const io = new IntersectionObserver(([e]) => { ctl.setVisible(e.isIntersecting); el.dataset.live = e.isIntersecting ? "1" : "0"; }, { rootMargin: "40px" }); io.observe(el); return () => io.disconnect(); }, [ctl]);
  useEffect(() => { ctl.t = 0; ctl.target = 0; ctl.vel = 0; }, [cat, ctl]);

  // category changed (chips, arrows, swipe, navbar): cross-fade the title and the stage
  useEffect(() => {
    if (prevCat.current === cat) return;
    prevCat.current = cat; setMode("A"); setIdx(Math.max(0, stylesOf(cat).findIndex((p) => p.slug === getCategory(cat).heroFeatured)));
    const id = ++seq.current;
    setGroups((g) => [...g.map((x) => ({ ...x, out: true })), { id, cat, out: false }]);
    const t = setTimeout(() => setGroups((g) => g.filter((x) => !x.out)), 800);
    return () => clearTimeout(t);
  }, [cat]);

  const order = CATEGORIES.map((c) => c.id);
  const swipeCat = useCallback((dir: 1 | -1) => { const i = order.indexOf(useStore.getState().heroCat); setCat(order[(i + dir + order.length) % order.length]); }, [order, setCat]);
  const current = styles[idx] ?? styles[0];
  const sel = useImg(current);

  const select = useCallback(() => {
    const el = section.current?.querySelector<HTMLImageElement>(".sc-stage:not(.sc-out) .sc-item[data-i='" + idx + "'] img");
    if (el) { const r = el.getBoundingClientRect(); flip.rect = r; flip.src = el.currentSrc || el.src; flip.t = performance.now(); } else flip.rect = null;
    nav(`/product/${current.slug}?color=${sel.color.slug}`);
  }, [nav, current, idx, sel.color.slug]);

  // optional: a muted clip public/assets/hero/{category}.mp4 plays over the centre product after 1.2 s idle (one at a time)
  const [clip, setClip] = useState<string | null>(null);
  useEffect(() => {
    setClip(null); if (mode !== "A" || cat !== "trousers" || reducedMotion() || usePerfLiteNow()) return;
    const url = `${import.meta.env.BASE_URL}assets/hero/${cat}.mp4`;
    const t = setTimeout(() => { fetch(url, { method: "HEAD" }).then((r) => { if (r.ok && /video/.test(r.headers.get("content-type") ?? "")) setClip(url); }).catch(() => {}); }, 1200);
    return () => clearTimeout(t);
  }, [cat, mode]);

  return (
    <section ref={section} id="top" className="sc relative w-full overflow-hidden bg-snow" style={{ height: "100svh", minHeight: 640 }} aria-label="Showcase">
      {/* cream background: soft light in one corner + faint vignette */}
      <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(900px 640px at 14% 6%, rgba(255,253,248,0.95), transparent 62%), radial-gradient(ellipse at 50% 58%, transparent 52%, rgba(110,92,70,0.16) 100%)" }} />

      {/* giant category title behind the product */}
      <div className="absolute inset-x-0 top-[8%] bottom-[26%] md:top-[6%] md:bottom-[28%] pointer-events-none" aria-live="polite">
        {groups.map((g) => <Title key={g.id} text={getCategory(g.cat).title} out={g.out} />)}
      </div>

      {/* product zone (sets the shared floor line + product height) */}
      <div className="sc-zone absolute inset-x-0 top-[11svh] bottom-[25svh] md:top-[9svh] md:bottom-[26svh]" style={{ ["--ph" as string]: tops ? "clamp(240px, min(58svh, 100vw * 0.95), 640px)" : "clamp(240px, min(58svh, 100vw * 1.1), 640px)" }}>
        <div className="absolute inset-x-0 bottom-[2.5%] top-0">
          {groups.map((g) => (
            <Stage key={g.id} ctl={ctl} cat={g.cat} out={g.out} mode={g.out ? "A" : mode} idx={g.out ? 0 : idx} onIdx={setIdx} onSwipeCat={swipeCat} onEnterB={() => setMode("B")} onSelect={select} />
          ))}
          {clip && mode === "A" && (
            <video src={clip} muted playsInline preload="auto" aria-hidden="true" onLoadedMetadata={(e) => { ctl.video = e.currentTarget; ctl.seeked = -1; }} onError={() => { ctl.video = null; setClip(null); }} className="absolute left-1/2 bottom-0 -translate-x-1/2 pointer-events-none opacity-0 transition-opacity duration-150" style={{ height: "var(--ph)" }} />
          )}
        </div>
      </div>

      {/* turn slider: always visible in State A */}
      <div className={`absolute inset-x-0 bottom-[calc(25svh-60px)] md:bottom-[calc(26svh-64px)] flex justify-center transition-[opacity,transform] duration-[600ms] ${mode === "A" ? "opacity-100" : "opacity-0 translate-y-2 pointer-events-none"}`} style={{ transitionTimingFunction: EASE }}>
        <TurnSlider ctl={ctl} className="w-[min(56vw,280px)]" />
      </div>

      {/* B: style label under the strip */}
      <div className={`absolute inset-x-0 bottom-[calc(25svh-48px)] md:bottom-[calc(26svh-52px)] text-center pointer-events-none transition-[opacity,transform] duration-[600ms] ${mode === "B" ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"}`} style={{ transitionTimingFunction: EASE }}>
        <p key={current.slug} className="sc-label text-[12.5px] md:text-[15px] uppercase tracking-[0.3em] pl-[0.3em]">{current.name}</p>
        <p className="text-[12.5px] text-stone mt-0.5"><span className="text-wine">{money(effectivePrice(current))}</span>{current.salePrice && <s className="ml-2 opacity-60">{money(current.price)}</s>}</p>
      </div>

      {/* controls: chips + pill */}
      <div className="absolute inset-x-0 bottom-0 pb-[max(20px,env(safe-area-inset-bottom))] flex flex-col items-center gap-4 md:gap-5 pt-3">
        <div className={`flex items-center gap-2 md:gap-3 transition-[opacity,transform] duration-[600ms] ${mode === "B" ? "opacity-0 translate-y-2 pointer-events-none" : "opacity-100 translate-y-0"}`} style={{ transitionTimingFunction: EASE }} role="group" aria-label="Categories">
          <button className="w-11 h-11 flex items-center justify-center text-ink/90 hover:text-ink transition-colors" onClick={() => swipeCat(-1)} aria-label="Previous category"><Icon name="chevron" className="rotate-180" size={18} /></button>
          {CATEGORIES.map((c) => <Chip key={c.id} slug={c.thumbnail} label={c.label} on={c.id === cat} onClick={() => setCat(c.id)} />)}
          <button className="w-11 h-11 flex items-center justify-center text-ink/90 hover:text-ink transition-colors" onClick={() => swipeCat(1)} aria-label="Next category"><Icon name="chevron" size={18} /></button>
        </div>
        <div className="flex items-center gap-3">
          {mode === "B" && <button className="btn btn-line !min-h-[48px] !px-6" onClick={() => setMode("A")}>Back</button>}
          <button className="btn btn-solid !px-9 md:!px-11" onClick={() => (mode === "A" ? setMode("B") : select())}>{mode === "A" ? "Choose your style" : "Select this style"}</button>
          {mode === "B" && (
            <span className="hidden md:flex gap-1">
              <button className="w-11 h-11 rounded-full border hair flex items-center justify-center hover:bg-ink hover:text-snow transition-colors disabled:opacity-30" onClick={() => setIdx((i) => clamp(i - 1, 0, 3))} disabled={idx === 0} aria-label="Previous style"><Icon name="chevron" className="rotate-180" size={16} /></button>
              <button className="w-11 h-11 rounded-full border hair flex items-center justify-center hover:bg-ink hover:text-snow transition-colors disabled:opacity-30" onClick={() => setIdx((i) => clamp(i + 1, 0, 3))} disabled={idx === 3} aria-label="Next style"><Icon name="chevron" size={16} /></button>
            </span>
          )}
        </div>
      </div>
      {mode === "B" && (
        <div className="md:hidden absolute inset-x-0 bottom-[calc(25svh+8px)] flex justify-between px-3 pointer-events-none">
          <button className="pointer-events-auto w-11 h-11 rounded-full bg-snow/80 border hair flex items-center justify-center disabled:opacity-30" onClick={() => setIdx((i) => clamp(i - 1, 0, 3))} disabled={idx === 0} aria-label="Previous style"><Icon name="chevron" className="rotate-180" size={16} /></button>
          <button className="pointer-events-auto w-11 h-11 rounded-full bg-snow/80 border hair flex items-center justify-center disabled:opacity-30" onClick={() => setIdx((i) => clamp(i + 1, 0, 3))} disabled={idx === 3} aria-label="Next style"><Icon name="chevron" size={16} /></button>
        </div>
      )}

      {/* vertical social icons (left edge) */}
      <ul className="hidden md:flex absolute left-5 lg:left-8 top-1/2 -translate-y-1/2 flex-col items-center gap-1 text-ink/90">
        <li className="w-px h-14 bg-ink/20 mx-auto mb-2" aria-hidden="true" />
        {SOCIAL.map(([ic, label, href]) => <li key={ic}><a href={href} target={ic === "mail" ? undefined : "_blank"} rel="noopener noreferrer" aria-label={label} className="w-11 h-11 flex items-center justify-center hover:text-wine hover:-translate-y-0.5 transition-[color,transform] duration-300"><Icon name={ic} size={18} /></a></li>)}
        <li className="w-px h-14 bg-ink/20 mx-auto mt-2" aria-hidden="true" />
      </ul>

      {/* tiny category description (bottom right) */}
      <p key={cat} className="sc-desc hidden lg:block absolute right-8 lg:right-12 bottom-8 max-w-[260px] text-[12.5px] leading-relaxed text-stone text-right">{info.description}</p>
    </section>
  );
}

/** read the LITE flag outside React (used inside an effect) */
function usePerfLiteNow() { return document.documentElement.dataset.lite === "1"; }

function Chip({ slug, label, on, onClick }: { slug: string; label: string; on: boolean; onClick: () => void }) {
  const p = useMemo(() => stylesOf("hoodies").concat(stylesOf("tshirts"), stylesOf("trousers"), stylesOf("jackets")).find((x) => x.slug === slug)!, [slug]);
  const { card } = useImg(p);
  return (
    <button onClick={onClick} aria-label={label} aria-pressed={on} className="group relative w-11 h-11 md:w-12 md:h-12 flex items-center justify-center">
      <span className={`absolute inset-0 rounded-full border transition-[transform,border-color,opacity] duration-500 ${on ? "border-ink scale-100" : "border-ink/20 scale-90 opacity-80 group-hover:scale-100 group-hover:border-ink/50"}`} style={{ transitionTimingFunction: EASE }} />
      <span className="relative w-[34px] h-[34px] md:w-[38px] md:h-[38px] rounded-full overflow-hidden bg-mist">
        {card ? <img src={card} alt="" draggable={false} loading="lazy" decoding="async" className="absolute inset-0 w-full h-full object-cover object-top" style={{ transform: "scale(1.5)", transformOrigin: "50% 4%" }} /> : <Silhouette category={p.category} className="absolute inset-0 w-full h-full" />}
      </span>
    </button>
  );
}
