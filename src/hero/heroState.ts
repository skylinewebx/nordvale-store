import { create } from "zustand";
import { manifestReady, useManifest } from "../lib/assets";

// Tiny non-persisted store so the loader can reflect whichever hero mode is active.
export const useHero = create<{ progress: number; ready: boolean; entered: boolean; mode: "webgl" | "frames" | "static"; setProgress: (n: number) => void; setReady: () => void; setEntered: (v: boolean) => void; setMode: (m: "webgl" | "frames" | "static") => void }>((set) => ({
  progress: 0, ready: false, entered: false, mode: "webgl", // `entered` flips once the loader has finished leaving: the hero entrance starts then
  setEntered: (entered) => set({ entered }),
  setProgress: (n) => set((s) => (n > s.progress ? { progress: Math.min(1, n) } : s)),
  setReady: () => set({ ready: true, progress: 1 }),
  setMode: (mode) => set({ mode }),
}));

// Scroll progress shared with the render loops (0 = exploded, 1 = assembled). Mutated by GSAP, read per frame — no React re-renders.
export const heroProgress = { v: 0 };

// Returns true when the URL doesn't just return the SPA fallback HTML.
export async function assetExists(url: string): Promise<boolean> {
  await manifestReady;
  const files = useManifest.getState().files;
  if (files) return files.has(url); // manifest is authoritative: no probe requests, no 404s
  try {
    const r = await fetch(url, { method: "HEAD" });
    const t = r.headers.get("content-type") ?? "";
    return r.ok && !t.includes("text/html");
  } catch { return false; }
}
