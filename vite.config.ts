import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    VitePWA({
      registerType: "autoUpdate",
      injectRegister: null,
      filename: "sw.js",
      devOptions: { enabled: false },
      includeAssets: [
        "favicon.ico",
        "apple-touch-icon.png",
        "icon-192.png",
        "icon-512.png",
      ],
      manifest: false,
      workbox: {
        navigateFallback: "/index.html",
        navigateFallbackDenylist: [/^\/~oauth/],
        globPatterns: ["**/*.{js,css,html,ico,png,svg,webmanifest,woff2}"],
        cleanupOutdatedCaches: true,
        runtimeCaching: [
          // HTML navigations: network first so updates roll out.
          {
            urlPattern: ({ request }) => request.mode === "navigate",
            handler: "NetworkFirst",
            options: {
              cacheName: "yuvience-html",
              networkTimeoutSeconds: 4,
              expiration: { maxEntries: 32, maxAgeSeconds: 60 * 60 * 24 },
            },
          },
          // Manga chapter pages (unsplash / remote images): cache-first so
          // previously read chapters work offline.
          {
            urlPattern: ({ url }) =>
              url.origin === "https://images.unsplash.com" ||
              /\.(?:png|jpg|jpeg|webp|avif|gif)$/i.test(url.pathname),
            handler: "CacheFirst",
            options: {
              cacheName: "yuvience-chapter-pages",
              expiration: {
                maxEntries: 500,
                maxAgeSeconds: 60 * 60 * 24 * 30,
              },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          // Fonts
          {
            urlPattern: ({ url }) =>
              url.origin === "https://fonts.googleapis.com" ||
              url.origin === "https://fonts.gstatic.com",
            handler: "StaleWhileRevalidate",
            options: { cacheName: "yuvience-fonts" },
          },
        ],
      },
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
