// Ambient Vite env typing (replaces "vite/client" which isn't installed as
// @types/vite here). Lets import.meta.env.VITE_* resolve under tsc.
interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  readonly [key: string]: string | undefined;
}
interface ImportMeta {
  readonly env: ImportMetaEnv;
}
