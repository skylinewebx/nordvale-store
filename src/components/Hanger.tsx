import { CSSProperties, ReactNode } from "react";
import { Category } from "../data/products";

/** Tops (hoodies, jackets, t-shirts) are shown as ghost-mannequin garments that HANG; trousers keep the model photo + floor shadow. */
export const isHanging = (c: Category | string) => c !== "trousers";

/** width / height of the box a hanging garment lives in (hanger included). Used by the hero, the product page and the cards. */
export const HANG_ASPECT = 0.9;
/** share of the box height taken by the hanger: the garment image starts here and overlaps the bar */
export const HANG_TOP = "6.5%";

/** thin minimal hanger: hook + shoulder bar, drawn with one hairline stroke */
export function HangerSvg({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 240 96" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true" focusable="false">
      <path d="M120 46V33" />
      <path d="M120 33c0-6 8-8 11-13 3-5 1-12-6-13-6-1-10 4-9 9" />
      <path d="M120 46 14 83c-6 2-5 8 2 8h208c7 0 8-6 2-8z" />
    </svg>
  );
}

/** very gentle idle sway about the hook (rotation only, transform-only animation in index.css) */
export function Sway({ children, delay = 0, className = "" }: { children: ReactNode; delay?: number; className?: string }) {
  return <div className={`absolute inset-0 hang-sway ${className}`} style={{ transformOrigin: "50% 0%", ["--sd" as string]: `${-delay}s` } as CSSProperties}>{children}</div>;
}

/** the hanger (hook included) at the top, the garment image under it (it overlaps the bar, so the garment really hangs from it) */
export function Hung({ children }: { children: ReactNode }) {
  return (
    <>
      <HangerSvg className="absolute left-1/2 -translate-x-1/2 top-0 w-[58%] h-auto text-ink/90 z-0" />
      <div className="absolute inset-x-0 bottom-0 z-10" style={{ top: HANG_TOP }}>{children}</div>
    </>
  );
}

/** top offset (a 6%-tall shadow) so the soft shadow sits right under the garment; gb = where the garment ends in its canvas (manifest) */
export const hangShadowTop = (gb?: number) => `calc(${(6.5 + (gb ?? 0.9) * 93.5).toFixed(1)}% - 2%)`;

/** soft shadow below a hanging garment (replaces the floor shadow) */
export function HangShadow({ className = "", gb }: { className?: string; gb?: number }) {
  return <span className={`hang-shadow absolute pointer-events-none h-[6%] ${className}`} style={{ top: hangShadowTop(gb) }} aria-hidden="true" />;
}
