// Lighthouse (mobile, simulated Slow 4G + 4x CPU) against the production preview.   node scripts/lh.mjs <label>
import fs from "node:fs";
import { chromium } from "playwright";
import lighthouse from "lighthouse";
const label = process.argv[2] ?? "before";
const URL = process.env.BASE ?? "http://127.0.0.1:4173/";
const browser = await chromium.launch({ args: ["--remote-debugging-port=9333"] });
const r = await lighthouse(URL, { port: 9333, output: "json", onlyCategories: ["performance"], logLevel: "error" });
const a = r.lhr.audits, s = Math.round(r.lhr.categories.performance.score * 100);
const out = { score: s, FCP: a["first-contentful-paint"].displayValue, LCP: a["largest-contentful-paint"].displayValue, TBT: a["total-blocking-time"].displayValue, CLS: a["cumulative-layout-shift"].displayValue, SI: a["speed-index"].displayValue, TTI: a["interactive"].displayValue, totalBytes: a["total-byte-weight"].displayValue };
fs.mkdirSync(`diagnosis/${label}`, { recursive: true });
fs.writeFileSync(`diagnosis/${label}/lighthouse.json`, JSON.stringify(out, null, 2));
out.lcpElement = a["largest-contentful-paint-element"]?.details?.items?.[0]?.items?.[0]?.node?.snippet?.slice(0, 120);
out.bootup = (a["bootup-time"]?.details?.items ?? []).slice(0, 5).map((i) => `${i.url.split("/").pop().slice(0, 40)} total ${Math.round(i.total)}ms script ${Math.round(i.scripting)}ms`);
out.render = (a["mainthread-work-breakdown"]?.details?.items ?? []).slice(0, 6).map((i) => `${i.groupLabel} ${Math.round(i.duration)}ms`);
fs.writeFileSync(`diagnosis/${label}/lighthouse.json`, JSON.stringify(out, null, 2));
console.log("Lighthouse", label, JSON.stringify(out, null, 1));
await browser.close();
