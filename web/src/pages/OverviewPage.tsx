import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { useAppView } from "@/lib/app-context";
import { StatusBadge } from "@/components/StatusBadge";
import {
  fetchCustomerProfile,
  fetchSubscription,
  paidStatus,
  formatMonthlyPrice,
  type CustomerProfile,
  type SubscriptionRow,
} from "@/lib/data";

// Pretty date for "next billing" (e.g. "Tuesday, September 22, 2026")
function fmtDate(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export default function OverviewPage() {
  const { profile } = useAuth();
  const { setView } = useAppView();
  const [cust, setCust] = useState<CustomerProfile | null>(null);
  const [sub, setSub] = useState<SubscriptionRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [c, s] = await Promise.all([
          fetchCustomerProfile(),
          fetchSubscription(),
        ]);
        if (!active) return;
        setCust(c);
        setSub(s);
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

  if (loading) {
    return (
      <div className="spinner" aria-label="Loading your account" />
    );
  }
  if (err) {
    return <div className="status-err">{err}</div>;
  }
  if (!cust || !cust.customers) {
    return (
      <div className="status-err">
        We could not find your customer profile. Please call or text
        940-612-9836 and we'll get it sorted.
      </div>
    );
  }

  const c = cust.customers;
  const firstName =
    (profile?.full_name ?? cust.full_name ?? "").trim().split(/\s+/)[0] || "there";
  const status = paidStatus(sub);
  const isActive = status === "active";
  const needsToPay =
    status === "canceled" ||
    status === "past_due" ||
    status === "approval_pending" ||
    status === "none";
  const monthly = formatMonthlyPrice(c.senior_discount);

  // Service day = the day Curbside Care runs to return your bins.
  // (NOT the city trash pickup day; that's when your bins go OUT.)
  const serviceDay = c.curbside_service_day ?? c.service_zones?.service_night ?? null;
  const fullAddress = `${c.address}, ${c.city}, ${c.state} ${c.postal_code}`;

  return (
    <div>
      {/* ===== HERO / GREETING ===== */}
      <div
        className="card overview-hero"
        style={{
          background:
            "linear-gradient(135deg, rgba(31,128,109,0.10), rgba(245,178,72,0.10))",
          borderTop: "4px solid var(--teal)",
        }}
      >
        <div style={{ fontSize: 13, color: "var(--muted)", marginBottom: 4 }}>
          Welcome back
        </div>
        <h2 style={{ margin: 0, fontSize: 30, fontWeight: 800 }}>
          Hi, {firstName} 👋
        </h2>
        <div style={{ marginTop: 6, color: "var(--ink-soft)", fontSize: 14 }}>
          {c.service_zones?.zone_code
            ? `Zone ${c.service_zones.zone_code}`
            : "Curbside Care customer"}
        </div>
      </div>

      <div style={{ display: "grid", gap: 18, marginTop: 18 }}>
        {/* ===== SUBSCRIPTION STATUS ===== */}
        <div
          className="card"
          style={{
            borderLeft: `6px solid ${
              isActive
                ? "var(--teal)"
                : needsToPay
                  ? "var(--coral, #D9534F)"
                  : "var(--line)"
            }`,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              gap: 12,
              flexWrap: "wrap",
            }}
          >
            <div style={{ flex: 1, minWidth: 220 }}>
              <div
                style={{ fontSize: 12, color: "var(--muted)", fontWeight: 700, letterSpacing: 0.5 }}
              >
                SUBSCRIPTION
              </div>
              <div
                style={{
                  fontSize: 22,
                  fontWeight: 800,
                  marginTop: 4,
                  color: isActive ? "var(--teal-dark)" : "var(--ink)",
                }}
              >
                {isActive
                  ? "✓ Active — you're paid up"
                  : status === "approval_pending"
                    ? "⏳ Awaiting PayPal approval"
                    : status === "canceled"
                      ? "✕ Canceled"
                      : status === "past_due"
                        ? "⚠ Past due"
                        : "Not subscribed"}
              </div>

              {isActive && sub?.next_billing_date && (
                <div style={{ marginTop: 10, fontSize: 15 }}>
                  <div style={{ color: "var(--muted)", fontSize: 12 }}>
                    Next payment
                  </div>
                  <div style={{ fontWeight: 700, marginTop: 2 }}>
                    {fmtDate(sub.next_billing_date)}
                  </div>
                  <div style={{ color: "var(--ink-soft)", fontSize: 13, marginTop: 2 }}>
                    {monthly}
                  </div>
                </div>
              )}

              {isActive && !sub?.next_billing_date && (
                <div style={{ marginTop: 10, fontSize: 14, color: "var(--ink-soft)" }}>
                  Your subscription renews automatically each month.
                </div>
              )}

              {needsToPay && (
                <div style={{ marginTop: 10, fontSize: 14, color: "var(--ink-soft)" }}>
                  {status === "approval_pending"
                    ? "Finish your PayPal subscription to start service."
                    : status === "canceled"
                      ? "Your subscription is canceled. Restart it from the billing page to resume service."
                      : status === "past_due"
                        ? "Your last payment failed. Update your billing to keep service running."
                        : "You don't have an active subscription yet."}
                </div>
              )}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "flex-end" }}>
              <StatusBadge status={sub?.status ?? "none"} />
              {needsToPay && (
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => setView("customer-subscription")}
                  style={{ minWidth: 160 }}
                >
                  Pay your bill →
                </button>
              )}
              {isActive && (
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => setView("customer-subscription")}
                  style={{ minWidth: 160 }}
                >
                  Manage billing
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ===== SERVICE DETAILS ===== */}
        <div className="card">
          <div
            style={{ fontSize: 12, color: "var(--muted)", fontWeight: 700, letterSpacing: 0.5 }}
          >
            YOUR SERVICE
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 16,
              marginTop: 12,
            }}
          >
            <div>
              <div style={{ fontSize: 12, color: "var(--muted)" }}>Address</div>
              <div style={{ fontSize: 15, fontWeight: 700, marginTop: 2 }}>
                {fullAddress}
              </div>
            </div>

            <div>
              <div style={{ fontSize: 12, color: "var(--muted)" }}>
                Trash service runs
              </div>
              <div style={{ fontSize: 15, fontWeight: 700, marginTop: 2 }}>
                {serviceDay ? (
                  <>
                    {serviceDay}
                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: 500,
                        color: "var(--muted)",
                        display: "block",
                        marginTop: 2,
                      }}
                    >
                      (the day we return your bins)
                    </span>
                  </>
                ) : (
                  "—"
                )}
              </div>
            </div>

            <div>
              <div style={{ fontSize: 12, color: "var(--muted)" }}>Pickup zone</div>
              <div style={{ fontSize: 15, fontWeight: 700, marginTop: 2 }}>
                {c.service_zones?.zone_code ?? "—"}
              </div>
            </div>

            <div>
              <div style={{ fontSize: 12, color: "var(--muted)" }}>Number of bins</div>
              <div style={{ fontSize: 15, fontWeight: 700, marginTop: 2 }}>
                {c.number_of_bins}
              </div>
            </div>

            {c.return_location && (
              <div style={{ gridColumn: "1 / -1" }}>
                <div style={{ fontSize: 12, color: "var(--muted)" }}>
                  Bin return location
                </div>
                <div style={{ fontSize: 15, fontWeight: 700, marginTop: 2 }}>
                  {c.return_location}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ===== THANK YOU ===== */}
        <div
          className="card"
          style={{
            textAlign: "center",
            background:
              "linear-gradient(135deg, rgba(31,128,109,0.06), rgba(245,178,72,0.06))",
            border: "1px dashed rgba(31,128,109,0.35)",
          }}
        >
          <div style={{ fontSize: 32 }}>🙏</div>
          <h3
            style={{
              margin: "8px 0 6px",
              fontSize: 18,
              fontWeight: 800,
              color: "var(--teal-dark)",
            }}
          >
            Thank you for being a Curbside Care customer!
          </h3>
          <p
            style={{
              margin: 0,
              color: "var(--ink-soft)",
              fontSize: 14,
              lineHeight: 1.5,
            }}
          >
            We're proud to serve {firstName} and the {c.city} community. If you
            ever need help, text or call us at{" "}
            <a href="tel:9406129836" style={{ color: "var(--teal-dark)", fontWeight: 700 }}>
              940-612-9836
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
