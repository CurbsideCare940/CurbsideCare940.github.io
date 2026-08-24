// @ts-nocheck
// Web app served from /app/ on curbsidecare.net (GitHub Pages).
// React JSX automatic runtime is handled by esbuild (no @vitejs/plugin-react
// dependency needed — keeps the dependency tree minimal).
import { defineConfig, loadEnv } from "vite";
import { fileURLToPath } from "url";
import { existsSync, readFileSync } from "fs";
import { resolve } from "path";

// Ingest the real Supabase keys at build time (they are public, same keys the
// Expo app ships). Precedence:
//   1. VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY (set by the caller)
//   2. a .env file at the Pages-repo root (./../.env)
//   3. the sibling Expo app's .env (CURBCARE_APP_DIR or ../curbcare/.env)
const pagesRoot = fileURLToPath(new URL(".", import.meta.url));
const candidateEnvFiles = [
  resolve(pagesRoot, "../../.env"),          // sibling repos under one parent (sandbox)
  resolve(pagesRoot, "../.env"),             // Pages-repo root .env
  resolve(pagesRoot, "../../curbcare/.env"), // sibling Expo app .env (real keys)
  process.env.CURBCARE_APP_DIR ? resolve(process.env.CURBCARE_APP_DIR, ".env") : null,
].filter(Boolean) as string[];

const parsedKeys: Record<string, string> = {};
for (const p of candidateEnvFiles) {
  if (!existsSync(p)) continue;
  for (const line of readFileSync(p, "utf8").split("\n")) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m) parsedKeys[m[1]] = m[2].trim().replace(/(^["']|["']$)/g, "");
  }
}

function key(name: string): string | undefined {
  return process.env[name] ?? parsedKeys[name] ?? parsedKeys[`EXPO_PUBLIC_${name.replace(/^VITE_/, "")}`];
}

const supabaseUrl = key("VITE_SUPABASE_URL") ?? "";
const supabaseAnonKey = key("VITE_SUPABASE_ANON_KEY") ?? "";

export default defineConfig(({ mode }) => {
  // Load Vite's own .env (VITE_* vars) on top of the manual resolution above.
  const env = loadEnv(mode, pagesRoot);
  const finalUrl = env.VITE_SUPABASE_URL || supabaseUrl;
  const finalKey = env.VITE_SUPABASE_ANON_KEY || supabaseAnonKey;
  return {
    base: "/app/",
    resolve: {
      alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
    },
    esbuild: { jsx: "automatic", jsxImportSource: "react" },
    define: {
      "import.meta.env.VITE_SUPABASE_URL": JSON.stringify(finalUrl),
      "import.meta.env.VITE_SUPABASE_ANON_KEY": JSON.stringify(finalKey),
    },
    build: { outDir: "dist", emptyOutDir: true, target: "es2022" },
    server: { open: true },
  };
});
