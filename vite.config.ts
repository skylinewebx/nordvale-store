import { defineConfig, Plugin } from "vite";
import react from "@vitejs/plugin-react";
import fs from "node:fs";
import path from "node:path";

const WEB = /\.(webp|avif|jpe?g|png|svg|glb|gltf|mp4|webm)$/i;

function walk(dir: string, out: string[] = []) {
  if (!fs.existsSync(dir)) return out;
  for (const f of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, f.name);
    if (f.isDirectory()) { if (f.name !== "products") walk(p, out); } else if (WEB.test(f.name)) out.push(p);
  }
  return out;
}

// Serves/emits /assets/manifest.json: the list of files that actually exist in public/assets.
function assetManifest(): Plugin {
  const publicDir = path.resolve("public");
  const build = () => JSON.stringify({ generated: new Date().toISOString(), files: walk(path.join(publicDir, "assets")).map((p) => "/" + path.relative(publicDir, p).split(path.sep).join("/")) });
  return {
    name: "asset-manifest",
    // Inline the product manifest (sizes, LQIP, hashes) into the HTML: zero extra request, images know their size and blur on first paint.
    transformIndexHtml(html) {
      const f = path.join(publicDir, "assets/products/manifest.json");
      if (!fs.existsSync(f)) return html;
      const data = JSON.stringify(JSON.parse(fs.readFileSync(f, "utf8"))).replace(/</g, "\u003c");
      return html.replace("</head>", `<script>window.__PRODUCTS__=${data}</script></head>`);
    },
    configureServer(server) {
      server.middlewares.use("/assets/manifest.json", (_req, res) => {
        res.setHeader("Content-Type", "application/json"); res.setHeader("Cache-Control", "no-store"); res.end(build());
      });
    },
    closeBundle() {
      const out = path.resolve("dist/assets");
      fs.mkdirSync(out, { recursive: true });
      fs.writeFileSync(path.join(out, "manifest.json"), build());
    },
  };
}

export default defineConfig({
  plugins: [react(), assetManifest()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          motion: ["gsap", "lenis"], // framer-motion is split by Rollup: core in the entry, domMax features in a lazy chunk
        },
      },
    },
  },
});
