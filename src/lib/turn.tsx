import { ReactNode, useEffect, useLayoutEffect, useRef, useState } from "react";
import { reducedMotion } from "./env";

/**
 * "Drag to turn". One controller drives:
 *  - a real 3D turn with CSS perspective (rotateY ±35°, slight scale, stretching floor shadow, soft light sweep) when there is no video,
 *  - or the scrubbing of a {slug}-{colour}.mp4 / category clip (lerped, seeks only on real change) when a video exists.
 * One requestAnimationFrame loop, transform / opacity only, paused off-screen.
 */
const MAX_DEG = 35;
const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

export class Turn {
  t = 0; target = 0; vel = 0;
  dragging = false; used = false; visible = true; raf = 0; last = 0; start = { x: 0, t: 0 }; lx = 0; lt = 0; dv = 0;
  rot: HTMLElement | null = null; shadow: HTMLElement | null = null; light: HTMLElement | null = null;
  handle: HTMLElement | null = null; track: HTMLElement | null = null; hint: HTMLElement | null = null;
  video: HTMLVideoElement | null = null; seeked = -1; reduced = reducedMotion();
  listeners = new Set<() => void>();
  onUsed = () => { this.listeners.forEach((f) => f()); };

  hasVideo() { return !!this.video && !!this.video.duration; }

  grab(x: number) { this.dragging = true; this.start = { x, t: this.t }; this.lx = x; this.lt = performance.now(); this.dv = 0; this.markUsed(); this.kick(); }
  move(x: number, width: number) {
    if (!this.dragging) return;
    const now = performance.now();
    this.dv = this.dv * 0.7 + ((x - this.lx) / Math.max(1, now - this.lt)) * 0.3; this.lx = x; this.lt = now;
    this.target = clamp(this.start.t + (x - this.start.x) / (width * 0.55), -1, 1); this.kick();
  }
  release() {
    if (!this.dragging) return; this.dragging = false;
    if (!this.hasVideo()) this.vel = clamp(this.dv * 2.2, -3, 3); // inertia: swing a little further, then ease back to the front
    this.kick();
  }
  /** slider: absolute position 0..1 */
  setFromSlider(p: number) { this.dragging = true; this.target = clamp(p * 2 - 1, -1, 1); this.markUsed(); this.kick(); }
  sliderEnd() { this.dragging = false; this.vel = 0; this.kick(); }

  markUsed() { if (!this.used) { this.used = true; this.onUsed(); } }
  setVisible(v: boolean) { this.visible = v; if (v) this.kick(); else { cancelAnimationFrame(this.raf); this.raf = 0; } }
  kick() { if (!this.raf && this.visible) { this.last = 0; this.raf = requestAnimationFrame(this.loop); } }

  loop = (now: number) => {
    this.raf = 0;
    const dt = Math.min(0.05, (now - (this.last || now)) / 1000); this.last = now;
    const video = this.hasVideo();
    if (this.dragging) { this.t += (this.target - this.t) * Math.min(1, dt * 22); this.vel = 0; }
    else if (video) { this.t += (this.target - this.t) * Math.min(1, dt * 10); }
    else {
      // spring back to the front (slightly under-damped, so it overshoots a little after a fling)
      const sway = !this.used && !this.reduced ? Math.sin(now / 1000 * 0.9) * 0.13 : 0;
      this.vel += (-(this.t - sway) * 38 - this.vel * 7.5) * dt; this.t += this.vel * dt;
    }
    this.apply();
    const moving = this.dragging || Math.abs(this.vel) > 0.004 || Math.abs(video ? this.target - this.t : this.t) > 0.002 || (!this.used && !this.reduced);
    if (moving && this.visible) this.raf = requestAnimationFrame(this.loop);
  };

  apply() {
    const t = clamp(this.t, -1.15, 1.15), a = Math.abs(t);
    const video = this.hasVideo();
    if (this.rot) this.rot.style.transform = video ? "none" : `perspective(1100px) rotateY(${(t * MAX_DEG).toFixed(2)}deg) scale(${(1 - 0.045 * a).toFixed(3)})`;
    if (this.shadow) { this.shadow.style.transform = `translate3d(${(t * 6).toFixed(1)}%, 0, 0) scaleX(${(1 + 0.42 * a).toFixed(3)})`; this.shadow.style.opacity = String((1 - 0.25 * a).toFixed(2)); }
    if (this.light) { this.light.style.transform = `translate3d(${(t * 70).toFixed(1)}%, 0, 0)`; this.light.style.opacity = video ? "0" : String(Math.min(0.3, 0.06 + a * 0.3).toFixed(2)); }
    if (this.handle && this.track) this.handle.style.transform = `translate3d(${(((t + 1) / 2) * this.track.clientWidth).toFixed(1)}px, -50%, 0)`;
    if (video && this.video) {
      const to = clamp((t + 1) / 2, 0, 1) * this.video.duration;
      if (Math.abs(to - this.seeked) > 0.02) { this.video.currentTime = to; this.seeked = to; }
      this.video.style.opacity = this.used ? "1" : "0";
    }
  }
}

