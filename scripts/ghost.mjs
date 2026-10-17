// Ghost-mannequin pipeline for TOPS (hoodies, jackets, t-shirts): keeps ONLY the garment.
//   node scripts/ghost.mjs [key ...]        (no keys = every top found in cutouts/)
// Needs (dev only, not in package.json): onnxruntime-node + sharp, and the offline cloth model u2net_cloth_seg.onnx
//   GHOST_DEPS=<dir whose node_modules has onnxruntime-node and sharp>   (default: project root)
//   GHOST_MODEL=<path to u2net_cloth_seg.onnx>   (https://github.com/danielgatis/rembg/releases/download/v0.0.0/u2net_cloth_seg.onnx)
//   GHOST_OUT=<dir for ghost PNGs>   default ghost/
// Input : cutouts/{key}.png  (full-resolution person cut-outs made by scripts/cutout.mjs from the studio originals)
// Output: ghost/{key}.png    (transparent garment, neck / hood interior rebuilt, smoothed edge) + ghost/report.json
import { createRequire } from "node:module";
import fs from "node:fs";
import path from "node:path";

const req = createRequire(path.resolve(process.env.GHOST_DEPS ?? ".", "x.js"));
const ort = req("onnxruntime-node");
const sharp = req("sharp");
const MODEL = process.env.GHOST_MODEL ?? "u2net_cloth_seg.onnx";
const IN = process.env.CUTOUTS ?? "cutouts", OUT = process.env.GHOST_OUT ?? "ghost";
fs.mkdirSync(OUT, { recursive: true });

const TOP_SLUGS = ["nordic-drift", "midnight-ember", "glacier-haze", "aurora-peak", "cloud-puffer", "noir-biker", "campus-varsity", "regent-trench", "drop-tee", "rib-slim-tee", "acid-wash-tee", "knit-polo"];
const LONG = ["regent-trench"];
const TEES = ["drop-tee", "rib-slim-tee", "acid-wash-tee", "knit-polo"]; // straight hem: anything below it (hands, trouser waistband) is cut away
const HOODED = ["nordic-drift", "midnight-ember", "glacier-haze", "aurora-peak"]; // get a hood rim (back of the hood) around the dark opening // long coat: segment the full height
const sess = await ort.InferenceSession.create(MODEL);

