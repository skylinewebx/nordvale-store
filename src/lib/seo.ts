import { useEffect } from "react";

const setMeta = (sel: string, attr: string, key: string, val: string) => {
  let el = document.head.querySelector<HTMLMetaElement>(sel);
  if (!el) { el = document.createElement("meta"); el.setAttribute(attr, key); document.head.appendChild(el); }
  el.setAttribute("content", val);
};

export function useSeo(title: string, description: string, jsonLd?: object) {
  useEffect(() => {
    document.title = title;
    setMeta('meta[name="description"]', "name", "description", description);
    setMeta('meta[property="og:title"]', "property", "og:title", title);
    setMeta('meta[property="og:description"]', "property", "og:description", description);
    let s: HTMLScriptElement | null = null;
    if (jsonLd) { s = document.createElement("script"); s.type = "application/ld+json"; s.text = JSON.stringify(jsonLd); document.head.appendChild(s); }
    return () => { s?.remove(); };
  }, [title, description, jsonLd]);
}
