import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          supabase: ["@supabase/supabase-js"],
          "react-vendor": ["react", "react-dom", "react-router-dom"],
        },
      },
    },
  },
  server: {
    host: "0.0.0.0",
    port: 3000,
    proxy: {
      "/supabase": {
        target: "http://127.0.0.1:54321",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/supabase/, ""),
      },
    },
  },
});
