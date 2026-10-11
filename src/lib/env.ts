export const reducedMotion = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
export const isMobile = () => typeof window !== "undefined" && (window.matchMedia("(max-width: 768px)").matches || "ontouchstart" in window);

/** True when we should skip decorative motion (parallax, breathing, auto-marquee). */
export const perfLite = () => reducedMotion() || lowEndDevice();

export function webglSupported() {
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") || c.getContext("webgl"));
  } catch { return false; }
}

// Cheap hardware hint: few cores or little memory → use the image sequence straight away.
export function lowEndDevice() {
  const nav = navigator as Navigator & { deviceMemory?: number };
  return (nav.hardwareConcurrency ?? 8) <= 3 || (nav.deviceMemory ?? 8) <= 2;
}
