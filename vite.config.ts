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
          three: ["three", "@react-three/fiber", "@react-three/drei"],
          motion: ["gsap", "framer-motion", "lenis"],
        },
      },
    },
  },
});
