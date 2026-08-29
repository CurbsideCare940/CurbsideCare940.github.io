import { useState, useEffect } from "react";
import {
  fetchAllCustomers,
  adminSetSeniorDiscount,
  type AdminCustomerRow,
} from "@/lib/data";
import { StatusBadge } from "@/components/StatusBadge";

export default function CustomersPage() {
  const [customers, setCustomers] = useState<AdminCustomerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [working, setWorking] = useState<string | null>(null);

  useEffect(() => {
    fetchAllCustomers()
      .then(setCustomers)
      .catch((e: any) => setErr(e.message))
      .finally(() => setLoading(false));
  }, []);

  const toggleSenior = async (c: AdminCustomerRow, newVal: boolean) => {
    setWorking(c.profile_id);
    try {
      await adminSetSeniorDiscount(c.customers!.id, newVal);
      setCustomers((prev) =>
        prev.map((x) =>
          x.profile_id === c.profile_id
            ? {
                ...x,
                customers: x.customers
                  ? { ...x.customers, senior_discount: newVal }
                  : x.customers,
              }
            : x,
        ),
      );
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setWorking(null);
    }
  };

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
              <th>Senior</th>
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
                <td>{c.customers?.service_zones?.zone_code ?? "—"}</td>
                <td>
                  {c.customers?.senior_discount ? (
                    <button
                      className="btn btn-ghost"
                      style={{ fontSize: 12, padding: "4px 12px" }}
                      disabled={working === c.profile_id}
                      onClick={() => toggleSenior(c, false)}
                    >
                      {working === c.profile_id ? "…" : "Remove 50%"}
                    </button>
                  ) : (
                    <button
                      className="btn"
                      style={{ fontSize: 12, padding: "4px 12px", color: "var(--teal-dark)" }}
                      disabled={working === c.profile_id}
                      onClick={() => toggleSenior(c, true)}
                    >
                      {working === c.profile_id ? "…" : "+ senior"}
                    </button>
                  )}
                </td>
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
