// Frame time per scroll zone.   node scripts/scrollprofile.mjs [mobile|desktop]
import { chromium } from "playwright";
const BASE = process.env.BASE ?? "http://127.0.0.1:4173";
const mobile = process.argv[2] === "mobile";
const b = await chromium.launch();
const ctx = await b.newContext(mobile ? { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true } : { viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
const cdp = await ctx.newCDPSession(page);
if (mobile) await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
await page.goto(BASE, { waitUntil: "load" });
await page.waitForSelector("[role=status]", { state: "detached", timeout: 20000 }).catch(() => {});
await page.waitForTimeout(1500);
if (process.env.LITE) await page.evaluate(() => { document.documentElement.dataset.lite = "1"; });
if (process.env.CSS) await page.addStyleTag({ content: process.env.CSS });
const rows = await page.evaluate(() => new Promise((res) => {
  const total = document.documentElement.scrollHeight - innerHeight; let y = 0, last = performance.now(); const z = {};
  const secs = [...document.querySelectorAll("section[id], footer")].map((s) => ({ id: s.id || s.tagName, top: s.getBoundingClientRect().top + scrollY, h: s.offsetHeight }));
  const step = (t) => { const dt = t - last; last = t; const sec = secs.find((s) => y + innerHeight / 2 >= s.top && y + innerHeight / 2 < s.top + s.h)?.id ?? "-"; (z[sec] ||= []).push(dt); y += 16; window.scrollTo(0, y); if (y < total) requestAnimationFrame(step); else res(z); };
  requestAnimationFrame(step);
}));
for (const [k, v] of Object.entries(rows)) { const a = v.slice(2); const m = a.reduce((x, y) => x + y, 0) / a.length; const s = [...a].sort((x, y) => x - y); console.log(k.padEnd(12), "frames", String(a.length).padStart(4), "avg ms", m.toFixed(1).padStart(5), "fps", (1000 / m).toFixed(0).padStart(3), "p95", s[Math.floor(s.length * 0.95)].toFixed(0)); }
await b.close();
