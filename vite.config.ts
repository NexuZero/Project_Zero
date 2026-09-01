import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import path from "node:path";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["icons/icon-192.svg", "icons/icon-512.svg"],
      manifest: {
        name: "Project Zero — Idea Engine",
        short_name: "Project Zero",
        description: "Turn problems into projects. An offline-first, rule-based idea engine — no account, no cloud AI.",
        theme_color: "#6366F1",
        background_color: "#0B0B0F",
        display: "standalone",
        start_url: "/",
        scope: "/",
        icons: [
          { src: "icons/icon-192.svg", sizes: "192x192", type: "image/svg+xml", purpose: "any" },
          { src: "icons/icon-512.svg", sizes: "512x512", type: "image/svg+xml", purpose: "any" },
          { src: "icons/icon-maskable.svg", sizes: "512x512", type: "image/svg+xml", purpose: "maskable" }
        ]
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,svg,woff2}"],
        navigateFallback: "/index.html",
        // The optional, opt-in WebLLM prose layer (Kit Depth Upgrade Stage B) pulls in a
        // multi-MB vendor chunk + worker bundle via a runtime dynamic import — deliberately
        // never in the main bundle, so it costs nothing for users who don't opt in. Workbox
        // must not precache it either, or every visitor's service worker would eagerly
        // download it on first load regardless of opt-in, defeating the entire point (and
        // exceeding Workbox's 2MB default precache-per-file limit, which fails the build).
        // manualChunks below gives these an identifiable name so this glob is unambiguous.
        globIgnores: ["**/webllm-vendor-*.js", "**/webllm.worker-*.js"]
      },
      devOptions: {
        enabled: false
      }
    })
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src")
    }
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (id.includes("@mlc-ai/web-llm") || id.includes("@mlc-ai/web-tokenizers")) {
            return "webllm-vendor";
          }
        }
      }
    }
  }
});
