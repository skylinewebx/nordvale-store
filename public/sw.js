// NORDVALE service worker (production only).
//  · product images: stale-while-revalidate (instant from cache, refreshed in the background)
//  · HTML + manifest.json: network-first (always fresh when online, cached copy only as an offline fallback)
// Bump VERSION to invalidate everything; old caches are deleted on activate.
const VERSION = "v3";
const IMG = `nv-img-${VERSION}`;
const PAGE = `nv-page-${VERSION}`;

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((k) => k !== IMG && k !== PAGE).map((k) => caches.delete(k)));
    await self.clients.claim();
  })());
});

const networkFirst = async (req, cacheName) => {
  const cache = await caches.open(cacheName);
  try {
    const res = await fetch(req);
    if (res.ok) cache.put(req, res.clone());
    return res;
  } catch (err) {
    const hit = await cache.match(req);
    if (hit) return hit;
    throw err;
  }
};

const staleWhileRevalidate = async (req, cacheName) => {
  const cache = await caches.open(cacheName);
  const hit = await cache.match(req);
  const refresh = fetch(req).then((res) => { if (res.ok) cache.put(req, res.clone()); return res; }).catch(() => hit);
  return hit || refresh;
};

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;

  if (req.mode === "navigate" || url.pathname.endsWith("/manifest.json")) {
    e.respondWith(networkFirst(req, PAGE));
  } else if (url.pathname.startsWith("/assets/products/") && /\.(webp|jpg|jpeg|png|avif)$/i.test(url.pathname)) {
    e.respondWith(staleWhileRevalidate(req, IMG));
  }
  // videos (range requests) and everything else: browser default
});
