import { useEffect, useRef, useState } from "react";
import { create } from "zustand";
import { cardUrl, CatItem, detailUrl, saveData, useCatalog, videoUrl } from "../lib/catalog";
import { isDecoded, loadImage } from "../lib/imageCache";
import { colorOf, photoKey, Product } from "../data/products";
import { reducedMotion } from "../lib/env";

// ── clean placeholder (used only while a photo does not exist yet) ──
/** true when the caller already positions the box (absolute/relative/fixed), so we must not add `relative` */
const hasPos = (c: string) => c.split(" ").some((t) => t === "absolute" || t === "relative" || t === "fixed");

export function Placeholder({ product, hex }: { product: Product; hex: string }) {
  const loaded = useCatalog((s) => s.loaded);
  if (!loaded) return <div className="skeleton absolute inset-0" aria-hidden="true" />; // manifest still loading
  return (
    <div className="absolute inset-0 flex items-end p-4" style={{ background: `linear-gradient(165deg, ${hex}26, #ece9e3 70%)` }} aria-hidden="true">
      <span className="eyebrow !text-ink/40">{product.name}</span>
    </div>
  );
}

const lqipStyle = (it: CatItem | undefined, show: boolean) => (it && show ? { backgroundImage: `url(${it.lqip})`, backgroundSize: "cover", backgroundPosition: "center" } : undefined);
const hi = (p: boolean) => (p ? ({ fetchpriority: "high" } as object) : {});
const SIZES_CARD = "(max-width: 767px) 170px, 270px"; // a card is never wider than this, so DPR ≤ 2 (desktop) / ≤ 3 (phone) picks the 540w variant

/** Single image: LQIP blur instantly, sharp image fades in (opacity only). The blur is ALWAYS removed on load or on error. */
export function ProductImage({ product, colorId, className = "", variant = "card", priority = false }: { product: Product; colorId?: string; className?: string; variant?: "card" | "detail"; priority?: boolean }) {
  const color = colorOf(product, colorId);
  const key = photoKey(product.slug, color.slug);
  const it = useCatalog((s) => s.items[key]);
  const url = it ? (variant === "card" ? cardUrl(key, it) : detailUrl(key, it)) : null;
  const [st, setSt] = useState<"loading" | "ok" | "err">(() => (url && isDecoded(url) ? "ok" : "loading"));
  useEffect(() => { setSt(url && isDecoded(url) ? "ok" : "loading"); }, [url]);
  return (
    <div className={`overflow-hidden ${hasPos(className) ? "" : "relative"} ${className}`} style={lqipStyle(it, st === "loading")}>
      {(!it || st === "err") && <Placeholder product={product} hex={color.hex} />}
      {it && url && st !== "err" && (
        <img
          src={url} alt={`${product.name} in ${color.name}`} width={variant === "card" ? it.cw : it.w} height={variant === "card" ? it.ch : it.h} decoding="async" draggable={false}
          loading={priority ? "eager" : "lazy"} {...hi(priority)}
          ref={(el) => { if (el?.complete && el.naturalWidth && st === "loading") setSt("ok"); }}
          onLoad={() => setSt("ok")} onError={() => setSt("err")}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${st === "ok" ? "opacity-100" : "opacity-0"}`}
          style={{ objectPosition: product.objectPosition }}
        />
      )}
    </div>
  );
}

interface LayerProps { src: string | null; visible: boolean; alt: string; w: number; h: number; pos: string; priority: boolean; srcSet?: string; sizes?: string; onReady: (u: string) => void; onFail: (u: string) => void }
function Layer({ src, visible, alt, w, h, pos, priority, srcSet, sizes, onReady, onFail }: LayerProps) {
  const ref = useRef<HTMLImageElement>(null);
  useEffect(() => { const el = ref.current; if (el && src && el.complete && el.naturalWidth) onReady(src); }, [src]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!src) return null;
  return (
    <img ref={ref} src={src} srcSet={srcSet} sizes={sizes} alt={visible ? alt : ""} aria-hidden={!visible} width={w} height={h} draggable={false} decoding="async"
      loading={priority ? "eager" : "lazy"} {...hi(priority)} onLoad={() => onReady(src)} onError={() => onFail(src)}
      className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-100 ease-linear ${visible ? "opacity-100" : "opacity-0"}`} style={{ objectPosition: pos }} />
  );
}

/**
 * Two stacked <img> layers that never unmount. A new target (colour swatch, or the sharper detail variant) is loaded into the
 * hidden layer, and only when it has really loaded do the layers swap by opacity (100ms): no flicker, no blank frame.
 * onError keeps the current image (or shows the placeholder); the blur is removed as soon as anything has loaded or failed.
 */
export function SwapImage({ product, colorId, upgrade = false, priority = false, className = "" }: { product: Product; colorId?: string; upgrade?: boolean; priority?: boolean; className?: string }) {
  const color = colorOf(product, colorId);
  const key = photoKey(product.slug, color.slug);
  const it = useCatalog((s) => s.items[key]);
  const card = it ? cardUrl(key, it) : null;
  const detail = it && upgrade ? detailUrl(key, it) : null;

  const start = detail && isDecoded(detail) ? detail : card;
  const [s, setS] = useState<{ a: string | null; b: string | null; top: "a" | "b"; settled: boolean; failed: boolean }>({ a: start, b: null, top: "a", settled: !!start && isDecoded(start), failed: false });
  const wanted = useRef<string | null>(start);

  const retarget = (url: string | null) => {
    wanted.current = url;
    if (!url) return;
    setS((p) => { const cur = p.top === "a" ? p.a : p.b; if (cur === url) return p; return p.top === "a" ? { ...p, b: url } : { ...p, a: url }; });
  };
  const onReady = (url: string) => {
    if (url !== wanted.current) return;
    setS((p) => { const cur = p.top === "a" ? p.a : p.b; const to = p.a === url ? "a" : p.b === url ? "b" : null; return cur === url || !to ? { ...p, settled: true, failed: false } : { ...p, top: to, settled: true, failed: false }; });
  };
  const onFail = (url: string) => { if (url === wanted.current) setS((p) => ({ ...p, settled: true, failed: p.top === "a" ? !p.a || p.a === url : !p.b || p.b === url })); };

  useEffect(() => { if (card) retarget(detail && isDecoded(detail) ? detail : card); }, [card]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!detail) return;
    let live = true;
    loadImage(detail, "low").then(() => { if (live) retarget(detail); }).catch(() => {});
    return () => { live = false; };
  }, [detail]); // eslint-disable-line react-hooks/exhaustive-deps

  const common = { alt: `${product.name} in ${color.name}`, w: it?.cw ?? 540, h: it?.ch ?? 960, pos: product.objectPosition, priority, onReady, onFail };
  const srcSet = (u: string | null) => (u && !upgrade && u === card && it ? `${card} 540w, ${detailUrl(key, it)} 1080w` : undefined);
  return (
    <div className={`overflow-hidden ${hasPos(className) ? "" : "relative"} ${className}`} style={lqipStyle(it, !s.settled)}>
      {(!it || s.failed) && <Placeholder product={product} hex={color.hex} />}
      <Layer {...common} src={s.a} visible={s.top === "a"} srcSet={srcSet(s.a)} sizes={SIZES_CARD} />
      <Layer {...common} src={s.b} visible={s.top === "b"} srcSet={srcSet(s.b)} sizes={SIZES_CARD} />
    </div>
  );
}

