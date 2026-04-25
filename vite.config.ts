import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: { overlay: false },
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
,
  ].filter(Boolean),
  esbuild: {
    target: "es2020",
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
  build: {
    chunkSizeWarningLimit: 2000,
    rollupOptions: {
      output: {
        manualChunks: {
          "vendor-react": ["react", "react-dom", "react-router-dom"],
          "vendor-ui": ["@radix-ui/react-dialog", "@radix-ui/react-select", "@radix-ui/react-tabs"],
          "vendor-supabase": ["@supabase/supabase-js"],
          "vendor-tiptap": ["@tiptap/react", "@tiptap/starter-kit"],
          "vendor-motion": ["framer-motion"],
          "vendor-charts": ["recharts"],
        },
      },
    },
  },
}));