export function useTurn() { const r = useRef<Turn>(); if (!r.current) r.current = new Turn(); return r.current; }

/** Wrap the product: it is the element that rotates; a light sweep (masked by the garment's own alpha) and the floor shadow follow the turn. */
export function TurnTarget({ ctl, active = true, maskUrl, children, className = "" }: { ctl: Turn; active?: boolean; maskUrl?: string | null; children: ReactNode; className?: string }) {
  const rot = useRef<HTMLDivElement>(null); const light = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    if (!active) return;
    ctl.rot = rot.current; ctl.light = light.current; ctl.apply(); ctl.kick();
    return () => { if (ctl.rot === rot.current) { ctl.rot = null; ctl.light = null; } };
  }, [ctl, active]);
  return (
    <div ref={rot} className={`absolute inset-0 ${className}`} style={{ transformOrigin: "50% 100%", willChange: active ? "transform" : undefined }}>
      {children}
      {maskUrl && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ WebkitMaskImage: `url(${maskUrl})`, maskImage: `url(${maskUrl})`, WebkitMaskSize: "contain", maskSize: "contain", WebkitMaskPosition: "50% 100%", maskPosition: "50% 100%", WebkitMaskRepeat: "no-repeat", maskRepeat: "no-repeat" }}>
          <div ref={light} className="absolute inset-y-0 -left-1/2 w-[70%] opacity-0" style={{ background: "linear-gradient(100deg, transparent 0%, rgba(255,255,255,0.0) 20%, rgba(255,250,240,0.85) 50%, rgba(255,255,255,0) 80%, transparent 100%)", mixBlendMode: "soft-light", left: "15%" }} />
        </div>
      )}
    </div>
  );
}

/** the floor shadow that stretches while he turns (place it under the product, inside the same positioned box) */
export function TurnShadow({ ctl, className = "" }: { ctl: Turn; className?: string }) {
  const el = useRef<HTMLSpanElement>(null);
  useLayoutEffect(() => { ctl.shadow = el.current; ctl.apply(); return () => { if (ctl.shadow === el.current) ctl.shadow = null; }; }, [ctl]);
  return <span ref={el} className={`absolute pointer-events-none ${className}`} style={{ background: "radial-gradient(ellipse at center, rgba(38,34,33,0.42) 0%, rgba(38,34,33,0.16) 46%, transparent 72%)", transformOrigin: "50% 50%" }} />;
}

/** thin slider with a round handle: always visible, with a "Drag to turn" hint that fades after the first use */
export function TurnSlider({ ctl, className = "" }: { ctl: Turn; className?: string }) {
  const track = useRef<HTMLDivElement>(null); const handle = useRef<HTMLSpanElement>(null);
  const [used, setUsed] = useState(ctl.used);
  useLayoutEffect(() => { ctl.track = track.current; ctl.handle = handle.current; ctl.apply(); return () => { ctl.track = null; ctl.handle = null; }; }, [ctl]);
  useEffect(() => { const f = () => setUsed(true); ctl.listeners.add(f); return () => { ctl.listeners.delete(f); }; }, [ctl]);
  const pos = (e: React.PointerEvent) => { const r = track.current!.getBoundingClientRect(); return clamp((e.clientX - r.left) / r.width, 0, 1); };
  return (
    <div className={`select-none ${className}`}>
      <p className={`text-center text-[10px] uppercase tracking-[0.3em] pl-[0.3em] text-stone transition-opacity duration-[1200ms] ${used ? "opacity-0" : "opacity-100"}`} aria-hidden={used}>Drag to turn</p>
      <div ref={track} className="relative h-7 mt-1 cursor-grab active:cursor-grabbing touch-none" role="slider" aria-label="Turn the model" aria-valuemin={-35} aria-valuemax={35} aria-valuenow={Math.round(ctl.t * 35)} tabIndex={0}
        onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); ctl.setFromSlider(pos(e)); }}
        onPointerMove={(e) => { if (ctl.dragging) ctl.setFromSlider(pos(e)); }}
        onPointerUp={() => ctl.sliderEnd()} onPointerCancel={() => ctl.sliderEnd()}
        onKeyDown={(e) => { if (e.key === "ArrowRight" || e.key === "ArrowLeft") { e.preventDefault(); ctl.markUsed(); ctl.target = clamp(ctl.target + (e.key === "ArrowRight" ? 0.25 : -0.25), -1, 1); ctl.dragging = true; ctl.kick(); setTimeout(() => ctl.sliderEnd(), 500); } }}>
        <span className="absolute left-0 right-0 top-1/2 h-px bg-ink/25" />
        <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-px h-2 bg-ink/35" aria-hidden="true" />
        <span ref={handle} className="absolute left-0 top-1/2 -ml-[9px] w-[18px] h-[18px] rounded-full bg-snow border border-ink shadow-[0_2px_8px_rgba(38,34,33,0.2)] will-change-transform" />
      </div>
    </div>
  );
}