// ───────── helpers (all masks are Uint8Array 0/1 or 0..255) ─────────
function dilate(m, w, h, r) { return sepMinMax(m, w, h, r, true); }
function erode(m, w, h, r) { return sepMinMax(m, w, h, r, false); }
function sepMinMax(src, w, h, r, max) {
  const tmp = new Uint8Array(w * h), out = new Uint8Array(w * h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { let v = max ? 0 : 1; for (let k = -r; k <= r; k++) { const xx = x + k; if (xx < 0 || xx >= w) { if (!max) v = 0; continue; } const s = src[y * w + xx]; if (max ? s > v : s < v) v = s; if (max ? v : !v) { if (max) break; else break; } } tmp[y * w + x] = v; }
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { let v = max ? 0 : 1; for (let k = -r; k <= r; k++) { const yy = y + k; if (yy < 0 || yy >= h) { if (!max) v = 0; continue; } const s = tmp[yy * w + x]; if (max ? s > v : s < v) v = s; if (max ? v : !v) break; } out[y * w + x] = v; }
  return out;
}
function components(m, w, h) {
  const lab = new Int32Array(w * h), sizes = [0]; let n = 0; const q = new Int32Array(w * h);
  for (let i = 0; i < w * h; i++) {
    if (!m[i] || lab[i]) continue; n++; let qs = 0, qe = 0; q[qe++] = i; lab[i] = n; let c = 0;
    while (qs < qe) { const p = q[qs++]; c++; const x = p % w, y = (p / w) | 0; if (x > 0 && m[p - 1] && !lab[p - 1]) { lab[p - 1] = n; q[qe++] = p - 1; } if (x < w - 1 && m[p + 1] && !lab[p + 1]) { lab[p + 1] = n; q[qe++] = p + 1; } if (y > 0 && m[p - w] && !lab[p - w]) { lab[p - w] = n; q[qe++] = p - w; } if (y < h - 1 && m[p + w] && !lab[p + w]) { lab[p + w] = n; q[qe++] = p + w; } }
    sizes.push(c);
  }
  return { lab, sizes, n };
}
function keepBig(m, w, h, frac) { const { lab, sizes, n } = components(m, w, h); let mx = 0; for (let i = 1; i <= n; i++) mx = Math.max(mx, sizes[i]); const out = new Uint8Array(w * h); for (let i = 0; i < w * h; i++) if (lab[i] && sizes[lab[i]] >= mx * frac) out[i] = 1; return out; }
function fillHoles(m, w, h) { const inv = new Uint8Array(w * h); for (let i = 0; i < w * h; i++) inv[i] = m[i] ? 0 : 1; const { lab, sizes, n } = components(inv, w, h); const border = new Set(); for (let x = 0; x < w; x++) { border.add(lab[x]); border.add(lab[(h - 1) * w + x]); } for (let y = 0; y < h; y++) { border.add(lab[y * w]); border.add(lab[y * w + w - 1]); } const out = Uint8Array.from(m); for (let i = 0; i < w * h; i++) if (inv[i] && !border.has(lab[i])) out[i] = 1; return out; }
async function blurU8(a, w, h, sigma) { const { data } = await sharp(Buffer.from(a.buffer, a.byteOffset, a.length), { raw: { width: w, height: h, channels: 1 } }).blur(sigma).toColourspace("b-w").raw().toBuffer({ resolveWithObject: true }); return data; }

async function segment(rgbaPath, key) {
  const meta = await sharp(rgbaPath).metadata(); const W = meta.width, H = meta.height;
  const long = LONG.some((s) => key.startsWith(s));
  const cropH = long ? H : Math.round(H * 0.72);
  const side = Math.max(W, cropH);
  // crop the upper body, pad to a square with white, run the cloth model at 768
  const padded = await sharp(rgbaPath).extract({ left: 0, top: 0, width: W, height: cropH }).flatten({ background: "#ffffff" }).removeAlpha()
    .extend({ left: Math.floor((side - W) / 2), right: Math.ceil((side - W) / 2), top: 0, bottom: side - cropH, background: "#ffffff" }).png().toBuffer();
  const { data: rgb } = await sharp(padded).resize(768, 768, { fit: "fill" }).raw().toBuffer({ resolveWithObject: true });
  const S = 768, mean = [0.485, 0.456, 0.406], std = [0.229, 0.224, 0.225], f = new Float32Array(3 * S * S);
  for (let i = 0; i < S * S; i++) for (let c = 0; c < 3; c++) f[c * S * S + i] = (rgb[i * 3 + c] / 255 - mean[c]) / std[c];
  const out = await sess.run({ [sess.inputNames[0]]: new ort.Tensor("float32", f, [1, 3, S, S]) });
  const L = out[sess.outputNames[0]].data;
  const pg = new Uint8Array(S * S), pl = new Uint8Array(S * S);
  for (let i = 0; i < S * S; i++) { const l = [L[i], L[S * S + i], L[2 * S * S + i], L[3 * S * S + i]]; const mx = Math.max(...l); const e = l.map((v) => Math.exp(v - mx)); const sum = e[0] + e[1] + e[2] + e[3]; pg[i] = Math.round(((e[1] + e[3]) / sum) * 255); pl[i] = Math.round((e[2] / sum) * 255); }
  if (process.env.GHOST_DEBUG) { let c = 0, mn = 1e9, mxv = -1e9; for (let i = 0; i < S * S; i++) { if (pg[i] > 128) c++; } for (let i = 0; i < 4 * S * S; i += 997) { mn = Math.min(mn, L[i]); mxv = Math.max(mxv, L[i]); } console.log("seg pg>128", c, "logit range", mn, mxv, "dims", out[sess.outputNames[0]].dims); }
  // back to the crop resolution
  const sq = await sharp(Buffer.from(pg), { raw: { width: S, height: S, channels: 1 } }).resize(side, side, { kernel: "cubic" }).toColourspace("b-w").raw().toBuffer();
  if (process.env.GHOST_DEBUG) console.log("sq", sq.length, side * side);
  const big = await sharp(sq, { raw: { width: side, height: side, channels: 1 } }).extract({ left: Math.floor((side - W) / 2), top: 0, width: W, height: cropH }).toColourspace("b-w").raw().toBuffer();
  const sqL = await sharp(Buffer.from(pl), { raw: { width: S, height: S, channels: 1 } }).resize(side, side, { kernel: "cubic" }).toColourspace("b-w").raw().toBuffer();
  const bigL = await sharp(sqL, { raw: { width: side, height: side, channels: 1 } }).extract({ left: Math.floor((side - W) / 2), top: 0, width: W, height: cropH }).toColourspace("b-w").raw().toBuffer();
  const rgba = await sharp(rgbaPath).raw().toBuffer();
  return { W, H, cropH, prob: big, probL: bigL, rgba };
}

async function ghost(key) {
  const src = path.join(IN, `${key}.png`);
  const { W, H, cropH, prob, probL, rgba } = await segment(src, key);
  // working size: downscale 2x for the morphology (fast), RGB stays full-res
  const sc = 0.5, w = Math.round(W * sc), h = Math.round(cropH * sc);
  const pm = await sharp(Buffer.from(prob), { raw: { width: W, height: cropH, channels: 1 } }).resize(w, h).toColourspace("b-w").raw().toBuffer();
  const pml = await sharp(Buffer.from(probL), { raw: { width: W, height: cropH, channels: 1 } }).resize(w, h).toColourspace("b-w").raw().toBuffer();
  const al = await sharp(rgba, { raw: { width: W, height: H, channels: 4 } }).extract({ left: 0, top: 0, width: W, height: cropH }).extractChannel(3).resize(w, h).toColourspace("b-w").raw().toBuffer();
  let m = new Uint8Array(w * h); for (let i = 0; i < w * h; i++) m[i] = pm[i] > 128 && al[i] > 128 && pml[i] < (TEES.some((p) => key.startsWith(p)) ? 28 : 96) ? 1 : 0;
  if (process.env.GHOST_DEBUG) { let c1 = 0, c2 = 0, c3 = 0; for (let i = 0; i < w * h; i++) { if (pm[i] > 128) c1++; if (al[i] > 128) c2++; if (m[i]) c3++; } console.log("dbg", key, w, h, "prob>128", c1, "alpha>128", c2, "both", c3); }
  m = keepBig(m, w, h, 0.05);
  m = erode(dilate(m, w, h, 5), w, h, 5);       // close small gaps (drawstrings, zips, hands over fabric)
  m = fillHoles(m, w, h);
  m = keepBig(m, w, h, 0.5);
  m = erode(m, w, h, 1);
  if (TEES.some((p) => key.startsWith(p))) {
    const cnt = new Int32Array(h); let mx = 0; for (let y = 0; y < h; y++) { let c = 0; for (let x = 0; x < w; x++) c += m[y * w + x]; cnt[y] = c; if (c > mx) mx = c; }
    let hem = 0; for (let y = h - 1; y >= 0; y--) if (cnt[y] >= mx * 0.55) { hem = y; break; }
    for (let y = hem + 2; y < h; y++) for (let x = 0; x < w; x++) m[y * w + x] = 0;
    m = keepBig(m, w, h, 0.5);
  }
  // bounding box
  let x0 = w, x1 = 0, y0 = h, y1 = 0; for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (m[y * w + x]) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  // ── neck / hood interior: fill the gap between the left and right parts on the rows just below the highest point ──
  const patch = new Uint8Array(w * h); const gh = y1 - y0;
  let depthRows = Math.round(gh * 0.2);
  for (let y = y0; y < y0 + depthRows; y++) {
    let a = -1, b = -1; for (let x = x0; x <= x1; x++) if (m[y * w + x]) { if (a < 0) a = x; b = x; }
    if (a < 0) continue;
    // only bridge a real gap (opening wider than 8% of the garment width) between two separate parts
    let gap = 0, longest = 0, ls = 0, cs = 0; for (let x = a; x <= b; x++) { if (!m[y * w + x]) { if (!gap) cs = x; gap++; if (gap > longest) { longest = gap; ls = cs; } } else gap = 0; }
    if (longest > (x1 - x0) * 0.06) for (let x = ls; x < ls + longest; x++) patch[y * w + x] = 1;
  }
  // close the patch downward into the V of the neckline: also fill pockets enclosed by mask ∪ patch (convex-ish)
  const both = new Uint8Array(w * h); for (let i = 0; i < w * h; i++) both[i] = m[i] | patch[i];
  const closed = erode(dilate(both, w, h, 16), w, h, 16);
  for (let y = y0; y < y0 + Math.round(gh * 0.28); y++) for (let x = x0; x <= x1; x++) { const i = y * w + x; if (closed[i] && !both[i]) patch[i] = 1; }
  { // round the top corners: the visible inside of a collar / hood is an ellipse, not a box
    let px0 = w, px1 = 0, py0 = h; for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (patch[y * w + x]) { if (x < px0) px0 = x; if (x > px1) px1 = x; if (y < py0) py0 = y; }
    const cx = (px0 + px1) / 2, rx = Math.max(1, (px1 - px0) / 2), ry = rx * 0.55;
    for (let y = py0; y < py0 + ry + 2; y++) for (let x = px0; x <= px1; x++) { const k = Math.min(1, Math.abs(x - cx) / rx); const top = py0 + ry * (1 - Math.sqrt(1 - k * k)); if (y < top) patch[y * w + x] = 0; }
  }
  // smooth the patch shape a little
  const pS = await blurU8(patch.map((v) => v * 255), w, h, 2.2);
  for (let i = 0; i < w * h; i++) patch[i] = pS[i] > 110 && !m[i] ? 1 : 0;
  { // fringe cleanup next to the opening
    const small = await sharp(rgba, { raw: { width: W, height: H, channels: 4 } }).extract({ left: 0, top: 0, width: W, height: cropH }).resize(w, h).raw().toBuffer();
    let gr = 0, gg = 0, gb2 = 0, gn = 0; for (let y = y0 + Math.round(gh * 0.3); y < y0 + gh * 0.8; y += 4) for (let x = x0; x <= x1; x += 4) if (m[y * w + x]) { const p = (y * w + x) * 4; gr += small[p]; gg += small[p + 1]; gb2 += small[p + 2]; gn++; }
    gr /= gn; gg /= gn; gb2 /= gn;
    const near = dilate(patch, w, h, 5);
    for (let i = 0; i < w * h; i++) if (m[i] && near[i]) { const p = i * 4, r = small[p], g = small[p + 1], b = small[p + 2]; const d = Math.abs(r - gr) + Math.abs(g - gg) + Math.abs(b - gb2); if (d > 70 && r > g + 8 && g > b - 6 && r - b > 28 && r > 95) { m[i] = 0; patch[i] = 1; } }
  }
  const rim = new Uint8Array(w * h);
  let trenchFix = null;
  if (LONG.some((p) => key.startsWith(p))) {
    const small = await sharp(rgba, { raw: { width: W, height: H, channels: 4 } }).extract({ left: 0, top: 0, width: W, height: cropH }).resize(w, h).raw().toBuffer();
    const bw = x1 - x0, gh2 = y1 - y0; const samp = [];
    for (let y = Math.round(y0 + gh2 * 0.2); y < y0 + gh2 * 0.9; y += 2) for (let x = Math.round(x0 + bw * 0.04); x < x0 + bw * 0.4; x += 2) if (m[y * w + x]) { const p = (y * w + x) * 4; samp.push([small[p], small[p + 1], small[p + 2], small[p] + small[p + 1] + small[p + 2]]); }
    samp.sort((u, v) => u[3] - v[3]); const mid = samp.slice(Math.floor(samp.length * 0.5), Math.floor(samp.length * 0.85)); // the lit fabric, not the shadows
    let cr = 0, cg = 0, cb = 0; for (const q of mid) { cr += q[0]; cg += q[1]; cb += q[2]; } cr /= mid.length; cg /= mid.length; cb /= mid.length;
    // notches in the lower hem: close them with the coat colour
    const closedB = erode(dilate(m, w, h, 30), w, h, 30), fillMask = new Uint8Array(w * h);
    for (let y = Math.round(y0 + gh2 * 0.62); y <= y1; y++) for (let x = x0; x <= x1; x++) { const i = y * w + x; if (closedB[i] && !m[i]) fillMask[i] = 1; }
    // open front: paint a smooth, slightly darker central panel (the coat lining) over the shirt / trousers / gap, except on the belt rows
    const cxm = (x0 + x1) / 2, half = bw * 0.1, interior = new Uint8Array(w * h);
    const dist = (i) => { const p = i * 4; return Math.abs(small[p] - cr) + Math.abs(small[p + 1] - cg) + Math.abs(small[p + 2] - cb); };
    const keepRow = new Uint8Array(h);
    for (let y = Math.round(y0 + gh2 * 0.05); y <= y1; y++) { let good = 0, tot = 0; for (let x = Math.round(cxm - half); x <= cxm + half; x++) { const i = y * w + x; if (!m[i]) continue; tot++; if (dist(i) < 70) good++; } keepRow[y] = tot && good / tot > 0.7 ? 1 : 0; }
    for (let y = 1; y < h - 1; y++) if (!keepRow[y] && keepRow[y - 1] && keepRow[y + 1]) keepRow[y] = 1; // close one-row gaps inside the belt
    for (let y = Math.round(y0 + gh2 * 0.05); y <= y1; y++) { if (keepRow[y]) continue; for (let x = Math.round(cxm - half); x <= cxm + half; x++) { const i = y * w + x; if (m[i]) interior[i] = 1; } }
    const intD = interior;
    trenchFix = { cr, cg, cb, fillMask: dilate(fillMask, w, h, 1), intD };
    for (let i = 0; i < w * h; i++) if (fillMask[i]) m[i] = 1;
  }
  if (HOODED.some((p) => key.startsWith(p))) {
    let px0 = w, px1 = 0, py0 = h, py1 = 0; for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (patch[y * w + x]) { if (x < px0) px0 = x; if (x > px1) px1 = x; if (y < py0) py0 = y; if (y > py1) py1 = y; }
    const cx = (px0 + px1) / 2, rx = Math.max(1, (px1 - px0) / 2), ry = rx * 0.55, t = Math.max(3, rx * 0.2), cyE = py0 + ry, rx2 = rx + t, ry2 = ry + t;
    for (let y = 0; y < h; y++) for (let x = Math.floor(cx - rx2); x <= Math.ceil(cx + rx2); x++) {
      if (x < 0 || x >= w) continue; const i = y * w + x; if (patch[i] || m[i]) continue;
      const inOuter = ((x - cx) / rx2) ** 2 + ((y - cyE) / ry2) ** 2 <= 1;
      if (inOuter && y < cyE) rim[i] = 1;
    }
  }
  if (trenchFix) { // paint the fixes into the full-res colour buffer
    const { cr, cg, cb, fillMask, intD } = trenchFix; const gh2 = y1 - y0;
    for (let y = 0; y < cropH; y++) for (let x = 0; x < W; x++) {
      const hx = Math.min(w - 1, (x * sc) | 0), hy = Math.min(h - 1, (y * sc) | 0), hi = hy * w + hx, p = (y * W + x) * 4;
      if (intD[hi]) { const t = Math.min(1, Math.max(0, (hy - y0) / gh2)); const seam = Math.abs(hx - (x0 + x1) / 2) < 1.2 ? 0.82 : 1; const k = (1.02 - 0.06 * t) * seam; rgba[p] = cr * k; rgba[p + 1] = cg * k; rgba[p + 2] = cb * k; rgba[p + 3] = 255; }
      else if (fillMask[hi]) { rgba[p] = cr * 0.97; rgba[p + 1] = cg * 0.97; rgba[p + 2] = cb * 0.97; rgba[p + 3] = 255; }
    }
  }
  // ── final alpha (full-res) ──
  const full = new Uint8Array(W * cropH), patchFull = new Uint8Array(W * cropH);
  const mF = await sharp(Buffer.from(m.map((v) => v * 255)), { raw: { width: w, height: h, channels: 1 } }).resize(W, cropH, { kernel: "cubic" }).blur(1.6).toColourspace("b-w").raw().toBuffer();
  const rF = await sharp(Buffer.from(rim.map((v) => v * 255)), { raw: { width: w, height: h, channels: 1 } }).resize(W, cropH, { kernel: "cubic" }).blur(2.2).toColourspace("b-w").raw().toBuffer();
  const pF = await sharp(Buffer.from(patch.map((v) => v * 255)), { raw: { width: w, height: h, channels: 1 } }).resize(W, cropH, { kernel: "cubic" }).blur(1.6).toColourspace("b-w").raw().toBuffer();
  const aF = await sharp(rgba, { raw: { width: W, height: H, channels: 4 } }).extract({ left: 0, top: 0, width: W, height: cropH }).extractChannel(3).toColourspace("b-w").raw().toBuffer();
  // garment colour for the interior patch: median-ish colour of the garment, darkened
  let r = 0, g = 0, b = 0, n = 0; for (let y = 0; y < cropH; y += 8) for (let x = 0; x < W; x += 8) { const i = y * W + x; if (mF[i] > 200 && aF[i] > 200) { const p = (y * W + x) * 4; r += rgba[p]; g += rgba[p + 1]; b += rgba[p + 2]; n++; } }
  r /= n; g /= n; b /= n;
  const lum = (0.3 * r + 0.59 * g + 0.11 * b);
  const dark = lum > 150 ? 0.52 : lum > 80 ? 0.6 : 0.8; // light garments get a clearly darker lining, black ones a slightly lighter one
  const lin = [r * dark + (lum < 60 ? 14 : 0), g * dark + (lum < 60 ? 14 : 0), b * dark + (lum < 60 ? 14 : 0)];
  const outBuf = Buffer.alloc(W * cropH * 4);
  const top = y0 / sc, bot = (y0 + depthRows * 1.6) / sc;
  for (let y = 0; y < cropH; y++) for (let x = 0; x < W; x++) {
    const i = y * W + x, p = i * 4; const am = mF[i] / 255 * (aF[i] > 40 ? 1 : aF[i] / 40), ap = pF[i] / 255;
    // lining gradient: darker towards the top of the opening
    const t = Math.min(1, Math.max(0, (y - top) / Math.max(1, bot - top))), k = 0.72 + 0.28 * t;
    const cr = rgba[p], cg = rgba[p + 1], cb = rgba[p + 2];
    const ar = rF[i] / 255 * (1 - am) * (1 - ap * 0.85);
    const A = Math.min(1, am + ap * (1 - am) + ar);
    if (A <= 0.003) continue;
    const mix = ap * (1 - am); // share of lining in this pixel
    const kk = 0.62 + 0.38 * t;
    outBuf[p] = Math.round((cr * am + lin[0] * kk * mix + r * 0.92 * ar) / Math.max(A, 0.001)); outBuf[p + 1] = Math.round((cg * am + lin[1] * kk * mix + g * 0.92 * ar) / Math.max(A, 0.001)); outBuf[p + 2] = Math.round((cb * am + lin[2] * kk * mix + b * 0.92 * ar) / Math.max(A, 0.001));
    outBuf[p + 3] = Math.round(A * 255);
  }
  // tight crop
  const gx0 = Math.max(0, Math.floor(x0 / sc) - 12), gx1 = Math.min(W - 1, Math.ceil(x1 / sc) + 12), gy0 = Math.max(0, Math.floor(y0 / sc) - 12), gy1 = Math.min(cropH - 1, Math.ceil(y1 / sc) + 12);
  await sharp(outBuf, { raw: { width: W, height: cropH, channels: 4 } }).extract({ left: gx0, top: gy0, width: gx1 - gx0 + 1, height: gy1 - gy0 + 1 }).png().toFile(path.join(OUT, `${key}.png`));
  return { key, w: gx1 - gx0 + 1, h: gy1 - gy0 + 1, patchPx: patch.reduce((s, v) => s + v, 0), area: m.reduce((s, v) => s + v, 0) };
}

const keys = process.argv.slice(2).length ? process.argv.slice(2) : fs.readdirSync(IN).filter((f) => f.endsWith(".png")).map((f) => f.slice(0, -4)).filter((k) => TOP_SLUGS.some((s) => k.startsWith(s + "-")));
const report = [];
for (const k of keys) { try { const r = await ghost(k); report.push(r); console.log("ok", k, r.w + "x" + r.h); } catch (e) { console.log("FAIL", k, String(e).slice(0, 120)); report.push({ key: k, error: String(e) }); } }
fs.writeFileSync(path.join(OUT, "report.json"), JSON.stringify(report, null, 1));
