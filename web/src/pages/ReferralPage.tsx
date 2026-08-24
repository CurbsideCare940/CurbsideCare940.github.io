import { useState, useEffect } from "react";
import { getCustomerId, fetchMyReferrals, type ReferralRow } from "@/lib/data";

export default function ReferralPage() {
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [referrals, setReferrals] = useState<ReferralRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const referralLink = customerId
    ? `https://curbsidecare.net/?ref=${encodeURIComponent(customerId)}`
    : "";

  const copyLink = async () => {
    if (!referralLink) return;
    try {
      await navigator.clipboard.writeText(referralLink);
    } catch {
      const i = document.createElement("input");
      i.value = referralLink;
      document.body.appendChild(i);
      i.select();
      document.execCommand("copy");
      document.body.removeChild(i);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  async function load() {
    setLoading(true);
    try {
      const id = await getCustomerId();
      setCustomerId(id);
      if (id) setReferrals(await fetchMyReferrals());
    } catch (e: any) {
      setErr(e.message ?? "Could not load referrals.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const smsLink =
    referralLink &&
    `sms:?body=${encodeURIComponent(
      `Curbside Care neighbor — $20/mo trash bin service in Gainesville, TX. Sign up with my link: ${referralLink}`,
    )}`;
  const emailLink =
    referralLink &&
    `mailto:?subject=Curbside Care referral&body=${encodeURIComponent(
      `Love your curb? I use Curbside Care — $20/mo trash bin concierge in Gainesville, TX. Sign up with my link and we both help keep the neighborhood tidy: ${referralLink}`,
    )}`;
  const waLink =
    referralLink &&
    `https://wa.me/?text=${encodeURIComponent(
      `Curbside Care neighbor referral — $20/mo trash bin service in Gainesville, TX. My link: ${referralLink}`,
    )}`;

  return (
    <div className="card" style={{ maxWidth: 720, margin: "0 auto" }}>
      <h2 style={{ marginTop: 0 }}>Refer a Neighbor</h2>
      <p style={{ color: "var(--muted)" }}>
        Love Curbside Care? Share your link and we'll keep your street tidy
        together. Every friend who signs up via your link is recorded below.
      </p>

      {loading ? (
        <div className="spinner" aria-label="Loading" />
      ) : err ? (
        <div className="signup-status error">{err}</div>
      ) : !customerId ? (
        <div className="signup-status error">
          No customer profile found. Are you signed in as a customer?
        </div>
      ) : (
        <>
          <div className="field" style={{ marginBottom: 16 }}>
            <label style={{ display: "block", fontSize: 12, fontWeight: 800 }}>
              Your referral link
            </label>
            <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
              <input
                type="text"
                readOnly
                value={referralLink}
                style={{ flex: 1, fontFamily: "ui-monospace, monospace" }}
                onClick={(e) => e.currentTarget.select()}
              />
              <button
                type="button"
                className="btn btn-ghost"
                onClick={copyLink}
              >
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
            <small style={{ color: "var(--muted)" }}>
              When a neighbor opens this link and signs up on curbsidecare.net,
              their signup is recorded next to your account.
            </small>
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <a
              className="btn btn-coral"
              href={waLink || "#"}
              target="_blank"
              rel="noopener noreferrer"
            >
              Share on WhatsApp
            </a>
            <a className="btn btn-ghost" href={smsLink || "#"}>
              Share via SMS
            </a>
            <a className="btn btn-ghost" href={emailLink || "#"}>
              Share via Email
            </a>
          </div>

          <hr style={{ margin: "24px 0", border: "none", borderTop: "1px solid var(--line)" }} />

          <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12 }}>
            Referrals so far
          </h3>
          {referrals.length === 0 ? (
            <p style={{ color: "var(--muted)" }}>
              No neighbors have signed up via your link yet. Share your link
              above to get started!
            </p>
          ) : (
            <table className="customers-table">
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Referred on</th>
                </tr>
              </thead>
              <tbody>
                {referrals.map((r) => (
                  <tr key={r.id}>
                    <td>{r.referred_email ?? "—"}</td>
                    <td>{new Date(r.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </>
      )}
    </div>
  );
}
