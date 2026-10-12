import { useEffect, useRef } from "react";
import { reducedMotion } from "../lib/env";

// Thin reading-progress line at the very top. One passive scroll listener, one transform write per frame.
export default function ScrollProgress() {
  const bar = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (reducedMotion()) return;
    let raf = 0;
    const update = () => {
      raf = 0;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      if (bar.current) bar.current.style.transform = `scaleX(${max > 0 ? Math.min(1, window.scrollY / max) : 0})`;
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(update); };
    window.addEventListener("scroll", onScroll, { passive: true });
    update();
    return () => { window.removeEventListener("scroll", onScroll); cancelAnimationFrame(raf); };
  }, []);
  return <div className="fixed top-0 left-0 right-0 h-[2px] z-[95] pointer-events-none" aria-hidden="true"><div ref={bar} className="h-full bg-accent origin-left" style={{ transform: "scaleX(0)" }} /></div>;
}
