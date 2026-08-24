import { createClient, type Session, type User } from "@supabase/supabase-js";

// Public anon key + URL (safe to ship to browser — the same key the Expo app uses).
// Set VITE_SUPABASE_ANON_KEY at build time (see web/README.md "Env / keys").
// If it is missing the auth calls will fail loudly against the live project,
// which is intentional — we never want to silently ship a broken key.
export const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL ||
  "https://zhhkcnqwujuizytlbxeu.supabase.co";
export const SUPABASE_ANON_KEY =
  import.meta.env.VITE_SUPABASE_ANON_KEY || "<SET_VITE_SUPABASE_ANON_KEY>";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    storageKey: "cc-web-auth",
  },
});

export type { Session, User };
