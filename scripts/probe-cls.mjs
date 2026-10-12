// Which elements cause layout shift?   node scripts/probe-cls.mjs [mobile|desktop]
import { chromium } from "playwright";
const BASE = process.env.BASE ?? "http://127.0.0.1:4173";
const mobile = process.argv[2] === "mobile";
const b = await chromium.launch();
const ctx = await b.newContext(mobile ? { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true } : { viewport: { width: 1440, height: 900 } });
await ctx.addInitScript(() => {
  window.__s = [];
  new PerformanceObserver((l) => { for (const e of l.getEntries()) if (!e.hadRecentInput && e.value > 0.002) window.__s.push({ v: +e.value.toFixed(4), t: Math.round(e.startTime), y: Math.round(window.scrollY), src: (e.sources || []).map((s) => { const n = s.node; return (n ? (n.tagName + "." + String(n.className || "").slice(0, 50) + (n.id ? "#" + n.id : "")) : "?") + " " + JSON.stringify([s.previousRect, s.currentRect].map((r) => r && [r.x|0, r.y|0, r.width|0, r.height|0])); }) }); }).observe({ type: "layout-shift", buffered: true });
});
const page = await ctx.newPage();
await page.goto(BASE, { waitUntil: "load" });
await page.waitForSelector("[role=status]", { state: "detached", timeout: 20000 }).catch(() => {});
await page.waitForTimeout(1500);
const phase1 = await page.evaluate(() => window.__s.slice());
await page.evaluate(() => new Promise((res) => { const total = document.documentElement.scrollHeight - innerHeight; let y = 0; const step = () => { y += 16; window.scrollTo(0, y); if (y < total) requestAnimationFrame(step); else res(); }; requestAnimationFrame(step); }));
await page.waitForTimeout(800);
const all = await page.evaluate(() => window.__s.slice());
const sum = (a) => a.reduce((n, x) => n + x.v, 0).toFixed(3);
console.log("load phase CLS", sum(phase1), "| whole run", sum(all));
all.sort((a, b) => b.v - a.v).slice(0, 12).forEach((s) => console.log(s.v, "t=" + s.t, "scrollY=" + s.y, "\n    " + s.src.join("\n    ")));
await b.close();
