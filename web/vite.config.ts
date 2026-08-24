// @ts-nocheck
// Web app served from /app/ on curbsidecare.net (GitHub Pages).
// React JSX automatic runtime is handled by esbuild (no @vitejs/plugin-react
// dependency needed — keeps the dependency tree minimal).
import { defineConfig } from "vite";
import { fileURLToPath } from "url";

export default defineConfig({
  base: "/app/",
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  esbuild: { jsx: "automatic", jsxImportSource: "react" },
  build: { outDir: "dist", emptyOutDir: true, target: "es2022" },
  server: { open: true },
});
