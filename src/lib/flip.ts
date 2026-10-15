/** Shared-element hand-off: the showcase stores the centre product's rect right before navigating; the product page animates from it (FLIP). */
export const flip: { rect: DOMRect | null; src: string; t: number } = { rect: null, src: "", t: 0 };

/** FLIP the element from the stored rect to where it is now (transform + opacity only). Safe to call once per navigation. */
export function playFlip(el: HTMLElement | null) {
  const from = flip.rect; flip.rect = null;
  if (!el || !from || performance.now() - flip.t > 4000) return;
  const to = el.getBoundingClientRect();
  if (!to.width || !to.height) return;
  const sx = from.width / to.width, sy = from.height / to.height;
  const dx = from.left + from.width / 2 - (to.left + to.width / 2), dy = from.top + from.height - (to.top + to.height);
  el.animate(
    [{ transformOrigin: "50% 100%", transform: `translate(${dx}px, ${dy}px) scale(${sx}, ${sy})` }, { transformOrigin: "50% 100%", transform: "none" }],
    { duration: 850, easing: "cubic-bezier(.22,1,.36,1)" },
  );
}
