// Session-long in-memory image cache. Images are decoded once (img.decode()) and the element is kept
// referenced, so switching tabs / colours / opening the detail view shows them with no loading at all.
const decoded = new Set<string>();
const pending = new Map<string, Promise<void>>();
const keep = new Map<string, HTMLImageElement>();

export const isDecoded = (url: string) => decoded.has(url);

export function loadImage(url: string, priority: "high" | "low" | "auto" = "auto"): Promise<void> {
  if (decoded.has(url)) return Promise.resolve();
  const existing = pending.get(url);
  if (existing) return existing;
  const img = new Image();
  img.decoding = "async";
  (img as HTMLImageElement & { fetchPriority?: string }).fetchPriority = priority;
  img.src = url;
  const p = img.decode().then(() => { keep.set(url, img); decoded.add(url); pending.delete(url); }, (e) => { pending.delete(url); throw e; });
  pending.set(url, p);
  return p;
}
