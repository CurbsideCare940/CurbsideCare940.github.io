import { useState, useEffect } from "react";
import { fetchAllCustomers, type AdminCustomerRow } from "@/lib/data";
import { ViewLink } from "@/lib/app-context";

export default function AdminOverview() {
  const [customers, setCustomers] = useState<AdminCustomerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    fetchAllCustomers()
      .then(setCustomers)
      .catch((e: any) => setErr(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="spinner" aria-label="Loading" />;
  if (err) return <div className="status-err">{err}</div>;

  const total = customers.length;
  const active = customers.filter(
    (c) => c.customers?.active && c.subscriptions?.status === "active",
  ).length;
  const churned = customers.filter(
    (c) => !c.subscriptions || c.subscriptions.status === "canceled" || c.subscriptions.status === "past_due",
  ).length;
  const trial = customers.filter(
    (c) => c.subscriptions && c.subscriptions.status === "pending",
  ).length;

  // Zone coverage: count customers per official pickup day.
  const zoneCounts: Record<string, number> = {};
  customers.forEach((c) => {
    if (c.customers) {
      const day = c.customers.official_pickup_day || "unset";
      zoneCounts[day] = (zoneCounts[day] || 0) + 1;
    }
  });

  const zones = (Object.keys(zoneCounts) as string[])
    .sort((a, b) => zoneCounts[b] - zoneCounts[a])
    .map((z) => ({ day: z, count: zoneCounts[z] }));

  return (
    <div>
      <div className="toolbar">
        <h3 style={{ margin: 0 }}>Admin overview</h3>
        <span style={{ fontSize: 13, color: "var(--muted)" }}>
          {total} customer{total === 1 ? "" : "s"} · updated just now
        </span>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 16,
          marginTop: 16,
        }}
      >
        <Stat label="Subscribed" value={String(active)} sub={String(total)} color="var(--teal)" />
        <Stat label="Past due / canceled" value={String(churned)} sub={`${Math.round((churned / (total || 1)) * 100)}% of base`} color="var(--coral)" />
        <Stat label="Setting up" value={String(trial)} sub="pending / trial" color="var(--citrus)" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 20 }}>
        <div className="card">
          <h4 style={{ marginTop: 0, fontSize: 15 }}>Zone coverage</h4>
          <p style={{ fontSize: 12, color: "var(--muted)", marginBottom: 12 }}>
            Customers by pickup day. SE = Monday, NE = Tuesday, NW = Thursday, SW = Friday.
          </p>
          <div style={{ display: "grid", gap: 12 }}>
            {zones.length === 0 ? (
              <p style={{ fontSize: 13, color: "var(--muted)" }}>No address-billed customers yet.</p>
            ) : (
              zones.map((z) => (
                <ZoneBar key={z.day} day={z.day} count={z.count} max={zones[0].count} />
              ))
            )}
          </div>
        </div>

        <div className="card">
          <h4 style={{ marginTop: 0, fontSize: 15 }}>Quick actions</h4>
          <p style={{ fontSize: 12, color: "var(--muted)", marginBottom: 12 }}>
            Employee accounts live in the mobile app — create and reset
            passwords for customers and other admins here.
          </p>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <ViewLink to="admin-customers" className="btn btn-primary" style={{ fontSize: 14 }}>
              Customers ({total})
            </ViewLink>
            <ViewLink to="admin-tickets" className="btn btn-ghost" style={{ fontSize: 14 }}>
              Support tickets
            </ViewLink>
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, sub, color }: { label: string; value: string; sub: string; color: string }) {
  return (
    <div className="card" style={{ textAlign: "center" }}>
      <div style={{ display: "flex", alignItems: "end", justifyContent: "center", gap: 4, fontSize: 26, fontWeight: 800, color }}>
        {value}
        <span style={{ fontSize: 13, color: "var(--muted)", fontWeight: 600 }}>/ {sub}</span>
      </div>
      <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>{label}</div>
    </div>
  );
}

function ZoneBar({ day, count, max }: { day: string; count: number; max: number }) {
  const pct = Math.max((count / (max || 1)) * 100, 2);
  const color =
    day === "Monday" ? "#4f46e5" :
    day === "Tuesday" ? "#059669" :
    day === "Thursday" ? "#d946ef" :
    day === "Friday" ? "#ea580c" :
    "#6b7280";
  return (
    <div style={{ display: "grid", gap: 4, fontSize: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700 }}>
        <span>{day}</span><span>{count}</span>
      </div>
      <div
        style={{
          height: 10,
          borderRadius: 999,
          background: "var(--line)",
          overflow: "hidden",
          position: "relative",
        }}
      >
        <div
          style={{
            width: `${pct}%`,
            height: "100%",
            background: color,
            borderRadius: 999,
          }}
        />
      </div>
    </div>
  );
}