// ── video slot: at most 2 videos play at once ──
const useSlots = create<{ list: string[]; request: (id: string) => void; release: (id: string) => void }>((set) => ({
  list: [],
  request: (id) => set((s) => (s.list.includes(id) ? s : { list: [...s.list, id].slice(-2) })),
  release: (id) => set((s) => (s.list.includes(id) ? { list: s.list.filter((x) => x !== id) } : s)),
}));

export const videoAllowed = () => !reducedMotion() && !saveData();

/** Muted looping video that crossfades over the image while `want` is true. Renders nothing if there is no video. */
export function ProductVideo({ product, colorId, want, slot, className = "" }: { product: Product; colorId?: string; want: boolean; slot: string; className?: string }) {
  const color = colorOf(product, colorId);
  const key = photoKey(product.slug, color.slug);
  const it = useCatalog((s) => s.items[key]);
  const id = `${slot}:${key}`;
  const { list, request, release } = useSlots();
  const ref = useRef<HTMLVideoElement>(null);
  const [mounted, setMounted] = useState(false);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const active = want && it?.video && videoAllowed() && !failed;
  const allowed = active && list.includes(id);

  useEffect(() => { if (active) { request(id); setMounted(true); } else release(id); return () => release(id); }, [active, id, request, release]);
  useEffect(() => { setReady(false); setFailed(false); }, [key]);
  useEffect(() => {
    const v = ref.current; if (!v) return;
    if (allowed) v.play().catch(() => {}); else v.pause();
  }, [allowed, mounted]);

  if (!it?.video || failed || !mounted) return null;
  return (
    <video
      ref={ref} key={key} src={videoUrl(key, it)} poster={cardUrl(key, it)} muted loop playsInline preload="metadata" disablePictureInPicture
      onLoadedData={() => setReady(true)} onError={() => setFailed(true)} aria-hidden="true" tabIndex={-1}
      className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-200 ${allowed && ready ? "opacity-100" : "opacity-0"} ${className}`}
      style={{ objectPosition: product.objectPosition }}
    />
  );
}
