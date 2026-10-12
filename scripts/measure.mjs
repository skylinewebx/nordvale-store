// Production measurements with Playwright.   node scripts/measure.mjs <label>   (server must run on :4173: `npm run build && npx vite preview --port 4173`)
// Writes diagnosis/<label>/<profile>/*.png and diagnosis/<label>/results.json
import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

const BASE = process.env.BASE ?? "http://127.0.0.1:4173";
const label = process.argv[2] ?? "before";
const only = process.argv[3]; // optional: "mobile" | "desktop"
const OUT = path.join("diagnosis", label);

const PROFILES = {
  mobile: { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, cpu: 4, net: { latency: 150, down: (9 * 1024 * 1024) / 8, up: (1.5 * 1024 * 1024) / 8 },
    userAgent: "Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Mobile Safari/537.36" },
  desktop: { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1, isMobile: false, hasTouch: false, cpu: 1, net: null },
};

const INIT = () => {
  window.__m = { frames: [], long: [], cls: 0, lcp: 0, lcpEl: "", scrolling: false };
  new PerformanceObserver((l) => { for (const e of l.getEntries()) window.__m.long.push({ d: e.duration, t: e.startTime, scrolling: window.__m.scrolling }); }).observe({ type: "longtask", buffered: true });
  new PerformanceObserver((l) => { for (const e of l.getEntries()) if (!e.hadRecentInput) window.__m.cls += e.value; }).observe({ type: "layout-shift", buffered: true });
  new PerformanceObserver((l) => { const e = l.getEntries().pop(); window.__m.lcp = e.startTime; window.__m.lcpEl = (e.element?.tagName ?? "") + " " + (e.url ?? "").slice(-60); }).observe({ type: "largest-contentful-paint", buffered: true });
  let last = performance.now();
  (function loop(t) { if (window.__m.scrolling) window.__m.frames.push(t - last); last = t; requestAnimationFrame(loop); })(last);
};

const pct = (a, p) => { const s = [...a].sort((x, y) => x - y); return s.length ? s[Math.min(s.length - 1, Math.floor(s.length * p))] : 0; };

