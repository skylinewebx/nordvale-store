import { perfLite, useLite } from "./env";

// FPS monitor: while the visitor is actually scrolling, sample frame rate in 1 s windows.
// Two consecutive windows under 45 FPS switch the whole site to LITE mode (no parallax / particles / breathing).
export function startFpsMonitor() {
  if (perfLite()) { document.documentElement.dataset.lite = "1"; return; }
  let frames = 0, t0 = performance.now(), bad = 0, lastScroll = 0, raf = 0;
  const onScroll = () => { lastScroll = performance.now(); };
  window.addEventListener("scroll", onScroll, { passive: true });
  const tick = (t: number) => {
    frames++;
    if (t - t0 >= 1000) {
      const fps = (frames * 1000) / (t - t0);
      const scrolling = t - lastScroll < 600;
      if (scrolling && frames > 8 && !document.hidden) bad = fps < 45 ? bad + 1 : 0;
      frames = 0; t0 = t;
      if (bad >= 2) { useLite.setState({ fps: true }); document.documentElement.dataset.lite = "1"; window.removeEventListener("scroll", onScroll); return; }
    }
    raf = requestAnimationFrame(tick);
  };
  raf = requestAnimationFrame(tick);
  return () => { cancelAnimationFrame(raf); window.removeEventListener("scroll", onScroll); };
}
