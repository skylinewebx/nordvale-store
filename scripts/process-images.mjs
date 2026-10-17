// Product image pipeline.   npm run images
//   1. scans incoming/ (and any extra folders in the INCOMING env var, separated by ;)
//   2. matches each file to a product + colour by filename (slug-colour-slug), keeps the best of duplicates
//   3. writes public/assets/products/{key}.webp (detail, 1080w) and {key}-card.webp (540w, ~45KB)
//   4. writes public/assets/products/manifest.json: sizes, 24px LQIP (base64), cache-busting hash, and any {key}.mp4 videos
// To add images or videos later: drop them in incoming/ (named {slug}-{colour-slug}.jpg / .mp4) and run `npm run images`.
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { products } from "../src/data/products.ts";

const OUT = "public/assets/products";
const DIRS = (process.env.INCOMING ?? "incoming").split(";").filter((d) => fs.existsSync(d));
const IMG = /\.(jpe?g|png|webp|avif|tiff?)$/i;
const VID = /\.(mp4|webm)$/i;
const CARD_MAX = 60 * 1024;
// Transparent cut-outs (scripts/cutout.mjs → cutouts/{key}.png) win over the studio photo: the model then stands directly on the page.
const CUT = process.env.CUTOUTS ?? "cutouts";
// TOPS (hoodies, jackets, t-shirts) come from scripts/ghost.mjs: garment only (ghost mannequin), composed top-aligned on a 1080x1200 canvas
const GHOST = process.env.GHOST_OUT ?? "ghost";
const isTop = (key) => products.find((p) => key.startsWith(p.slug + "-"))?.category !== "trousers";
const GW = 1080, GH = 1200;
let lastGb = 0.9; // where (fraction of the canvas height) the hanging garment ends: the UI puts the soft shadow right under it
async function composeGhost(file, key) {
  const g = sharp(file); const m = await g.metadata();
  const sc = Math.min((GW - 72) / m.width, (GH - 44) / m.height);
  const rw = Math.round(m.width * sc), rh = Math.round(m.height * sc);
  lastGb = Math.round((rh / GH) * 1000) / 1000;
  let buf = await g.resize(rw, rh, { kernel: "lanczos3" }).ensureAlpha().raw().toBuffer();
  if (/^regent-trench/.test(key)) { const f0 = Math.floor(rh * 0.94); for (let y = f0; y < rh; y++) { const k = Math.pow(1 - (y - f0) / (rh - f0), 2); for (let x = 0; x < rw; x++) buf[(y * rw + x) * 4 + 3] = Math.round(buf[(y * rw + x) * 4 + 3] * k); } } // long coat: dissolve the cut hem
  const png = await sharp(buf, { raw: { width: rw, height: rh, channels: 4 } }).png().toBuffer();
  const canvas = await sharp({ create: { width: GW, height: GH, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } }).composite([{ input: png, left: Math.round((GW - rw) / 2), top: 0 }]).png().toBuffer();
  return sharp(canvas); // flattened first: sharp would otherwise composite AFTER the later resize
}
/** soft-fade the last 4% of rows so a mid-thigh crop dissolves into the floor shadow instead of ending on a hard line */
async function fadeEdges(input, trousers) {
  // trousers are waist-down, full-length shots: drop the shirt hem at the top (11%), dissolve the new top edge,
  // and trim the empty floor below the shoes so the feet touch the shared floor line (no bottom fade there)
  let img = sharp(input).ensureAlpha();
  const m = await sharp(input).metadata();
  let top = 0, h = m.height;
  if (trousers) {
    top = Math.round(m.height * 0.11);
    const { data: a0, info: i0 } = await sharp(input).ensureAlpha().extractChannel(3).raw().toBuffer({ resolveWithObject: true });
    let last = i0.height - 1;
    for (; last > top; last--) { let hit = false; for (let x = 0; x < i0.width; x += 3) if (a0[last * i0.width + x] > 70) { hit = true; break; } if (hit) break; }
    h = Math.min(m.height, last + 5) - top;
  }
  if (trousers) img = img.extract({ left: 0, top, width: m.width, height: h });
  const { data, info } = await img.raw().toBuffer({ resolveWithObject: true });
  const fb = trousers ? info.height : Math.floor(info.height * 0.96), ft = trousers ? Math.floor(info.height * 0.05) : 0;
  for (let y = 0; y < info.height; y++) {
    const k = y >= fb ? Math.pow(1 - (y - fb) / (info.height - fb), 2) : y < ft ? Math.pow(y / ft, 2) : 1;
    if (k === 1) continue;
    for (let x = 0; x < info.width; x++) { const i = (y * info.width + x) * 4 + 3; data[i] = Math.round(data[i] * k); }
  }
  return sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } });
}
fs.mkdirSync(OUT, { recursive: true });

