import { memo, useEffect, useRef, useState } from "react";
import { AnimatePresence, m, useAnimationControls, useAnimationFrame, useMotionValue } from "framer-motion";
import { Icon, Stars } from "../components/Icons";
import { SectionHead } from "../components/ui";
import { Review, reviews } from "../data/content";
import { reducedMotion, usePerfLite } from "../lib/env";
import { useStore } from "../store/useStore";

const BURST = Array.from({ length: 8 }, (_, i) => (i / 8) * Math.PI * 2);

function LikeButton({ id, base, onLike }: { id: string; base: number; onLike: () => void }) {
  const liked = useStore((s) => s.liked.includes(id)); const toggle = useStore((s) => s.toggleLike);
  const [burst, setBurst] = useState(0);
  const count = base + (liked ? 1 : 0);
  return (
    <button
      onClick={() => { toggle(id); if (!liked) { setBurst((b) => b + 1); onLike(); } }}
      aria-pressed={liked} aria-label={`${liked ? "Unlike" : "Like"} this review, ${count} likes`}
      className="relative flex items-center gap-2 min-h-[44px] pr-2 -ml-2 pl-2 text-[12px] text-stone"
    >
      <span className="relative w-5 h-5 flex items-center justify-center">
        <m.span key={`h${burst}`} initial={false} animate={liked ? { scale: [1, 1.55, 0.9, 1] } : { scale: 1 }} transition={{ duration: 0.45, ease: "easeOut" }} className={liked ? "text-accent" : ""}>
          <Icon name="heart" size={18} className={liked ? "fill-current" : ""} />
        </m.span>
        <AnimatePresence>
          {burst > 0 && liked && BURST.map((a, i) => (
            <m.span key={`${burst}-${i}`} className="absolute left-1/2 top-1/2 w-[3px] h-[3px] rounded-full bg-accent pointer-events-none"
              initial={{ x: 0, y: 0, opacity: 1, scale: 1 }} animate={{ x: Math.cos(a) * 18, y: Math.sin(a) * 18, opacity: 0, scale: 0.4 }} transition={{ duration: 0.6, ease: "easeOut" }} />
          ))}
        </AnimatePresence>
      </span>
      <span className="relative h-[18px] overflow-hidden tabular-nums min-w-[1.5ch]">
        <AnimatePresence mode="popLayout" initial={false}>
          <m.span key={count} className="block leading-[18px]" initial={{ y: liked ? 14 : -14, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: liked ? -14 : 14, opacity: 0 }} transition={{ duration: 0.28 }}>{count}</m.span>
        </AnimatePresence>
      </span>
    </button>
  );
}

const ReviewCard = memo(function ReviewCard({ r, i, lite }: { r: Review; i: number; lite: boolean }) {
  const wiggle = useAnimationControls();
  const initials = r.name.split(" ").map((n) => n[0]).join("");
  return (
    // outer: endless gentle breathing · inner: wiggle/lift when liked
    // CSS keyframes (compositor-only transform) instead of per-frame JS; they only run while the section is on screen and not in LITE mode
    <div className="breathe shrink-0 w-[78vw] sm:w-[380px]" style={{ "--d": `${5 + (i % 4) * 0.9}s`, "--dl": `-${(i % 5) * 0.9}s`, "--r": i % 2 ? "0.4deg" : "-0.4deg" } as React.CSSProperties}>
      <m.article animate={wiggle} whileHover={{ y: -4 }} className="bg-snow border hair p-7 md:p-8 h-full flex flex-col gap-5 select-none">
        <Stars value={r.rating} />
        <blockquote className="font-display text-[20px] md:text-[21px] leading-snug flex-1">“{r.text}”</blockquote>
        <footer className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <span aria-hidden="true" className="w-10 h-10 rounded-full shrink-0 flex items-center justify-center text-[12px] tracking-wider text-ink/80 border hair" style={{ background: `linear-gradient(145deg, hsl(${(r.avatar * 47) % 360} 22% 90%), hsl(${(r.avatar * 47 + 30) % 360} 18% 80%))` }}>{initials}</span>
            <p className="text-[12px] text-stone truncate"><span className="text-ink">{r.name}</span><br />{r.product} · Verified buyer</p>
          </div>
          <LikeButton id={r.id} base={r.likes} onLike={() => wiggle.start({ rotate: [0, -2.5, 2.5, -1.5, 0], y: [0, -8, 0], transition: { duration: 0.6 } })} />
        </footer>
      </m.article>
    </div>
  );
});

