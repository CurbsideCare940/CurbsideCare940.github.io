import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { useAppView } from "@/lib/app-context";

export default function LoginPage() {
  const { signIn, signedIn, role, loading } = useAuth();
  const { setView } = useAppView();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // Already signed in: route to the correct section (employees are blocked
  // in AuthProvider.signIn, so only customer/admin reach here).
  useEffect(() => {
    if (loading || !signedIn) return;
    if (role === "admin") setView("admin-overview");
    else if (role === "customer") setView("customer-overview");
  }, [loading, signedIn, role, setView]);

  if (loading) {
    return (
      <div className="page-center">
        <div className="spinner" aria-label="Loading" />
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErr(null);
    const res = await signIn(email.trim(), password);
    if (res.error) {
      setErr(res.error);
      setSubmitting(false);
    }
    // Auth state change resolves role; App.tsx routes accordingly.
  };

  return (
    <div className="page-center">
      <div className="card" style={{ width: "100%", maxWidth: 400 }}>
        <div style={{ textAlign: "center", marginBottom: 16 }}>
          <img src="/cclogo.jpg" alt="Curbside Care" style={{ height: 42, width: "auto", borderRadius: 8 }} />
          <b style={{ fontSize: 20, fontWeight: 800, color: "var(--ink)", marginTop: 8, display: "block" }}>
            Curbside Care
          </b>
          <span style={{ fontSize: 11, fontWeight: 700, color: "var(--teal)", textTransform: "uppercase" }}>
            Talk Trash To Us...Seriously....We love it!
          </span>
        </div>
        <h3 style={{ fontSize: 20, marginBottom: 4 }}>Account portal</h3>
        <p style={{ color: "var(--muted)", fontSize: 14, marginBottom: 18 }}>
          Sign in to manage your subscription, bin placement, and support.
        </p>
        <form onSubmit={handleSubmit} style={{ display: "grid", gap: 14 }}>
          <label>
            Email
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>
          <label>
            Password
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(p) => setPassword(p.target.value)}
              required
              minLength={8}
            />
          </label>
          {err && <div className="status-err">{err}</div>}
          <button className="btn btn-primary" type="submit" disabled={submitting}>
            {submitting ? "Signing in…" : "Sign in"}
          </button>
        </form>
        <p style={{ color: "var(--muted)", fontSize: 13, marginTop: 16 }}>
          Don't have an account yet? Sign up on{" "}
          <a
            href="https://curbsidecare.net"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "var(--teal-dark)" }}
          >
            curbsidecare.net
          </a>, then return here to sign in.
        </p>
      </div>
    </div>
  );
}
