// Generates public/og.png (1200×630) in code: brand wordmark on the site's off-white,
// plus the hero hoodie if public/assets/images/hero-static.webp exists.   npm run og
import fs from "node:fs";
import sharp from "sharp";

const W = 1200, H = 630;
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  <defs><radialGradient id="g" cx="68%" cy="48%" r="70%"><stop offset="0" stop-color="#fbfaf7"/><stop offset="0.65" stop-color="#e9e5de"/><stop offset="1" stop-color="#d9d4cb"/></radialGradient></defs>
  <rect width="${W}" height="${H}" fill="url(#g)"/>
  <text x="80" y="140" font-family="Helvetica, Arial, sans-serif" font-size="18" letter-spacing="5" fill="#8a8680">WINTER COLLECTION  2026</text>
  <text x="76" y="310" font-family="Georgia, 'Times New Roman', serif" font-weight="300" font-size="92" letter-spacing="22" fill="#1c1c1e">NORDVALE</text>
  <line x1="80" y1="350" x2="260" y2="350" stroke="#1c1c1e" stroke-width="1"/>
  <text x="80" y="402" font-family="Georgia, serif" font-style="italic" font-size="34" fill="#4a4a4d">Seven hoodies. One cold season.</text>
</svg>`;

const layers = [];
const hero = "public/assets/images/hero-static.webp";
if (fs.existsSync(hero)) {
  const img = await sharp(hero).resize({ height: 560, width: 560, fit: "contain", background: "#ffffff" }).png().toBuffer();
  layers.push({ input: img, left: 600, top: 35, blend: "multiply" });
}
await sharp(Buffer.from(svg)).composite(layers).png({ compressionLevel: 9 }).toFile("public/og.png");
console.log(`public/og.png written${layers.length ? " (with hero hoodie)" : " (wordmark only: add hero-static.webp and re-run)"}`);
