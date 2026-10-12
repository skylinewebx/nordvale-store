import { useEffect, useState } from "react";
import { AnimatePresence, m, useMotionValue, useSpring, useTransform } from "framer-motion";
import { BRAND } from "../config/assets";
import { reducedMotion } from "../lib/env";
import { useHero } from "./heroState";

// Quiet, premium loader: wordmark rises letter by letter, a hairline fills with real progress,
// then the curtain lifts and the hero entrance starts (useHero.entered).
export default function Loader() {
  const ready = useHero((s) => s.ready);
  const own = useHero((s) => s.progress);
  const [minDone, setMinDone] = useState(false);
  const [force, setForce] = useState(false);
  const reduced = reducedMotion();

  useEffect(() => {
    useHero.getState().setEntered(false);
    const a = setTimeout(() => setMinDone(true), reduced ? 150 : 700);
    const b = setTimeout(() => setForce(true), 3500); // never trap the user
    return () => { clearTimeout(a); clearTimeout(b); };
  }, [reduced]);

  const target = ready ? 1 : Math.max(own, 0.06);
  const p = useMotionValue(0);
  const smooth = useSpring(p, { stiffness: 70, damping: 20, mass: 0.6 });
  useEffect(() => { p.set(Math.min(1, target)); }, [target, p]);
  const pct = useTransform(smooth, (v) => Math.round(v * 100));
  const [shown, setShown] = useState(0);
  useEffect(() => pct.on("change", setShown), [pct]);

  const done = (ready && minDone) || force;
  return (
    <AnimatePresence onExitComplete={() => useHero.getState().setEntered(true)}>
      {!done && (
        <m.div key="loader" className="fixed inset-0 z-[100] bg-snow flex flex-col items-center justify-center" exit={{ opacity: 0 }} transition={{ duration: 0.6, ease: [0.65, 0, 0.35, 1] }} role="status" aria-live="polite" aria-label="Loading">
          <div className="flex overflow-hidden font-display text-[clamp(22px,4vw,34px)] tracking-[0.4em] pl-[0.4em]" aria-hidden="true">
            {BRAND.name.split("").map((ch, i) => (
              <m.span key={i} initial={{ y: "110%" }} animate={{ y: 0 }} transition={{ delay: 0.08 * i + 0.1, duration: 0.9, ease: [0.22, 1, 0.36, 1] }} className="inline-block">{ch}</m.span>
            ))}
          </div>
          <m.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.9, duration: 0.8 }} className="eyebrow mt-4">Winter Collection</m.p>
          <div className="mt-10 w-44 h-px bg-ink/10 overflow-hidden"><m.div className="h-full bg-ink origin-left" style={{ scaleX: smooth }} /></div>
          <div className="eyebrow mt-4 tabular-nums">{ready && shown >= 99 ? 100 : shown}%</div>
        </m.div>
      )}
    </AnimatePresence>
  );
}
