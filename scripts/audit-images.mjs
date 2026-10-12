// Static audit: products × colours vs manifest.json vs real files; also flags hand-written product paths in src/.
import fs from "node:fs";
import path from "node:path";
import { products } from "../src/data/products.ts";
const dir = "public/assets/products";
const man = fs.existsSync(`${dir}/manifest.json`) ? JSON.parse(fs.readFileSync(`${dir}/manifest.json`, "utf8")).items : {};
const files = new Set(fs.readdirSync(dir));
const rows = [];
for (const p of products) for (const c of p.colors) {
  const key = `${p.slug}-${c.slug}`; const it = man[key];
  const issues = [];
  if (!it) issues.push("not in manifest");
  if (!files.has(`${key}.webp`)) issues.push("detail file missing");
  if (!files.has(`${key}-card.webp`)) issues.push("card file missing");
  if (/[A-Z\s]/.test(key)) issues.push("uppercase/space in key");
  rows.push({ key, issues });
}
const mk = Object.keys(man).filter((k) => !rows.some((r) => r.key === k));
const stray = [...files].filter((f) => f !== "manifest.json" && !/-card\.webp$|\.webp$|\.mp4$/.test(f));
const handwritten = [];
(function walk(d) { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); if (e.isDirectory()) walk(p); else if (/\.(tsx?|css)$/.test(e.name)) fs.readFileSync(p, "utf8").split("\n").forEach((l, i) => { if (/assets\/products/.test(l)) handwritten.push(`${p}:${i + 1}  ${l.trim().slice(0, 100)}`); }); } })("src");
console.log("expected", rows.length, "· with problems:", rows.filter((r) => r.issues.length).length);
rows.filter((r) => r.issues.length).forEach((r) => console.log("  ", r.key, "→", r.issues.join(", ")));
console.log("manifest keys not in catalog:", mk.length ? mk.join(", ") : "none");
console.log("stray files:", stray.length ? stray.join(", ") : "none");
console.log("hand-written product paths in src/:\n  " + (handwritten.join("\n  ") || "none"));
