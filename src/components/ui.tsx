import { ReactNode, useEffect, useRef } from "react";
import { m } from "framer-motion";
import { lockScroll } from "../lib/scroll";

export function Reveal({ children, delay = 0, className = "", y = 24 }: { children: ReactNode; delay?: number; className?: string; y?: number }) {
  return (
    <m.div className={className} initial={{ opacity: 0, y }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-8% 0px" }} transition={{ duration: 0.9, delay, ease: [0.22, 1, 0.36, 1] }}>
      {children}
    </m.div>
  );
}

// Word-by-word text reveal.
export function SplitReveal({ text, className = "" }: { text: string; className?: string }) {
  const words = text.split(" ");
  return (
    <m.p className={className} initial="h" whileInView="v" viewport={{ once: true, margin: "-10% 0px" }} transition={{ staggerChildren: 0.035 }} aria-label={text}>
      {words.map((w, i) => (
        <span key={i} className="inline-block overflow-hidden align-bottom" aria-hidden="true">
          <m.span className="inline-block" variants={{ h: { y: "105%", opacity: 0 }, v: { y: 0, opacity: 1 } }} transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}>{w}&nbsp;</m.span>
        </span>
      ))}
    </m.p>
  );
}

export function SectionHead({ eyebrow, title, className = "" }: { eyebrow: string; title: ReactNode; className?: string }) {
  return (
    <div className={`mb-10 md:mb-16 ${className}`}>
      <div className="flex items-center gap-4 overflow-hidden">
        <m.span className="block h-px w-10 bg-current opacity-40 origin-left" initial={{ scaleX: 0 }} whileInView={{ scaleX: 1 }} viewport={{ once: true, margin: "-8% 0px" }} transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }} />
        <m.p className="eyebrow" initial={{ opacity: 0, x: -12 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, margin: "-8% 0px" }} transition={{ duration: 0.8, delay: 0.1 }}>{eyebrow}</m.p>
      </div>
      <h2 className="mt-3 text-[clamp(28px,4.2vw,48px)] leading-[1.1] overflow-hidden pb-[0.12em]">
        <m.span className="block" initial={{ y: "105%" }} whileInView={{ y: 0 }} viewport={{ once: true, margin: "-8% 0px" }} transition={{ duration: 1.1, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}>{title}</m.span>
      </h2>
    </div>
  );
}

// Accessible modal/drawer shell: scroll lock, Esc to close, focus return.
export function Overlay({ open, onClose, side, label, children, z = 70 }: { open: boolean; onClose: () => void; side?: "right" | "center"; label: string; children: ReactNode; z?: number }) {
  const panel = useRef<HTMLDivElement>(null);
  useEffect(() => {
    // `inert` keeps the closed panel out of the tab order and accessibility tree.
    if (panel.current) (panel.current as HTMLElement & { inert: boolean }).inert = !open;
    if (!open) return;
    const prev = document.activeElement as HTMLElement | null;
    lockScroll(true);
    const k = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "Tab" && panel.current) {
        const f = panel.current.querySelectorAll<HTMLElement>("a[href],button:not(:disabled),input,select,textarea,[tabindex]:not([tabindex='-1'])");
        if (!f.length) return;
        const first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    window.addEventListener("keydown", k);
    setTimeout(() => panel.current?.focus(), 50);
    return () => { window.removeEventListener("keydown", k); lockScroll(false); prev?.focus?.(); };
  }, [open, onClose]);
  return (
    <>
      <m.div className="fixed inset-0 bg-ink/30" style={{ zIndex: z, pointerEvents: open ? "auto" : "none" }} initial={false} animate={open ? { opacity: 1, visibility: "visible" } : { opacity: 0, transitionEnd: { visibility: "hidden" } }} transition={{ duration: 0.4 }} onClick={onClose} aria-hidden="true" />
      <m.div
        ref={panel} tabIndex={-1} role="dialog" aria-modal="true" aria-label={label} aria-hidden={!open}
        className={side === "right" ? "fixed top-0 right-0 h-[100dvh] w-full sm:w-[440px] bg-snow outline-none flex flex-col" : "fixed inset-0 md:inset-8 bg-snow outline-none overflow-hidden flex flex-col"}
        style={{ zIndex: z + 1, pointerEvents: open ? "auto" : "none" }}
        initial={false}
        animate={open ? (side === "right" ? { x: 0, visibility: "visible" } : { opacity: 1, y: 0, visibility: "visible" }) : (side === "right" ? { x: "100%", transitionEnd: { visibility: "hidden" } } : { opacity: 0, y: 30, transitionEnd: { visibility: "hidden" } })} // hidden panels leave the compositor entirely
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        {children}
      </m.div>
    </>
  );
}
