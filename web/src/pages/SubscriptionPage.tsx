import { useState, useEffect, useRef } from "react";
import { StatusBadge } from "@/components/StatusBadge";
import {
  fetchSubscription,
  fetchPayments,
  fetchCustomerProfile,
  refreshSubscriptionFromPayPal,
  type SubscriptionRow,
  type PaymentRow,
} from "@/lib/data";

export default function SubscriptionPage() {
  const [sub, setSub] = useState<SubscriptionRow | null>(null);
  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [statusResult, setStatusResult] = useState<any>(null);
  const paypalRendered = useRef(false);

  const load = async () => {
    try {
      const [s, p, cp] = await Promise.all([
        fetchSubscription(),
        fetchPayments(20),
        fetchCustomerProfile(),
      ]);
      setSub(s);
      setPayments(p);
      setProfile(cp);
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

  const isSenior = !!profile?.customers?.senior_discount;
  const monthlyRate = isSenior ? 10 : 20;

  // Render the PayPal subscription button once the profile has loaded and only
  // for senior-discount customers whose plan is inactive/past-due/canceled.
  useEffect(() => {
    if (isSenior && sub && (sub.status === "canceled" || sub.status === "past_due") && !paypalRendered.current) {
      paypalRendered.current = true;
      const script = document.createElement("script");
      script.src =
        "https://www.paypal.com/sdk/js?client-id=BAADEioxOkUrbXN-uDKEXPNjAx-j5x9uZ6VGo6yp2P4KUHjtOoY78vg_-qGevIh2E3hHgIwscrkRw9sVhs&vault=true&intent=subscription";
      script.async = true;
      script.onload = () => {
        // @ts-ignore PayPal SDK attaches to window
        window.paypal.Buttons({
          style: {
            shape: "rect",
            color: "gold",
            layout: "vertical",
            label: "subscribe",
          },
          createSubscription: function (_data: any, actions: any) {
            return actions.subscription.create({
              /* Creates the subscription */
              plan_id: "P-3PU2200803574033ENKJQVLY",
            });
          },
          onApprove: function (data: any) {
            alert(data.subscriptionID); // success sub id
          },
        }).render("#paypal-button-container-P-3PU2200803574033ENKJQVLY"); // Renders the PayPal button
      };
      // @ts-ignore
      document.getElementById("paypal-script")?.replaceChildren(script);
    }
  }, [isSenior, sub]);

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
      <div id="paypal-script" />
      <h3>Subscription &amp; billing</h3>
      <p style={{ color: "var(--muted)", fontSize: 14, marginTop: 4 }}>
        {isSenior
          ? "Curbside Care plan — $10/month (50% senior discount applied)"
          : "Curbside Care plan — $20/month"}
      </p>

      {err && <div className="status-err">{err}</div>}

      <div className="card" style={{ marginTop: 16 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "baseline",
          }}
        >
          <h4 style={{ margin: 0 }}>Your subscription</h4>
          <button className="btn btn-ghost" disabled={refreshing} onClick={refresh}>
            {refreshing ? "Refreshing…" : "Refresh from PayPal"}
          </button>
        </div>
        {sub ? (
          <div style={{ marginTop: 12, fontSize: 14 }}>
            <div>
              <strong>Status:</strong> <StatusBadge status={sub.status} />
            </div>
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
            No subscription record found. Start your ${monthlyRate}/month plan from the
            mobile app's Billing screen.
          </p>
        )}
      </div>

      {/* Senior-discount PayPal button (admin-assigned only) */}
      {isSenior && sub && (sub.status === "canceled" || sub.status === "past_due") && (
        <div className="card" style={{ marginTop: 16 }}>
          <h4 style={{ margin: "0 0 6px" }}>Senior renewal — 50% off</h4>
          <p style={{ fontSize: 12, color: "var(--muted)", marginBottom: 10 }}>
            Your $20/mo plan — senior discount makes this $10/mo.
          </p>

          <div id="paypal-button-container-P-3PU2200803574033ENKJQVLY" />
          {/* PayPal SDK loads dynamically in the useEffect above; no static tag
              needed (third-party CDN script, SRI not applicable to the official
              PayPal checkout.js SDK). */}
        </div>
      )}

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
                  <td>
                    {p.paid_at ? new Date(p.paid_at).toLocaleDateString() : "—"}
                  </td>
                  <td>{p.amount_cents ? `$${Number(p.amount_cents) / 100}` : "—"}</td>
                  <td>
                    <StatusBadge status={p.status} />
                  </td>
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