const expected = products.flatMap((p) => p.colors.map((c) => ({ key: `${p.slug}-${c.slug}`, product: p.name, colour: c.name })));
const norm = (f) => f.toLowerCase().replace(/\.[a-z0-9]+$/, "").replace(/[_\s]+/g, "-");

// ── collect files ──
const files = [];
const dups = [];
(function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) { if (e.name.startsWith("_")) fs.readdirSync(p).forEach((f) => dups.push(`${e.name}/${f}`)); else walk(p); }
    else if (IMG.test(e.name) || VID.test(e.name)) files.push(p);
  }
})(DIRS[0] ?? "incoming");
for (const d of DIRS.slice(1)) (function walk(dir) { for (const e of fs.readdirSync(dir, { withFileTypes: true })) { const p = path.join(dir, e.name); if (e.isDirectory()) walk(p); else if (IMG.test(e.name) || VID.test(e.name)) files.push(p); } })(d);

// ── match ──
function matchKey(name) {
  let best = null, score = 0;
  for (const { key } of expected) {
    const s = name === key ? 3 : name.startsWith(key + "-") ? 2 : 0;
    if (s > score || (s === score && s > 0 && key.length > best.length)) { best = key; score = s; }
  }
  return best;
}
const imgs = new Map(); // key -> [{file,w,h,size}]
const vids = new Map();
const unmatched = [];
for (const f of files) {
  const key = matchKey(norm(path.basename(f)));
  if (!key) { unmatched.push(f); continue; }
  if (VID.test(f)) { vids.set(key, f); continue; }
  const m = await sharp(f).metadata(); const st = fs.statSync(f);
  (imgs.get(key) ?? imgs.set(key, []).get(key)).push({ file: f, area: m.width * m.height, size: st.size, sig: `${st.size}-${Math.round(st.mtimeMs)}` });
}

