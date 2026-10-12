import { ReactNode, useEffect, useState } from "react";
import { useAsset } from "../lib/assets";

/** true when the caller already positions the box (absolute/relative/fixed), so we must not add `relative` */
const hasPos = (c: string) => c.split(" ").some((t) => t === "absolute" || t === "relative" || t === "fixed");

interface Props {
  src: string | null | undefined;
  alt: string;
  fallback?: ReactNode;
  className?: string; // wrapper
  imgClass?: string;
  eager?: boolean;
  strict?: boolean; // only render when the manifest confirms the file exists
}

// Image with skeleton shimmer, fade-in on load, lazy loading, and a graceful fallback when the file is missing.
export default function SmartImg({ src, alt, fallback, className = "", imgClass = "", eager = false, strict = false }: Props) {
  const url = useAsset(src, strict);
  const [state, setState] = useState<"loading" | "ok" | "err">("loading");
  useEffect(() => setState("loading"), [url]);
  const showImg = !!url && state !== "err";
  return (
    <div className={`overflow-hidden ${hasPos(className) ? "" : "relative"} ${className}`}>
      {(!showImg || state === "loading") && fallback}
      {showImg && state === "loading" && !fallback && <div className="skeleton absolute inset-0" aria-hidden="true" />}
      {showImg && (
        <img
          src={url!} alt={alt} decoding="async" loading={eager ? "eager" : "lazy"} draggable={false}
          onLoad={() => setState("ok")} onError={() => setState("err")}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${state === "ok" ? "opacity-100" : "opacity-0"} ${imgClass}`}
        />
      )}
    </div>
  );
}
