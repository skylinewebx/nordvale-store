import { create } from "zustand";

export const reducedMotion = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
export const isTouch = () => typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches;
export const isMobile = () => typeof window !== "undefined" && (window.matchMedia("(max-width: 768px)").matches || isTouch());
export const saveDataOn = () => !!(navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData;

export function webglSupported() {
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") || c.getContext("webgl"));
  } catch { return false; }
}

/** Hardware hint for LITE mode: 4 cores or fewer, or 4 GB of memory or less. */
export function lowEndDevice() {
  const nav = navigator as Navigator & { deviceMemory?: number };
  return (nav.hardwareConcurrency ?? 8) <= 4 || (nav.deviceMemory ?? 8) <= 4;
}

/** Very weak devices only: use the static hero image straight away. */
export function veryLowEnd() {
  const nav = navigator as Navigator & { deviceMemory?: number };
  return (nav.hardwareConcurrency ?? 8) <= 2 || (nav.deviceMemory ?? 8) <= 2;
}

// ── LITE mode: fewer particles, no parallax layers, simple fades only ──
// On when: reduced motion, data saver, low-end hardware, or the FPS monitor (lib/perf.ts) saw < 45 FPS for 2 s.
export const useLite = create<{ fps: boolean }>(() => ({ fps: false }));
export const perfLite = () => reducedMotion() || saveDataOn() || lowEndDevice() || useLite.getState().fps;
/** Reactive version for components that must switch at runtime. */
export const usePerfLite = () => { const fps = useLite((s) => s.fps); return fps || reducedMotion() || saveDataOn() || lowEndDevice(); };
