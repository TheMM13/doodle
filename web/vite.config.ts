import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      manifest: {
        name: "doodle.io",
        short_name: "doodle.io",
        description: "Draw. Guess. Win. A skribbl.io-style drawing game.",
        theme_color: "#5aa9e6",
        background_color: "#fefbea",
        display: "standalone",
        start_url: "/",
        icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }],
      },
    }),
  ],
  server: {
    host: true,
    port: 5180,
    strictPort: true,
  },
});
