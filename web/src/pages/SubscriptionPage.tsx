import { useState, useEffect } from "react";
import { StatusBadge } from "@/components/StatusBadge";
import {
  fetchSubscription,
  fetchPayments,
  refreshSubscriptionFromPayPal,
  type SubscriptionRow,
  type PaymentRow,
} from "@/lib/data";

export default function SubscriptionPage() {
  const [sub, setSub] = useState<SubscriptionRow | null>(null);
  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [statusResult, setStatusResult] = useState<any>(null);

  const load = async () => {
    try {
      const [s, p] = await Promise.all([fetchSubscription(), fetchPayments(20)]);
      setSub(s);
      setPayments(p);
      setErr(null);
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const refresh = async () => {
    setRefreshing(true);
    setStatusResult(null);
    try {
      const res = await refreshSubscriptionFromPayPal();
      setStatusResult(res);
      await load();
    } catch (e: any) {
      setStatusResult({ error: e.message });
    } finally {
      setRefreshing(false);
    }
  };

  if (loading) return <div className="spinner" aria-label="Loading" />;

  return (
    <div>
      <h3>Subscription &amp; billing</h3>
      <p style={{ color: "var(--muted)", fontSize: 14, marginTop: 4 }}>
        Curbside Care plan — $20/month
      </p>

      {err && <div className="status-err">{err}</div>}

      <div className="card" style={{ marginTop: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <h4 style={{ margin: 0 }}>Your subscription</h4>
          <button className="btn btn-ghost" disabled={refreshing} onClick={refresh}>
            {refreshing ? "Refreshing…" : "Refresh from PayPal"}
          </button>
        </div>
        {sub ? (
          <div style={{ marginTop: 12, fontSize: 14 }}>
            <div><strong>Status:</strong> <StatusBadge status={sub.status} /></div>
            <div style={{ marginTop: 6 }}>
              <strong>PayPal subscription:</strong>{" "}
              {sub.paypal_subscription_id ?? "—"}
            </div>
            <div style={{ marginTop: 6 }}>
              <strong>Next billing date:</strong>{" "}
              {sub.next_billing_date
                ? new Date(sub.next_billing_date).toLocaleDateString()
                : "—"}
            </div>
            <div style={{ marginTop: 6 }}>
              <strong>Billing anchor day:</strong> {sub.billing_anchor_day}
            </div>
          </div>
        ) : (
          <p style={{ color: "var(--coral)", marginTop: 12 }}>
            No subscription record found. Start your $20/month plan from the
            mobile app's Billing screen.
          </p>
        )}
      </div>

      {statusResult && (
        <div className="card" style={{ marginTop: 16 }}>
          <h4 style={{ margin: "0 0 6px" }}>Last PayPal refresh</h4>
          <pre
            style={{
              background: "var(--mint)",
              padding: 10,
              borderRadius: 8,
              fontSize: 12,
              overflowX: "auto",
            }}
          >
{JSON.stringify(statusResult, null, 2)}
          </pre>
        </div>
      )}

      <div className="card" style={{ marginTop: 16 }}>
        <h4 style={{ margin: "0 0 10px" }}>Payment history</h4>
        {payments.length === 0 ? (
          <p style={{ color: "var(--muted)", fontSize: 13 }}>No payments yet.</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Transaction</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => (
                <tr key={p.id}>
                  <td>{p.paid_at ? new Date(p.paid_at).toLocaleDateString() : "—"}</td>
                  <td>{p.amount_cents ? `$${Number(p.amount_cents) / 100}` : "—"}</td>
                  <td><StatusBadge status={p.status} /></td>
                  <td style={{ fontSize: 12, color: "var(--muted)" }}>
                    {p.paypal_transaction_id?.slice(0, 10) ?? "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
