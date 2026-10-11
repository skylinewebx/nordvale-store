import { useEffect, useRef, useState } from "react";
import { create } from "zustand";
import { cardUrl, CatItem, detailUrl, saveData, useCatalog, videoUrl } from "../lib/catalog";
import { isDecoded, loadImage } from "../lib/imageCache";
import { colorOf, photoKey, Product } from "../data/products";
import { reducedMotion } from "../lib/env";

// ── clean placeholder (used only while a photo does not exist yet) ──
export function Placeholder({ product, hex }: { product: Product; hex: string }) {
  const loaded = useCatalog((s) => s.loaded);
  if (!loaded) return <div className="skeleton absolute inset-0" aria-hidden="true" />; // manifest still loading
  return (
    <div className="absolute inset-0 flex items-end p-4" style={{ background: `linear-gradient(165deg, ${hex}26, #ece9e3 70%)` }} aria-hidden="true">
      <span className="eyebrow !text-ink/40">{product.name}</span>
    </div>
  );
}

const lqipStyle = (it?: CatItem) => (it ? { backgroundImage: `url(${it.lqip})`, backgroundSize: "cover", backgroundPosition: "center" } : undefined);
const hi = (p: boolean) => (p ? ({ fetchpriority: "high" } as object) : {});

/** Single image: LQIP blur instantly, sharp image fades in (opacity only). No fade when already cached. */
export function ProductImage({ product, colorId, className = "", variant = "card", priority = false }: { product: Product; colorId?: string; className?: string; variant?: "card" | "detail"; priority?: boolean }) {
  const color = colorOf(product, colorId);
  const key = photoKey(product.slug, color.slug);
  const it = useCatalog((s) => s.items[key]);
  const url = it ? (variant === "card" ? cardUrl(key, it) : detailUrl(key, it)) : null;
  const [ok, setOk] = useState(() => !!url && isDecoded(url));
  useEffect(() => { setOk(!!url && isDecoded(url)); }, [url]);
  return (
    <div className={`overflow-hidden ${/\b(absolute|relative|fixed)\b/.test(className) ? "" : "relative"} ${className}`} style={lqipStyle(it)}>
      {!it && <Placeholder product={product} hex={color.hex} />}
      {it && url && (
        <img
          src={url} alt={`${product.name} in ${color.name}`} width={it.cw} height={it.ch} decoding="async" draggable={false}
          loading={priority ? "eager" : "lazy"} {...hi(priority)}
          ref={(el) => { if (el?.complete && el.naturalWidth && !ok) setOk(true); }}
          onLoad={() => setOk(true)}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${ok ? "opacity-100" : "opacity-0"}`}
          style={{ objectPosition: product.objectPosition }}
        />
      )}
    </div>
  );
}

/**
 * Two stacked <img> layers that never unmount. Changing `urls` loads the new image, then crossfades (90ms)
 * from one layer to the other, so a swatch tap never flickers. `urls` is ordered low→high quality: the best
 * one already in memory is shown at once, then it upgrades as better versions finish decoding.
 */
export function SwapImage({ product, colorId, upgrade = false, priority = false, className = "" }: { product: Product; colorId?: string; upgrade?: boolean; priority?: boolean; className?: string }) {
  const color = colorOf(product, colorId);
  const key = photoKey(product.slug, color.slug);
  const it = useCatalog((s) => s.items[key]);
  const urls = it ? (upgrade ? [cardUrl(key, it), detailUrl(key, it)] : [cardUrl(key, it)]) : [];
  const sig = urls.join("|");

  const initial = [...urls].reverse().find(isDecoded) ?? null;
  const [layers, setLayers] = useState<{ a: string | null; b: string | null; top: "a" | "b" }>({ a: initial, b: null, top: "a" });
  const shown = useRef(initial ? urls.indexOf(initial) : -1);

  useEffect(() => {
    if (!urls.length) return;
    let live = true;
    const show = (u: string, idx: number) => {
      shown.current = idx;
      setLayers((l) => { const cur = l.top === "a" ? l.a : l.b; if (cur === u) return l; return l.top === "a" ? { ...l, b: u, top: "b" } : { ...l, a: u, top: "a" }; });
    };
    shown.current = -1;
    const best = urls.map((u, i) => [u, i] as const).reverse().find(([u]) => isDecoded(u));
    if (best) show(best[0], best[1]);
    (async () => {
      for (let i = 0; i < urls.length; i++) {
        try { await loadImage(urls[i], i === 0 && priority ? "high" : i === 0 ? "auto" : "low"); } catch { return; }
        if (!live) return;
        if (i > shown.current) show(urls[i], i);
      }
    })();
    return () => { live = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sig]);

  const layer = (u: string | null, on: boolean, id: string) => u && it && (
    <img key={id} src={u} alt={on ? `${product.name} in ${color.name}` : ""} aria-hidden={!on} width={it.w} height={it.h} draggable={false}
      loading={priority ? "eager" : "lazy"} {...hi(priority)}
      className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-100 ease-linear ${on ? "opacity-100" : "opacity-0"}`} style={{ objectPosition: product.objectPosition }} />
  );
  return (
    <div className={`overflow-hidden ${/\b(absolute|relative|fixed)\b/.test(className) ? "" : "relative"} ${className}`} style={lqipStyle(it)}>
      {!it && <Placeholder product={product} hex={color.hex} />}
      {layer(layers.a, layers.top === "a", "a")}
      {layer(layers.b, layers.top === "b", "b")}
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
