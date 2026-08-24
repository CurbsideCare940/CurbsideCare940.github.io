import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { ViewLink } from "@/lib/app-context";
import { StatusBadge } from "@/components/StatusBadge";
import {
  fetchCustomerProfile,
  fetchSubscription,
  fetchPayments,
  type CustomerProfile,
  type SubscriptionRow,
  type PaymentRow,
} from "@/lib/data";

export default function OverviewPage() {
  const { profile } = useAuth();
  const [cust, setCust] = useState<CustomerProfile | null>(null);
  const [sub, setSub] = useState<SubscriptionRow | null>(null);
  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [c, s, p] = await Promise.all([
          fetchCustomerProfile(),
          fetchSubscription(),
          fetchPayments(5),
        ]);
        if (!active) return;
        setCust(c);
        setSub(s);
        setPayments(p);
      } catch (e: any) {
        if (active) setErr(e.message);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  if (loading) return <div className="spinner" aria-label="Loading" />;
  if (err) return <div className="status-err">{err}</div>;
  if (!cust) return <div className="status-err">No customer profile found.</div>;

  const c = cust.customers!;

  return (
    <div>
      <div className="toolbar">
        <h2>Hi, {profile?.full_name?.split(" ")[0] ?? "there"} 👋</h2>
      </div>

      <div style={{ display: "grid", gap: 22, marginTop: 8 }}>
        <div className="card">
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "baseline",
            }}
          >
            <div>
              <div style={{ fontSize: 13, color: "var(--muted)" }}>Pickup zone</div>
              <div style={{ fontSize: 18, fontWeight: 800 }}>{c.service_zones?.zone_code ?? "—"}</div>
            </div>
            <div>
              <div style={{ fontSize: 13, color: "var(--muted)" }}>Pickup day</div>
              <div style={{ fontSize: 18, fontWeight: 800 }}>{c.official_pickup_day}</div>
            </div>
          </div>
          <div style={{ marginTop: 14, color: "var(--muted)" }}>
            <strong>Return location:</strong> {c.return_location}
            {c.access_notes && (
              <>
                <br />
                <strong>Bin placement notes:</strong> {c.access_notes}
              </>
            )}
          </div>
        </div>

        <div className="card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <h3 style={{ margin: 0 }}>Subscription</h3>
            <ViewLink
              to="customer-subscription"
              style={{ color: "var(--teal-dark)", fontSize: 13, fontWeight: 700 }}
            >
              Manage billing
            </ViewLink>
          </div>
          {!sub ? (
            <p style={{ color: "var(--coral)", marginTop: 8 }}>
              You are not yet subscribed. Open your mobile app's Billing screen
              to start your $20/month plan.
            </p>
          ) : (
            <div style={{ marginTop: 8 }}>
              <StatusBadge status={sub.status} />
              <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 6 }}>
                {sub.next_billing_date
                  ? `Next billing: ${new Date(sub.next_billing_date).toLocaleDateString()}`
                  : "Next billing date unavailable."}
              </div>
            </div>
          )}
        </div>

        <div className="card">
          <h3 style={{ margin: "0 0 10px" }}>Recent payments</h3>
          {payments.length === 0 ? (
            <p style={{ color: "var(--muted)", fontSize: 13 }}>No payments yet.</p>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p.id}>
                    <td>{p.paid_at ? new Date(p.paid_at).toLocaleDateString() : "—"}</td>
                    <td>{p.amount_cents ? `$${Number(p.amount_cents) / 100}` : "—"}</td>
                    <td><StatusBadge status={p.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
