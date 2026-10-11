import { create } from "zustand";
import { loadImage } from "./imageCache";

// Product-photo manifest produced by `npm run images` (public/assets/products/manifest.json).
// It lists which photos / videos exist, their sizes and a 24px base64 LQIP, so the browser never probes for 404s.
export interface CatItem { w: number; h: number; cw: number; ch: number; lqip: string; v: string; video?: boolean; vv?: string }
interface Cat { items: Record<string, CatItem>; loaded: boolean }
export const useCatalog = create<Cat>(() => ({ items: {}, loaded: false }));

export const cardUrl = (key: string, it: CatItem) => `/assets/products/${key}-card.webp?v=${it.v}`;
export const detailUrl = (key: string, it: CatItem) => `/assets/products/${key}.webp?v=${it.v}`;
export const videoUrl = (key: string, it: CatItem) => `/assets/products/${key}.mp4?v=${it.vv ?? "1"}`;

export const saveData = () => !!(navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData;
const slowNet = () => /(^|-)2g$/.test((navigator as Navigator & { connection?: { effectiveType?: string } }).connection?.effectiveType ?? "");

let readyRes: () => void = () => {};
export const catalogReady = new Promise<void>((r) => (readyRes = r));

export async function loadCatalog() {
  try {
    const r = await fetch("/assets/products/manifest.json", { cache: "no-cache" });
    if (r.ok && (r.headers.get("content-type") ?? "").includes("json")) {
      const j = await r.json();
      useCatalog.setState({ items: j.items ?? {}, loaded: true });
    } else useCatalog.setState({ loaded: true });
  } catch { useCatalog.setState({ loaded: true }); }
  readyRes();
}

// ── Speed: priority-load what's on screen first, then warm EVERY card image in idle time ──
const idle = (fn: () => void) => ("requestIdleCallback" in window ? (window as Window & { requestIdleCallback: (f: () => void, o?: object) => void }).requestIdleCallback(fn, { timeout: 1500 }) : setTimeout(fn, 120));

export function preloadHigh(urls: string[]) {
  for (const u of urls) {
    const l = document.createElement("link");
    l.rel = "preload"; l.as = "image"; l.href = u; l.setAttribute("fetchpriority", "high");
    document.head.appendChild(l);
    loadImage(u, "high").catch(() => {});
  }
}

/** order = card URLs in the order we want them (default colours of every product first). */
export function warmCards(order: string[]) {
  if (saveData() || slowNet()) return; // data saver: only what is visible
  let i = 0;
  const step = () => {
    const batch = order.slice(i, i + 6); i += 6;
    Promise.allSettled(batch.map((u) => loadImage(u, "low"))).then(() => { if (i < order.length) idle(step); });
  };
  idle(step);
}