// ── process ──
const manifestPath = path.join(OUT, "manifest.json");
const prev = fs.existsSync(manifestPath) ? JSON.parse(fs.readFileSync(manifestPath, "utf8")).items ?? {} : {};
const items = {}; const status = {}; const dupFiles = {};
for (const { key } of expected) {
  const list = (imgs.get(key) ?? []).sort((a, b) => b.area - a.area || b.size - a.size);
  if (list.length) {
    const best = list[0];
    if (list.length > 1) dupFiles[key] = list.slice(1).map((x) => path.basename(x.file));
    if (prev[key]?.src === best.sig + (isTop(key) && fs.existsSync(path.join(GHOST, `${key}.png`)) ? "-ghost2" : fs.existsSync(path.join(CUT, `${key}.png`)) ? "-cut3" : "") && fs.existsSync(path.join(OUT, `${key}.webp`)) && fs.existsSync(path.join(OUT, `${key}-card.webp`))) { items[key] = prev[key]; status[key] = "matched"; continue; }
    const cutFile = path.join(CUT, `${key}.png`);
    const hasCut = fs.existsSync(cutFile);
    const ghostFile = path.join(GHOST, `${key}.png`);
    const hasGhost = isTop(key) && fs.existsSync(ghostFile);
    const base = hasGhost ? await composeGhost(ghostFile, key) : hasCut ? await fadeEdges(cutFile, products.find((p) => key.startsWith(p.slug + "-"))?.category === "trousers") : sharp(best.file).rotate();
    const detail = await base.clone().resize({ width: 1080, withoutEnlargement: true }).webp({ quality: 82, effort: 5, alphaQuality: 90 }).toBuffer({ resolveWithObject: true });
    let card, q = 72;
    for (; q >= 52; q -= 5) { card = await base.clone().resize({ width: 540 }).webp({ quality: q, effort: 6, smartSubsample: true, alphaQuality: 85 }).toBuffer({ resolveWithObject: true }); if (card.data.length <= CARD_MAX) break; }
    const lqip = await base.clone().resize({ width: 24 }).blur(0.8).webp({ quality: 40, alphaQuality: 60 }).toBuffer();
    fs.writeFileSync(path.join(OUT, `${key}.webp`), detail.data);
    fs.writeFileSync(path.join(OUT, `${key}-card.webp`), card.data);
    items[key] = {
      w: detail.info.width, h: detail.info.height, cw: card.info.width, ch: card.info.height,
      lqip: `data:image/webp;base64,${lqip.toString("base64")}`,
      v: crypto.createHash("md5").update(card.data).digest("hex").slice(0, 8), src: best.sig + (hasGhost ? "-ghost2" : hasCut ? "-cut3" : ""), cut: hasCut, ghost: hasGhost, ...(hasGhost ? { gb: lastGb } : {}), cardKB: Math.round(card.data.length / 1024),
    };
    status[key] = "matched";
  } else if (prev[key] && fs.existsSync(path.join(OUT, `${key}.webp`))) { items[key] = prev[key]; status[key] = "matched"; }
  else status[key] = "missing";
}
// ── hero model photos: tops only, the standing person (cut-out, bottom fade) → {key}-model.webp ──
for (const { key } of expected) {
  if (!isTop(key)) continue; const out = path.join(OUT, `${key}-model.webp`); const cf = path.join(CUT, `${key}.png`);
  if (fs.existsSync(out) || !fs.existsSync(cf)) continue;
  await (await fadeEdges(cf, false)).resize({ width: 1080, withoutEnlargement: true }).webp({ quality: 80, effort: 5, alphaQuality: 90 }).toFile(out);
}
// ── videos: {key}.mp4 in incoming/ or already in the products folder ──
for (const { key } of expected) {
  const dest = path.join(OUT, `${key}.mp4`);
  const src = vids.get(key);
  if (src && /\.mp4$/i.test(src)) fs.copyFileSync(src, dest);
  if (items[key] && fs.existsSync(dest)) { const st = fs.statSync(dest); items[key].video = true; items[key].vv = `${st.size.toString(36)}${Math.round(st.mtimeMs).toString(36)}`.slice(-8); }
  else if (items[key]) { delete items[key].video; delete items[key].vv; }
}
fs.writeFileSync(manifestPath, JSON.stringify({ version: 1, generated: new Date().toISOString(), items }));

// ── report ──
const rows = expected.map((e) => ({ file: `${e.key}`, product: e.product, colour: e.colour, status: dupFiles[e.key] ? "matched (duplicates ignored)" : status[e.key], KB: items[e.key]?.cardKB ?? "", video: items[e.key]?.video ? "yes" : "" }));
console.table(rows);
const n = (s) => rows.filter((r) => r.status.startsWith(s)).length;
console.log(`\nExpected ${expected.length} · matched ${n("matched")} · missing ${n("missing")}`);
console.log("Missing:", rows.filter((r) => r.status === "missing").map((r) => r.file).join(", ") || "none");
const dupAll = [...Object.entries(dupFiles).flatMap(([k, v]) => v.map((f) => `${f} (duplicate of ${k})`)), ...dups];
if (dupAll.length) console.log("Duplicates ignored:", dupAll.join("; "));
if (unmatched.length) console.log("Unmatched files (rename to {slug}-{colour-slug}.jpg):", unmatched.map((f) => path.basename(f)).join(", "));
const oversize = rows.filter((r) => r.KB && r.KB > 45);
if (oversize.length) console.log("Cards over 45KB (quality floor reached):", oversize.map((r) => `${r.file} ${r.KB}KB`).join(", "));
