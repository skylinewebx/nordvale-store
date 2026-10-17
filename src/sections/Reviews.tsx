import { memo, useEffect, useRef, useState } from "react";
import { AnimatePresence, m } from "framer-motion";
import { Icon, Stars } from "../components/Icons";
import { SectionHead } from "../components/ui";
import { Review, reviews } from "../data/content";
import { reducedMotion } from "../lib/env";
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
      className="relative flex items-center gap-2 min-h-[44px] pr-2 -ml-2 pl-2 text-[12.5px] text-stone"
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

const ReviewCard = memo(function ReviewCard({ r }: { r: Review }) {
  const initials = r.name.split(" ").map((n) => n[0]).join("");
  return (
    <article className="rv-card shrink-0 mr-5 md:mr-6 w-[82vw] sm:w-[400px] bg-mist border hair p-7 md:p-8 flex flex-col gap-5 select-none">
      <Stars value={r.rating} />
      <blockquote className="font-display text-[22px] md:text-[24px] leading-[1.25] flex-1">“{r.text}”</blockquote>
      <footer className="flex items-center justify-between gap-3 pt-4 border-t hair">
        <div className="flex items-center gap-3 min-w-0">
          <span aria-hidden="true" className="w-10 h-10 rounded-full shrink-0 flex items-center justify-center text-[12.5px] font-medium tracking-wider bg-accent text-white">{initials}</span>
          <p className="text-[12.5px] text-stone truncate"><span className="text-ink font-medium">{r.name}</span><br />{r.product} · Verified buyer</p>
        </div>
        <LikeButton id={r.id} base={r.likes} onLike={() => {}} />
      </footer>
    </article>
  );
});

/** Endless row: the list is rendered twice and the track slides -50% (seamless). CSS only, compositor-driven. */
function Row({ items, rev, speed, swipe }: { items: Review[]; rev?: boolean; speed: number; swipe: boolean }) {
  const list = swipe ? items : [...items, ...items];
  return (
    <div className={`rv-row ${rev ? "rev" : ""} ${swipe ? "rv-scroll no-scrollbar" : ""}`} style={{ "--rv": `${Math.round(items.length * 400 / speed)}s` } as React.CSSProperties} role="region" aria-roledescription="carousel" aria-label={rev ? "Customer reviews, second row" : "Customer reviews"}>
      <div className={swipe ? "flex w-max px-5" : "rv-track py-3"}>
        {list.map((r, i) => <ReviewCard key={`${r.id}-${i}`} r={r} />)}
      </div>
    </div>
  );
}

export default function Reviews() {
  const swipe = reducedMotion(); // reduced motion: native swipe row, no auto-movement
  const sec = useRef<HTMLElement>(null);
  useEffect(() => {
    const el = sec.current; if (!el) return;
    const io = new IntersectionObserver(([e]) => { el.dataset.live = e.isIntersecting ? "1" : "0"; }, { rootMargin: "80px" });
    io.observe(el); return () => io.disconnect();
  }, []);
  const rev = [...reviews].reverse();
  return (
    <section ref={sec} id="reviews" className="py-24 md:py-36 bg-snow overflow-hidden border-t hair">
      <div className="wrap">
        <SectionHead eyebrow="Reviews" title={<>Loved by <em>12,000+</em> customers.</>} />
        <div className="flex items-center gap-3 -mt-6 mb-12 text-[15px] text-stone"><Stars value={4.7} size={14} />4.7 average · 1,240 verified reviews</div>
      </div>
      <div className="space-y-5 md:space-y-6">
        <Row items={reviews} speed={34} swipe={swipe} />
        {!swipe && <div className="hidden md:block"><Row items={rev} rev speed={28} swipe={false} /></div>}
      </div>
      <p className="wrap mt-8 text-[12.5px] text-stone">{swipe ? "Swipe to browse · tap the heart to like" : "Hover or press to pause · tap the heart to like"}</p>
    </section>
  );
}
