import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase, type Session, type User } from "./supabase";

export type Role = "admin" | "customer" | "employee";

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  role: Role;
  created_at: string;
}

export interface AuthState {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  role: Role | null;
  signedIn: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

async function fetchProfile(uid: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, email, phone, role, created_at")
    .eq("id", uid)
    .maybeSingle();
  if (error || !data) {
    // eslint-disable-next-line no-console
    console.error("profile fetch:", error?.message);
    return null;
  }
  return data as Profile;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(async ({ data }) => {
      if (!active) return;
      const s = data.session ?? null;
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) setProfile(await fetchProfile(s.user.id));
      else setProfile(null);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      const s = newSession ?? null;
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) setProfile(await fetchProfile(s.user.id));
      else setProfile(null);
      setLoading(false);
    });
    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  const role = profile?.role ?? null;
  const signedIn = !!session;

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) return { error: error.message };
    // Refuse employee access on the web: the portal is admin + customer only.
    const u = data?.user;
    if (u) {
      const { data: prof, error: profErr } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", u.id)
        .maybeSingle();
      // Sign them out if they're an employee; the app will bounce to login.
      if (!profErr && prof?.role === "employee") {
        await supabase.auth.signOut();
        return { error: "Employee access is only available in the mobile app." };
      }
      if (prof) setProfile(prof as Profile);
    }
    return {};
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        profile,
        loading,
        role,
        signedIn,
        signIn,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
