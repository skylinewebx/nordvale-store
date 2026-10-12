import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { LazyMotion } from "framer-motion";
import App from "./App";
import "./index.css";
import { loadManifest } from "./lib/assets";
import { loadCatalog } from "./lib/catalog";

loadManifest();
loadCatalog();

// Service worker: production only. In development, remove any registered worker and its caches so stale files never hide changes.
if ("serviceWorker" in navigator) {
  if (import.meta.env.PROD) window.addEventListener("load", () => navigator.serviceWorker.register("/sw.js").catch(() => {}));
  else { navigator.serviceWorker.getRegistrations().then((rs) => rs.forEach((r) => r.unregister())); caches?.keys().then((ks) => ks.filter((k) => k.startsWith("nv-")).forEach((k) => caches.delete(k))); }
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <LazyMotion features={() => import("./lib/motionFeatures").then((r) => r.default)} strict>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </LazyMotion>
  </React.StrictMode>
);
