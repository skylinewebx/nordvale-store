import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { isTouch, reducedMotion } from "./env";

gsap.registerPlugin(ScrollTrigger);

let lenis: Lenis | null = null;
export const getLenis = () => lenis;

/**
 * Smooth scroll on desktop only. Touch devices keep NATIVE scrolling (no hijack, best 60fps on phones).
 * One rAF loop drives both Lenis and GSAP; Lenis updates ScrollTrigger.
 */
export function initScroll() {
  ScrollTrigger.config({ ignoreMobileResize: true }); // no refresh when mobile URL bars show/hide
  gsap.ticker.lagSmoothing(0);
  if (lenis || reducedMotion() || isTouch()) return;
  lenis = new Lenis({ autoRaf: false, lerp: 0.1, wheelMultiplier: 1, smoothWheel: true, syncTouch: false });
  lenis.on("scroll", ScrollTrigger.update);
  gsap.ticker.add((t) => lenis!.raf(t * 1000));
}

/** ScrollTrigger.refresh once, after fonts and the first images have settled (never repeatedly). */
let refreshed = false;
export function refreshOnceWhenSettled() {
  if (refreshed) return; refreshed = true;
  const go = () => setTimeout(() => ScrollTrigger.refresh(), 120);
  const fonts = (document as Document & { fonts?: { ready: Promise<unknown> } }).fonts?.ready ?? Promise.resolve();
  Promise.all([fonts, new Promise<void>((r) => (document.readyState === "complete" ? r() : window.addEventListener("load", () => r(), { once: true })))]).then(go);
}

export function scrollToId(id: string) {
  const run = () => {
    const el = document.getElementById(id);
    if (!el) return false;
    if (lenis) lenis.scrollTo(el, { offset: -60 });
    else el.scrollIntoView({ behavior: reducedMotion() ? "auto" : "smooth" });
    return true;
  };
  if (run()) return;
  // sections below the fold mount after first paint: mount them now, then scroll
  window.dispatchEvent(new Event("nv-mount-sections"));
  requestAnimationFrame(() => requestAnimationFrame(run));
}

let locks = 0; // nested overlays (e.g. cart over product modal) share one lock
export const lockScroll = (lock: boolean) => {
  locks = Math.max(0, locks + (lock ? 1 : -1));
  if (locks > 0) lenis?.stop(); else lenis?.start();
  document.documentElement.style.overflow = locks > 0 ? "hidden" : "";
};
