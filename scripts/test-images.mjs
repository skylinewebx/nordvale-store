// Functional checks for the image system (production preview on :4173).   node scripts/test-images.mjs
import { chromium } from "playwright";
const BASE = process.env.BASE ?? "http://127.0.0.1:4173";
const ok = (c, m) => console.log(c ? "PASS" : "FAIL", m);
const b = await chromium.launch();

// ── 1. tab switching, swatches, detail ──
{
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  const errs = []; page.on("console", (m) => m.type() === "error" && errs.push(m.text())); page.on("pageerror", (e) => errs.push(e.message));
  await page.goto(BASE, { waitUntil: "load" });
  await page.waitForSelector("[role=status]", { state: "detached", timeout: 20000 }).catch(() => {});
  await page.waitForTimeout(4500); // let sections mount + warm-up decode the cards
  await page.evaluate(() => { const el = document.getElementById("collection"); window.scrollTo(0, el.getBoundingClientRect().top + scrollY + 150); });
  await page.waitForTimeout(1500);
  const state = () => page.evaluate(() => [...document.querySelectorAll("#collection article")].map((a) => { const top = [...a.querySelectorAll("img")].find((i) => getComputedStyle(i).opacity > 0.9); const r = top?.getBoundingClientRect(); return { ok: !!top && top.complete && top.naturalWidth > 0 && r.height > 100, lqip: !!a.querySelector("div[style*='background-image']") }; }));
  for (const tab of ["Hoodies", "Jackets", "Trousers", "T-Shirts", "All"]) {
    const t0 = Date.now();
    await page.locator("#collection [role=tab]").filter({ hasText: new RegExp("^" + tab) }).first().click();
    let s = await state(), waited = 0;
    while (s.length && !s.every((x) => x.ok) && waited < 3000) { await page.waitForTimeout(16); waited += 16; s = await state(); }
    ok(s.length > 0 && s.every((x) => x.ok), `tab ${tab}: ${s.length} cards, all images visible in ${Date.now() - t0} ms`);
    ok(s.every((x) => !x.lqip), `tab ${tab}: no blur left behind`);
  }
  // swatch swap
  const card = page.locator("#collection article").first();
  const before = await card.locator("img").count();
  const srcBefore = await card.evaluate((a) => [...a.querySelectorAll("img")].find((i) => getComputedStyle(i).opacity > 0.9)?.src);
  const hex = await card.locator("[role=radio]").nth(1).evaluate((el) => getComputedStyle(el.firstElementChild).backgroundColor);
  await card.locator("[role=radio]").nth(1).click();
  let t = 0, srcAfter = srcBefore;
  while (srcAfter === srcBefore && t < 1500) { await page.waitForTimeout(16); t += 16; srcAfter = await card.evaluate((a) => [...a.querySelectorAll("img")].find((i) => getComputedStyle(i).opacity > 0.9)?.src); }
  const after = await card.locator("img").count();
  ok(srcAfter !== srcBefore, `swatch swap changed the image in ${t} ms`);
  ok(after >= before, `layers stay mounted (img count ${before} → ${after})`);
  ok(/rgb/.test(hex), `swatch dot colour comes from data (${hex})`);
  // selected colour persists after leaving and returning
  await page.locator("#collection [role=tab]").filter({ hasText: /^Hoodies/ }).first().click(); await page.waitForTimeout(500);
  await page.locator("#collection [role=tab]").filter({ hasText: /^All/ }).first().click(); await page.waitForTimeout(700);
  const colourName = await page.locator("#collection article").first().locator("p").first().textContent();
  ok(colourName !== "Black", `selected colour persisted (${colourName})`);
  // detail view
  await page.locator("#collection article button[aria-label^='View']").first().click(); await page.waitForTimeout(1200);
  const det = await page.evaluate(() => { const d = document.querySelector("[role=dialog][aria-label*=details]"); const i = [...d.querySelectorAll("img")].find((x) => getComputedStyle(x).opacity > 0.9); const r = i?.getBoundingClientRect(); return { src: i?.src.split("/").pop(), h: Math.round(r?.height ?? 0), nw: i?.naturalWidth }; });
  ok(det.h > 400 && det.nw === 1080, `detail view shows the sharp variant (${det.src}, ${det.h}px tall, ${det.nw}px natural)`);
  ok(errs.length === 0, `no console errors${errs.length ? ": " + errs[0] : ""}`);
  await ctx.close();
}

// ── 2. a missing/broken image falls back to a placeholder (never a blank box) ──
{
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
  await ctx.route("**/nordic-drift-black-card.webp*", (r) => r.fulfill({ status: 404, body: "nope" }));
  await ctx.route("**/nordic-drift-black.webp*", (r) => r.fulfill({ status: 404, body: "nope" }));
  const page = await ctx.newPage();
  await page.goto(BASE, { waitUntil: "load" });
  await page.waitForSelector("[role=status]", { state: "detached", timeout: 20000 }).catch(() => {});
  await page.waitForTimeout(4500);
  await page.evaluate(() => { const el = document.getElementById("collection"); window.scrollTo(0, el.getBoundingClientRect().top + scrollY + 150); });
  await page.waitForTimeout(1500);
  const r = await page.evaluate(() => { const a = document.querySelector("#collection article"); return { text: a.querySelector("[aria-hidden=true].flex")?.textContent ?? "", blur: !!a.querySelector("div[style*='background-image']") }; });
  ok(/Nordic Drift/.test(r.text), `broken image → clean placeholder shown ("${r.text}")`);
  ok(!r.blur, "broken image → blur removed");
  await ctx.close();
}

// ── 3. service worker: versioned cache, old caches deleted, active after first load ──
{
  const ctx = await b.newContext();
  const page = await ctx.newPage();
  await page.goto(BASE, { waitUntil: "load" });
  await page.waitForFunction(() => navigator.serviceWorker.ready.then(() => true), null, { timeout: 15000 });
  await page.evaluate(async () => { await caches.open("nv-products-v1"); const r = await navigator.serviceWorker.getRegistration(); await r.unregister(); });
  await page.reload({ waitUntil: "load" });
  await page.waitForFunction(() => navigator.serviceWorker.ready.then(() => true), null, { timeout: 15000 });
  await page.waitForTimeout(2500);
  const keys = await page.evaluate(() => caches.keys());
  ok(!keys.includes("nv-products-v1"), `old cache deleted on activate (caches: ${keys.join(", ")})`);
  ok(keys.some((k) => /^nv-img-v\d+$/.test(k)) || keys.some((k) => /^nv-page-v\d+$/.test(k)), "versioned caches in use");
  await page.reload({ waitUntil: "load" });
  ok(await page.evaluate(() => !!navigator.serviceWorker.controller), "service worker controls the page (skipWaiting + clients.claim)");
  await ctx.close();
}
await b.close();
