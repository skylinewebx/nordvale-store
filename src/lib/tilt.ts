import { useRef } from "react";

/**
 * Pointer-driven 3D tilt + spotlight for a card. Writes CSS variables (--rx --ry --mx --my) at most once per frame;
 * CSS (.tilt / .spot in index.css) turns them into a transform and a light that follows the cursor. Mouse only.
 */
export function useTilt(max = 7) {
  const ref = useRef<HTMLDivElement>(null);
  const raf = useRef(0);
  const pos = useRef({ x: 0.5, y: 0.5 });
  const apply = () => {
    raf.current = 0;
    const el = ref.current; if (!el) return;
    const { x, y } = pos.current;
    el.style.setProperty("--rx", `${((0.5 - y) * max * 2).toFixed(2)}deg`);
    el.style.setProperty("--ry", `${((x - 0.5) * max * 2).toFixed(2)}deg`);
    el.style.setProperty("--mx", `${(x * 100).toFixed(1)}%`);
    el.style.setProperty("--my", `${(y * 100).toFixed(1)}%`);
  };
  return {
    ref,
    onPointerMove: (e: React.PointerEvent) => {
      if (e.pointerType !== "mouse" || !ref.current) return;
      const r = ref.current.getBoundingClientRect();
      pos.current = { x: (e.clientX - r.left) / r.width, y: (e.clientY - r.top) / r.height };
      if (!raf.current) raf.current = requestAnimationFrame(apply);
    },
    onPointerLeave: () => {
      const el = ref.current; if (!el) return;
      cancelAnimationFrame(raf.current); raf.current = 0;
      el.style.setProperty("--rx", "0deg"); el.style.setProperty("--ry", "0deg");
    },
  };
}
