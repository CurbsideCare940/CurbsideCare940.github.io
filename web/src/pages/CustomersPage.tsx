import { useState, useEffect } from "react";
import { fetchAllCustomers, type AdminCustomerRow } from "@/lib/data";
import { StatusBadge } from "@/components/StatusBadge";

export default function CustomersPage() {
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
  if (!customers.length) return <p>No customers found.</p>;

  return (
    <div>
      <div className="toolbar">
        <h3>Customers ({customers.length})</h3>
      </div>
      <div style={{ overflowX: "auto", marginTop: 12 }}>
        <table className="table">
          <thead>
            <tr>
              <th>Customer</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Bins</th>
              <th>Zone</th>
              <th>Subscription</th>
            </tr>
          </thead>
          <tbody>
            {customers.map((c) => (
              <tr key={c.profile_id}>
                <td>{c.full_name}</td>
                <td>{c.email}</td>
                <td>{c.phone ?? "—"}</td>
                <td>{c.customers?.number_of_bins ?? 0}</td>
                <td>{c.customers?.zone_code ?? "—"}</td>
                <td>
                  <StatusBadge status={c.subscriptions?.status ?? "none"} />
                  {c.subscriptions?.paypal_subscription_id && (
                    <span style={{ fontSize: 11, color: "var(--muted)", marginLeft: 6 }}>
                      {c.subscriptions.paypal_subscription_id.slice(0, 10)}…
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
