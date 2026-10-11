import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { lowEndDevice, reducedMotion } from "./env";

gsap.registerPlugin(ScrollTrigger);

let lenis: Lenis | null = null;
export const getLenis = () => lenis;

export function initScroll() {
  if (lenis || reducedMotion()) return;
  // lerp-based smoothing feels more natural than a fixed duration; touch keeps native momentum.
  lenis = new Lenis({ lerp: lowEndDevice() ? 0.14 : 0.085, wheelMultiplier: 0.95, smoothWheel: true, syncTouch: false });
  lenis.on("scroll", ScrollTrigger.update); // one source of truth for ScrollTrigger
  gsap.ticker.add((t) => lenis!.raf(t * 1000)); // single rAF loop shared by GSAP + Lenis
  gsap.ticker.lagSmoothing(0);
  ScrollTrigger.config({ ignoreMobileResize: true }); // avoid layout thrash when mobile URL bars show/hide
}

export function scrollToId(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  if (lenis) lenis.scrollTo(el, { offset: -60 });
  else el.scrollIntoView({ behavior: reducedMotion() ? "auto" : "smooth" });
}

let locks = 0; // nested overlays (e.g. cart over product modal) share one lock
export const lockScroll = (lock: boolean) => {
  locks = Math.max(0, locks + (lock ? 1 : -1));
  if (locks > 0) lenis?.stop(); else lenis?.start();
  document.documentElement.style.overflow = locks > 0 ? "hidden" : "";
};

