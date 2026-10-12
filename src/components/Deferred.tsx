import { ReactNode, startTransition, useEffect, useRef, useState } from "react";
import { ScrollTrigger } from "gsap/ScrollTrigger";

// Mounts below-the-fold sections AFTER the first paint (page load + idle time), or earlier when the visitor gets near them
// (or jumps to an anchor). This keeps startup main-thread work small; the hero wrapper has a fixed height so nothing shifts.
export const MOUNT_EVENT = "nv-mount-sections";

export default function Deferred({ children, minHeight = "100vh", delay = 500, refresh = false }: { children: ReactNode; minHeight?: string; delay?: number; refresh?: boolean }) {
  const [on, setOn] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let done = false, t: ReturnType<typeof setTimeout>;
    const go = () => { if (!done) { done = true; startTransition(() => setOn(true)); } }; // transition: React time-slices the render instead of one long task
    const idle = () => ("requestIdleCallback" in window ? (window as Window & { requestIdleCallback: (f: () => void, o?: object) => void }).requestIdleCallback(go, { timeout: 2500 }) : setTimeout(go, 1500));
    const start = () => { t = setTimeout(idle, delay); }; // staggered per section so the mounts never pile into one long task
    if (document.readyState === "complete") start(); else window.addEventListener("load", start, { once: true });
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) go(); }, { rootMargin: "1600px" });
    if (ref.current) io.observe(ref.current);
    window.addEventListener(MOUNT_EVENT, go);
    return () => { clearTimeout(t); io.disconnect(); window.removeEventListener(MOUNT_EVENT, go); };
  }, []);
  // one ScrollTrigger.refresh, only after the LAST scroll-driven section has mounted (a refresh forces layout for every trigger)
  useEffect(() => { if (on && refresh) { const id = setTimeout(() => ScrollTrigger.refresh(), 150); return () => clearTimeout(id); } }, [on, refresh]);
  return on ? <>{children}</> : <div ref={ref} style={{ minHeight }} aria-hidden="true" />;
}