// Endless drifting row. Pauses on hover/touch/drag; draggable (swipe) on touch. Doubled content gives a seamless loop.
function Row({ items, dir, speed, lite, live }: { items: Review[]; dir: 1 | -1; speed: number; lite: boolean; live: React.MutableRefObject<boolean> }) {
  const x = useMotionValue(0); const track = useRef<HTMLDivElement>(null);
  const half = useRef(0); const hold = useRef(0); const resume = useRef<number>();
  useEffect(() => {
    const measure = () => { half.current = (track.current?.scrollWidth ?? 0) / 2; if (dir === 1 && half.current) x.set(-half.current / 2); };
    measure(); const ro = new ResizeObserver(measure); track.current && ro.observe(track.current); return () => ro.disconnect();
  }, [dir, x]);
  const wrap = (v: number) => { const h = half.current; if (!h) return v; if (v <= -h) return v + h; if (v > 0) return v - h; return v; };
  useAnimationFrame((_, dt) => { if (lite || !live.current || hold.current > 0) return; x.set(wrap(x.get() - dir * speed * Math.min(dt, 50) / 1000)); });
  const pause = () => { hold.current++; window.clearTimeout(resume.current); };
  const release = (delay = 0) => { resume.current = window.setTimeout(() => (hold.current = Math.max(0, hold.current - 1)), delay); };
  const doubled = [...items, ...items];
  return (
    <div className={`py-4 -my-4 ${lite ? "overflow-x-auto no-scrollbar" : "overflow-hidden"}`} onMouseEnter={pause} onMouseLeave={() => release()} aria-roledescription="carousel">
      <m.div ref={track} className="flex gap-5 md:gap-6 w-max px-5" style={{ x }}
        drag={lite ? false : "x"} dragMomentum={false}
        onPointerDown={(e) => { if (e.pointerType === "touch") pause(); }} onPointerUp={(e) => { if (e.pointerType === "touch") release(1600); }}
        onDragStart={pause} onDrag={() => x.set(wrap(x.get()))} onDragEnd={() => release(1600)}>
        {doubled.map((r, i) => <ReviewCard key={`${r.id}-${i}`} r={r} i={i} lite={lite} />)}
      </m.div>
    </div>
  );
}

export default function Reviews() {
  const lite = usePerfLite();
  const reduced = reducedMotion();
  const sec = useRef<HTMLElement>(null); const live = useRef(false);
  useEffect(() => {
    const el = sec.current; if (!el) return;
    const io = new IntersectionObserver(([e]) => { live.current = e.isIntersecting; el.dataset.live = e.isIntersecting && !lite ? "1" : "0"; }, { rootMargin: "80px" });
    io.observe(el); return () => io.disconnect();
  }, [lite]);
  return (
    <section ref={sec} id="reviews" className="py-24 md:py-36 bg-mist/50 overflow-hidden">
      <div className="wrap">
        <SectionHead eyebrow="Reviews" title={<>Loved by <em>12,000+</em> customers.</>} />
        <div className="flex items-center gap-3 -mt-6 mb-12 text-[13px] text-stone"><Stars value={4.7} size={14} />4.7 average · 1,240 verified reviews</div>
      </div>
      {reduced ? (
        <div className="flex gap-5 overflow-x-auto px-5 pb-4 snap-x no-scrollbar">{reviews.map((r, i) => <div key={r.id} className="snap-center"><ReviewCard r={r} i={i} lite /></div>)}</div>
      ) : (
        <m.div className="space-y-6 md:space-y-8" initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-8% 0px" }} transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}>
          <Row items={reviews} dir={1} speed={34} lite={lite} live={live} />
          <div className="hidden md:block"><Row items={[...reviews].reverse()} dir={-1} speed={26} lite={lite} live={live} /></div>
        </m.div>
      )}
      <p className="wrap mt-8 text-[11px] text-stone md:hidden">Swipe to browse · tap the heart to like</p>
    </section>
  );
}
