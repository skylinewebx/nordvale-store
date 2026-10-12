import { useEffect, useRef } from "react";

// Two slowly drifting rows of large thin type between sections. CSS translate only; runs only while visible.
const WORDS = ["Heavyweight fleece", "French terry", "Faux leather", "Wool & tweed", "European linen", "Cotton jersey"];

function Row({ rev = false, outline = false }: { rev?: boolean; outline?: boolean }) {
  const line = [...WORDS, ...WORDS].map((w, i) => (
    <span key={i} className="inline-flex items-center gap-[4vw] pr-[4vw]">
      <span className={`font-display font-light text-[clamp(40px,8vw,120px)] leading-none whitespace-nowrap ${outline ? "text-transparent [-webkit-text-stroke:1px_rgba(28,28,30,0.35)]" : "text-ink/85"}`}>{w}</span>
      <span className="w-2 h-2 rounded-full bg-accent shrink-0" aria-hidden="true" />
    </span>
  ));
  return <div className={`band-track ${rev ? "rev" : ""} flex w-max will-change-transform`} style={{ ["--bd" as string]: outline ? "70s" : "55s" }}>{line}{line}</div>;
}

export default function TextBand() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const io = new IntersectionObserver(([e]) => { el.dataset.live = e.isIntersecting ? "1" : "0"; }, { rootMargin: "100px" });
    io.observe(el); return () => io.disconnect();
  }, []);
  return (
    <div ref={ref} className="py-16 md:py-24 overflow-hidden border-y hair space-y-4 md:space-y-6" aria-hidden="true">
      <Row />
      <Row rev outline />
    </div>
  );
}