async function run(name, prof) {
  const dir = path.join(OUT, name); fs.mkdirSync(dir, { recursive: true });
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ serviceWorkers: process.env.NOSW ? "block" : "allow", viewport: prof.viewport, deviceScaleFactor: prof.deviceScaleFactor, isMobile: prof.isMobile, hasTouch: prof.hasTouch, userAgent: prof.userAgent });
  await ctx.addInitScript(INIT);
  const page = await ctx.newPage();
  const cdp = await ctx.newCDPSession(page);
  await cdp.send("Network.enable");
  if (prof.net) await cdp.send("Network.emulateNetworkConditions", { offline: false, latency: prof.net.latency, downloadThroughput: prof.net.down, uploadThroughput: prof.net.up });
  if (prof.cpu > 1) await cdp.send("Emulation.setCPUThrottlingRate", { rate: prof.cpu });

  const reqs = new Map(); const failed = []; const errors = [];
  cdp.on("Network.responseReceived", (e) => reqs.set(e.requestId, { url: e.response.url, status: e.response.status, type: e.type, mime: e.response.mimeType, bytes: 0 }));
  cdp.on("Network.loadingFinished", (e) => { const r = reqs.get(e.requestId); if (r) r.bytes = e.encodedDataLength; });
  cdp.on("Network.loadingFailed", (e) => { const r = reqs.get(e.requestId); if (!e.canceled) failed.push({ url: r?.url ?? e.requestId, error: e.errorText }); });
  page.on("console", (m) => { if (m.type() === "error") errors.push(m.text().slice(0, 300)); });
  page.on("pageerror", (e) => errors.push("pageerror: " + String(e.message).slice(0, 300)));

  const shot = async (file) => { await page.waitForTimeout(900); await page.screenshot({ path: path.join(dir, file) }); };
  const go = async (sel, extra = 0) => { await page.evaluate((s) => { const el = document.querySelector(s); if (el) window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY - 70); }, sel); await page.waitForTimeout(700 + extra); };
  const imgs = () => page.evaluate(() => [...document.querySelectorAll("#collection article")].map((a) => ({
    name: a.querySelector("h3")?.textContent, imgs: [...a.querySelectorAll("img")].map((i) => ({ src: i.src.split("/").pop(), complete: i.complete, nw: i.naturalWidth, h: Math.round(i.getBoundingClientRect().height), w: Math.round(i.getBoundingClientRect().width), op: +getComputedStyle(i).opacity, fit: getComputedStyle(i).objectFit, pos: getComputedStyle(i).objectPosition })),
  })));

  const t0 = Date.now();
  await page.goto(BASE, { waitUntil: "load" });
  await page.waitForSelector("[role=status]", { state: "detached", timeout: 20000 }).catch(() => errors.push("loader did not finish in 20s"));
  const loaderMs = Date.now() - t0;
  await page.waitForTimeout(1500);
  await shot("01-hero-start.png");

  // hero assembled
  const heroEnd = await page.evaluate(() => { const s = document.getElementById("top"); return s ? s.parentElement.getBoundingClientRect().top + window.scrollY + s.offsetHeight * 3.1 : 2700; });
  await page.evaluate((y) => window.scrollTo(0, y), heroEnd); await shot("02-hero-assembled.png");

  // sections
  for (const [id, f] of [["#story", "03-story"], ["#craft", "04-craft"], ["#lookbook", "08-lookbook"], ["#why", "09-why"], ["#reviews", "10-reviews"], ["#faq", "11-faq"], ["#contact", "12-contact"]]) { await go(id); await shot(f + ".png"); }

  // collection + every tab
  const brokenAll = [];
  await go("#collection"); await page.evaluate(() => window.scrollBy(0, 360)); await page.waitForTimeout(800);
  for (const [tab, f] of [["All", "05a-collection-all"], ["Hoodies", "05b-hoodies"], ["Jackets", "05c-jackets"], ["Trousers", "05d-trousers"], ["T-Shirts", "05e-tshirts"]]) {
    const t1 = Date.now();
    await page.locator("#collection [role=tab]").filter({ hasText: new RegExp("^" + tab) }).first().click();
    await page.waitForTimeout(1200);
    const data = await imgs();
    const bad = data.flatMap((a) => (a.imgs.length ? [] : [{ name: a.name, issue: "no <img>" }]).concat(a.imgs.filter((i) => !i.complete || i.nw === 0).map((i) => ({ name: a.name, issue: "not loaded", src: i.src }))));
    const collapsed = data.filter((a) => a.imgs.some((i) => i.h < 80 || i.w < 80)).map((a) => ({ name: a.name, issue: "collapsed box (height or width < 80px)" }));
    const hidden = data.filter((a) => a.imgs.length && !a.imgs.some((i) => i.op > 0.9)).map((a) => ({ name: a.name, issue: "no visible layer" }));
    brokenAll.push({ tab, cards: data.length, bad, hidden, collapsed });
    await shot(f + ".png");
  }

  // detail + swatch
  await page.locator("#collection [role=tab]").filter({ hasText: /^All/ }).first().click(); await page.waitForTimeout(800);
  await page.locator("#collection article button[aria-label^='View']").first().click(); await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(dir, "06a-detail.png") });
  const sw = page.locator("[role=dialog][aria-label*=details] fieldset button[aria-pressed]").nth(1); if (await sw.count()) { await sw.click(); await page.waitForTimeout(700); await page.screenshot({ path: path.join(dir, "06b-detail-swatch.png") }); }
  const sizeBtn = page.locator("[role=dialog][aria-label*=details] [role=radiogroup][aria-label=Size] button").nth(2); if (await sizeBtn.count()) await sizeBtn.click();
  await page.getByRole("button", { name: /Add to bag/ }).click().catch(() => {}); await page.waitForTimeout(900);
  await page.screenshot({ path: path.join(dir, "07a-cart.png") });
  await page.keyboard.press("Escape"); await page.waitForTimeout(400); await page.keyboard.press("Escape"); await page.waitForTimeout(400);
  await page.goto(BASE + "/checkout", { waitUntil: "load" }); await page.waitForTimeout(1200);
  await page.screenshot({ path: path.join(dir, "07b-checkout.png") });

  // scroll test on a fresh load
  await page.goto(BASE, { waitUntil: "load" });
  await page.waitForSelector("[role=status]", { state: "detached", timeout: 20000 }).catch(() => {});
  await page.waitForTimeout(1500);
  await page.evaluate(() => { window.__m.long.length = 0; window.__m.frames.length = 0; });
  await page.evaluate(() => new Promise((res) => { const total = document.documentElement.scrollHeight - innerHeight; let y = 0; window.__m.scrolling = true; const step = () => { y += 16; window.scrollTo(0, y); if (y < total) requestAnimationFrame(step); else { window.__m.scrolling = false; res(); } }; requestAnimationFrame(step); }));
  await page.waitForTimeout(800);
  const m = await page.evaluate(() => window.__m);
  const fr = m.frames.slice(5);
  const mean = fr.reduce((a, b) => a + b, 0) / (fr.length || 1);
  const scrollLong = m.long.filter((l) => l.scrolling);

  const all = [...reqs.values()];
  const bytes = all.reduce((n, r) => n + (r.bytes || 0), 0);
  const imgBytes = all.filter((r) => r.type === "Image" || /^image\//.test(r.mime)).reduce((n, r) => n + (r.bytes || 0), 0);
  const bad = all.filter((r) => r.status >= 400).map((r) => ({ url: r.url, status: r.status }));
  const mimeBad = all.filter((r) => /\.(webp|jpg|png|mp4)(\?|$)/.test(r.url) && /text\/html/.test(r.mime)).map((r) => r.url);

  const res = {
    profile: name, loaderMs, fpsAvg: +(1000 / mean).toFixed(1), frameP95: +pct(fr, 0.95).toFixed(1), framesOver33: +((fr.filter((x) => x > 33.4).length / (fr.length || 1)) * 100).toFixed(1), frameCount: fr.length,
    longTasksTotal: m.long.length, longTasksWhileScrolling: scrollLong.length, longestWhileScrolling: Math.round(Math.max(0, ...scrollLong.map((l) => l.d))), over100WhileScrolling: scrollLong.filter((l) => l.d > 100).length,
    cls: +m.cls.toFixed(4), lcpMs: Math.round(m.lcp), lcpEl: m.lcpEl, totalKB: Math.round(bytes / 1024), imageKB: Math.round(imgBytes / 1024), requests: all.length,
    failedRequests: failed, httpErrors: bad, mimeMismatch: mimeBad, consoleErrors: [...new Set(errors)], tabs: brokenAll,
  };
  fs.writeFileSync(path.join(dir, "results.json"), JSON.stringify(res, null, 2));
  await browser.close();
  return res;
}

fs.mkdirSync(OUT, { recursive: true });
const results = {};
for (const [n, p] of Object.entries(PROFILES)) { if (only && only !== n) continue; results[n] = await run(n, p); const r = results[n]; console.log(n, JSON.stringify({ fps: r.fpsAvg, p95: r.frameP95, over33: r.framesOver33, longScroll: r.longTasksWhileScrolling, over100: r.over100WhileScrolling, cls: r.cls, lcp: r.lcpMs, kb: r.totalKB, imgKB: r.imageKB, failed: r.failedRequests.length, http: r.httpErrors.length, errors: r.consoleErrors.length })); }
fs.writeFileSync(path.join(OUT, "results-all.json"), JSON.stringify(results, null, 2));
