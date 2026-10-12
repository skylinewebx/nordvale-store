// Cuts the real hero hoodie photo into separate parts (transparent WebP) for the scroll "assemble" hero.
//   node scripts/cut-hoodie.mjs [source.jpg]
// Parts: hood, body, pocket, hem, sleeve L/R upper + lower. Garment = dark pixels (the hoodie is black on a light studio wall).
import fs from "node:fs";
import sharp from "sharp";

const SRC = process.argv[2] ?? "incoming/nordic-drift-black.jpg";
const OUT = "public/assets/hero/parts";
const W = 1200, H = 2150, K = W / 1080; // coordinates below are in a 1080-wide space
fs.mkdirSync(OUT, { recursive: true });

const { data } = await sharp(SRC).resize(W, H).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const lum = new Float32Array(W * H);
for (let i = 0; i < W * H; i++) lum[i] = (0.299 * data[i * 4] + 0.587 * data[i * 4 + 1] + 0.114 * data[i * 4 + 2]) / 255;
const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

// point in polygon (1080-space)
const inPoly = (x, y, p) => { let c = false; for (let i = 0, j = p.length - 1; i < p.length; j = i++) { const [xi, yi] = p[i], [xj, yj] = p[j]; if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c; } return c; };

const HOOD = [[300, 640], [292, 520], [330, 430], [725, 430], [782, 540], [792, 640], [520, 668]];
const OPEN = [[400, 504], [418, 458], [466, 432], [550, 426], [632, 434], [684, 462], [702, 504], [690, 520], [656, 548], [520, 654], [440, 550], [412, 520]]; // hood opening (face/neck/beard) → dark cavity
const POCKET = [[352, 1178], [756, 1178], [815, 1240], [296, 1240]];
const HEM_Y = 1240, BOTTOM = 1334, ELBOW = 905, TOP = 428;
const xL = (y) => (y < 600 ? 312 - (y - 470) * 0.47 : 251 - (y - 600) * 0.05);
const xR = (y) => (y < 600 ? 768 + (y - 470) * 0.47 : 829 + (y - 600) * 0.03);

const part = (x, y) => {
  if (inPoly(x, y, HOOD)) return "hood";
  if (y >= 470 && y < HEM_Y && x < xL(y)) return y < ELBOW ? "slL1" : "slL2";
  if (y >= 470 && y < HEM_Y && x > xR(y)) return y < ELBOW ? "slR1" : "slR2";
  if (y >= HEM_Y) return x < xL(HEM_Y) - 5 ? "slL2" : x > xR(HEM_Y) + 5 ? "slR2" : "hem";
  if (inPoly(x, y, POCKET)) return "pocket";
  return "body";
};

const NAMES = ["hood", "body", "pocket", "hem", "slL1", "slL2", "slR1", "slR2"];
const bufs = Object.fromEntries(NAMES.map((n) => [n, Buffer.alloc(W * H * 4)]));
const box = Object.fromEntries(NAMES.map((n) => [n, { x0: W, y0: H, x1: 0, y1: 0 }]));
let gx0 = W, gy0 = H, gx1 = 0, gy1 = 0;

for (let y = Math.floor(TOP * K); y < Math.floor(BOTTOM * K); y++) {
  for (let x = 0; x < W; x++) {
    const i = y * W + x; const X = x / K, Y = y / K;
    let a = 1 - smooth(0.3, 0.46, lum[i]);
    const p = part(X, Y);
    let r = data[i * 4], g = data[i * 4 + 1], b = data[i * 4 + 2];
    // hood opening (skin / neck): fill with a dark cavity so the hood reads as a hood
    if (p === "hood" && inPoly(X, Y, OPEN)) { const t = Math.min(1, Math.max(0, (Y - 425) / 230)); r = 12 + t * 16; g = 12 + t * 16; b = 14 + t * 17; a = 1; }
    if (a < 0.02) continue;
    const targets = new Set([p]);
    for (const [dx, dy] of [[3, 0], [-3, 0], [0, 3], [0, -3]]) targets.add(part((x + dx) / K, (y + dy) / K)); // overlap into neighbours
    for (const q of targets) {
      const buf = bufs[q]; buf[i * 4] = r; buf[i * 4 + 1] = g; buf[i * 4 + 2] = b; buf[i * 4 + 3] = Math.round(a * 255);
      const bb = box[q]; if (x < bb.x0) bb.x0 = x; if (x > bb.x1) bb.x1 = x; if (y < bb.y0) bb.y0 = y; if (y > bb.y1) bb.y1 = y;
    }
    if (a > 0.5) { if (x < gx0) gx0 = x; if (x > gx1) gx1 = x; if (y < gy0) gy0 = y; if (y > gy1) gy1 = y; }
  }
}
gx0 -= 4; gy0 -= 4; gx1 += 4; gy1 += 4;
const GW = gx1 - gx0, GH = gy1 - gy0;
const meta = { width: GW, height: GH, parts: {} };
let comp = [];
for (const n of NAMES) {
  const b = box[n]; if (b.x1 <= b.x0) continue;
  const w = b.x1 - b.x0 + 1, h = b.y1 - b.y0 + 1;
  const img = sharp(bufs[n], { raw: { width: W, height: H, channels: 4 } }).extract({ left: b.x0, top: b.y0, width: w, height: h });
  await img.clone().webp({ quality: 86, alphaQuality: 90, effort: 5 }).toFile(`${OUT}/${n}.webp`);
  meta.parts[n] = { x: +(((b.x0 - gx0) / GW) * 100).toFixed(3), y: +(((b.y0 - gy0) / GH) * 100).toFixed(3), w: +((w / GW) * 100).toFixed(3), h: +((h / GH) * 100).toFixed(3), kb: Math.round(fs.statSync(`${OUT}/${n}.webp`).size / 1024) };
  comp.push({ input: await img.png().toBuffer(), left: b.x0 - gx0, top: b.y0 - gy0 });
}
fs.writeFileSync(`${OUT}/parts.json`, JSON.stringify(meta, null, 1));
fs.writeFileSync("src/hero/hoodieParts.json", JSON.stringify(meta));
// preview: assembled, on a light stage
await sharp({ create: { width: GW, height: GH, channels: 3, background: "#e6e3dd" } }).composite(comp).jpeg({ quality: 80 }).toFile(process.env.PREVIEW ?? "preview.jpg");
console.log(JSON.stringify(meta));
