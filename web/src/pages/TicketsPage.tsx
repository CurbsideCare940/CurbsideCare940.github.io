import { useState, useEffect } from "react";
import { fetchAllTickets, type TicketRow } from "@/lib/data";
import { StatusBadge } from "@/components/StatusBadge";

export default function TicketsPage() {
  const [tickets, setTickets] = useState<TicketRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    fetchAllTickets()
      .then(setTickets)
      .catch((e: any) => setErr(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="spinner" aria-label="Loading" />;
  if (err) return <div className="status-err">{err}</div>;
  if (!tickets.length) return <p>No support tickets.</p>;

  return (
    <div>
      <h3>Support tickets ({tickets.length})</h3>
      <div style={{ display: "grid", gap: 12, marginTop: 16 }}>
        {tickets.map((t) => {
          const cust: { full_name: string; email: string } = t.customer ?? {
            full_name: "—", email: "—",
          };
          return (
            <div className="card" key={t.id}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <div>
                  <div style={{ fontWeight: 800, textTransform: "capitalize" }}>{t.category}</div>
                  <div style={{ fontSize: 12, color: "var(--muted)" }}>
                    {cust.full_name ?? "—"} · {cust.email ?? "—"} ·{" "}
                    {new Date(t.created_at).toLocaleString()}
                  </div>
                </div>
                <StatusBadge status={t.status} />
              </div>
              <p style={{ marginTop: 10 }}>{t.message}</p>
              {t.admin_response && (
                <div
                  style={{
                    marginTop: 10,
                    background: "var(--mint)",
                    padding: 10,
                    borderRadius: 10,
                  }}
                >
                  <div style={{ fontSize: 12, fontWeight: 800, color: "var(--teal-dark)" }}>
                    Admin response
                  </div>
                  <div style={{ marginTop: 4 }}>{t.admin_response}</div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
