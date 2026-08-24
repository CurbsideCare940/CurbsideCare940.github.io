import { useState, useEffect } from "react";
import { StatusBadge } from "@/components/StatusBadge";
import {
  fetchSupportTickets,
  createSupportTicket,
  type SupportTicket,
} from "@/lib/data";

export default function SupportPage() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ category: "other", message: "" });
  const [submitErr, setSubmitErr] = useState<string | null>(null);

  const load = async () => {
    try {
      setTickets(await fetchSupportTickets());
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

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitErr(null);
    try {
      await createSupportTicket(form.category, form.message);
      setShowForm(false);
      setForm({ category: "other", message: "" });
      await load();
    } catch (e: any) {
      setSubmitErr(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div className="toolbar">
        <h3>Support</h3>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? "Cancel" : "New ticket"}
        </button>
      </div>

      {showForm && (
        <form className="card" style={{ marginTop: 16, marginBottom: 16 }} onSubmit={submit}>
          <label>
            Category
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
            >
              <option value="billing">Billing</option>
              <option value="service">Service</option>
              <option value="account">Account</option>
              <option value="other">Other</option>
            </select>
          </label>
          <label style={{ marginTop: 14 }}>
            Message
            <textarea
              rows={4}
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              required
              minLength={1}
              maxLength={5000}
            />
          </label>
          {submitErr && <div className="status-err">{submitErr}</div>}
          <button className="btn btn-primary" style={{ marginTop: 12 }} type="submit" disabled={submitting}>
            {submitting ? "Sending…" : "Send ticket"}
          </button>
        </form>
      )}

      {err && <div className="status-err">{err}</div>}
      {loading && <div className="spinner" aria-label="Loading" />}

      {!loading && !err && tickets.length === 0 && (
        <p style={{ color: "var(--muted)" }}>No support tickets yet.</p>
      )}

      {!loading &&
        tickets.map((t) => (
          <div className="card" key={t.id} style={{ marginBottom: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontWeight: 800, textTransform: "capitalize" }}>{t.category}</div>
                <div style={{ fontSize: 12, color: "var(--muted)" }}>
                  {new Date(t.created_at).toLocaleString()} ·{" "}
                  <StatusBadge status={t.status} />
                </div>
              </div>
              <span className="badge resolved">{t.resolved_at ? "Resolved" : "Open"}</span>
            </div>
            <p style={{ marginTop: 10 }}>{t.message}</p>
            {t.admin_response && (
              <div
                style={{
                  marginTop: 12,
                  background: "var(--mint)",
                  padding: 12,
                  borderRadius: 12,
                }}
              >
                <div style={{ fontSize: 12, fontWeight: 800, color: "var(--teal-dark)" }}>
                  Admin response
                </div>
                <div style={{ marginTop: 4 }}>{t.admin_response}</div>
              </div>
            )}
          </div>
        ))}
    </div>
  );
}
