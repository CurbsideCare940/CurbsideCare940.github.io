import { useState, useEffect } from "react";
import { fetchAllCustomers, type AdminCustomerRow } from "@/lib/data";

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

  const active = customers.filter(
    (c) => c.customers?.active && c.subscriptions?.status === "active",
  ).length;
  const total = customers.length;

  return (
    <div>
      <h3>Admin overview</h3>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3,1fr)",
          gap: 16,
          marginTop: 16,
        }}
      >
        <Stat label="Total customers" value={String(total)} color="var(--teal-dark)" />
        <Stat label="Active subscribers" value={String(active)} color="var(--teal)" />
        <Stat label="Churned / canceled" value={String(total - active)} color="var(--coral)" />
      </div>
      <p style={{ color: "var(--muted)", fontSize: 13, marginTop: 16 }}>
        Use the Customers, Support, and Zones tabs to manage the service.
        Employee accounts are managed via the mobile app and are not
        accessible from this web portal.
      </p>
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="card" style={{ textAlign: "center" }}>
      <div style={{ fontSize: 28, fontWeight: 800, color }}>{value}</div>
      <div style={{ fontSize: 12, color: "var(--muted)" }}>{label}</div>
    </div>
  );
}
