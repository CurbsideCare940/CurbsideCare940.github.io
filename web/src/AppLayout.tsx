import { useAuth } from "@/lib/auth";
import { useAppView, type AppView, ViewLink } from "@/lib/app-context";

interface NavItem {
  to: AppView;
  label: string;
}

export default function AppLayout({
  children,
  navItems,
}: {
  children: React.ReactNode;
  navItems: NavItem[];
}) {
  const { profile, signOut } = useAuth();
  const { setView } = useAppView();

  return (
    <div className="layout">
      <aside className="navRail">
        <div style={{ padding: "0 12px 16px 12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <img src="/cclogo.jpg" alt="Curbside Care" style={{ height: 36, borderRadius: 8 }} />
            <div>
              <div style={{ fontWeight: 800, fontSize: 17, color: "var(--ink)" }}>
                {profile?.full_name ?? "Curbside Care"}
              </div>
              <div style={{ fontSize: 12, color: "var(--muted)" }}>
                {profile?.email}
              </div>
            </div>
          </div>
          <div
            style={{
              fontSize: 11,
              fontWeight: 800,
              color: "var(--teal-dark)",
              marginTop: 4,
              textTransform: "uppercase",
              letterSpacing: 0.5,
            }}
          >
            {profile?.role ?? "user"} view
          </div>
        </div>

        {navItems.map((n) => (
          <NavButton key={n.to} to={n.to} label={n.label} />
        ))}

        <button
          className="btn btn-ghost"
          style={{ marginTop: 16, width: "100%" }}
          onClick={() => signOut().then(() => setView("login"))}
        >
          Sign out
        </button>
      </aside>

      <main className="main">
        <div className="wrap">
          <div className="toolbar" style={{ marginBottom: 14 }}>
            <span
              style={{
                fontSize: 12,
                fontWeight: 800,
                color: "var(--teal)",
                textTransform: "uppercase",
                letterSpacing: 0.5,
              }}
            >
              Curbside Care &middot; Talk Trash To Us...Seriously....We love it!
            </span>
          </div>
          {children}
        </div>
      </main>
    </div>
  );
}

function NavButton({ to, label }: { to: AppView; label: string }) {
  const { view } = useAppView();
  return (
    <ViewLink to={to} className={view === to ? "active" : ""}>
      {label}
    </ViewLink>
  );
}
