import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import {
  fetchCustomerProfile,
  updateCustomerProfile,
  type CustomerProfile,
} from "@/lib/data";

export default function ProfilePage() {
  const { profile, loading: authLoading } = useAuth();
  const [cust, setCust] = useState<CustomerProfile | null>(null);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    fetchCustomerProfile().then(setCust).catch(() => setCust(null));
  }, []);

  if (authLoading || !cust || !profile) return <div className="spinner" aria-label="Loading" />;

  const c = cust.customers!;
  const [form, setForm] = useState({
    fullName: profile.full_name ?? "",
    phone: profile.phone ?? "",
    numberOfBins: c.number_of_bins,
    returnLocation: c.return_location,
    accessNotes: c.access_notes ?? "",
  });

  const save = async () => {
    setSaving(true);
    setStatus(null);
    setErr(null);
    try {
      await updateCustomerProfile({
        full_name: form.fullName,
        phone: form.phone || null,
        number_of_bins: form.numberOfBins,
        return_location: form.returnLocation,
        access_notes: form.accessNotes || null,
      });
      setStatus("Saved.");
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <h3>Your profile &amp; bin placement</h3>
      <p style={{ color: "var(--muted)", fontSize: 14, marginTop: 4 }}>
        Update your contact info, bin count, and where you'd like your bins
        placed at the curb and returned.
      </p>

      <div className="card" style={{ marginTop: 16 }}>
        <label>
          Full name
          <input
            value={form.fullName}
            onChange={(e) => setForm({ ...form, fullName: e.target.value })}
          />
        </label>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginTop: 14 }}>
          <label>
            Phone
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
          </label>
          <label>
            Number of bins
            <select
              value={form.numberOfBins}
              onChange={(e) =>
                setForm({ ...form, numberOfBins: Number(e.target.value) })
              }
            >
              {[1, 2, 3, 4, 5].map((n) => (
                <option key={n} value={n}>
                  {n} bin{n > 1 ? "s" : ""}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label style={{ marginTop: 14 }}>
          Return location (where bins go after pickup)
          <input
            value={form.returnLocation}
            onChange={(e) => setForm({ ...form, returnLocation: e.target.value })}
          />
        </label>
        <label style={{ marginTop: 14 }}>
          Bin placement instructions / access notes
          <textarea
            rows={3}
            value={form.accessNotes}
            onChange={(e) => setForm({ ...form, accessNotes: e.target.value })}
          />
        </label>

        {status && <div className="status-ok">{status}</div>}
        {err && <div className="status-err">{err}</div>}
        <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={save} disabled={saving}>
          {saving ? "Saving…" : "Save changes"}
        </button>
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <h4 style={{ marginTop: 0 }}>Service details (read-only)</h4>
        <div style={{ fontSize: 14, color: "var(--muted)" }}>
          <div>Zone: <strong>{c.service_zones?.zone_code ?? "—"}</strong></div>
          <div>Pickup day: <strong>{c.official_pickup_day}</strong></div>
          <div>Address: <strong>{`${c.address}, ${c.city}, ${c.state} ${c.postal_code}`}</strong></div>
          <div>Account active: <strong>{c.active ? "Yes" : "No"}</strong></div>
          <div>
            <strong>
              Senior discount:{" "}
              {c.senior_discount ? "Yes (50% off — $10/mo)" : "No"}
            </strong>
          </div>
        </div>
      </div>
    </div>
  );
}
