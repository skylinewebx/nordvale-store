import { removeBackground } from "@imgly/background-removal-node";
import fs from "node:fs"; import path from "node:path";
const dir = process.env.INCOMING ?? "incoming"; // needs: npm i -D @imgly/background-removal-node  (offline model, ~8 s per photo)
const out = process.env.CUTOUTS ?? "cutouts"; fs.mkdirSync(out, { recursive: true });
const files = fs.readdirSync(dir).filter(f => /\.jpe?g$/i.test(f));
for (const f of files) {
  const key = f.replace(/\.jpe?g$/i, "");
  const dst = path.join(out, key + ".png");
  if (fs.existsSync(dst)) continue;
  try {
    const blob = await removeBackground(new Blob([fs.readFileSync(path.join(dir, f))], { type: "image/jpeg" }), { model: "medium", output: { format: "image/png" } });
    fs.writeFileSync(dst, Buffer.from(await blob.arrayBuffer()));
    console.log("done", key);
  } catch (e) { console.log("FAIL", key, String(e).slice(0, 100)); }
}
console.log("ALL DONE");
