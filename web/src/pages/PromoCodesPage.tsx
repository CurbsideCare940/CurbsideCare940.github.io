import { useState, useEffect } from "react";
import { StatusBadge } from "@/components/StatusBadge";
import { supabase } from "@/lib/supabase";

interface PromoCode {
  id: string;
  code: string; // masked in list response
  code_length: number;
  discount_type: "senior" | "standard" | "none";
  discount_amount: number;
  monthly_price: number;
  description: string;
  active: boolean;
  max_uses: number | null;
  times_used: number;
  starts_at: string;
  expires_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

type CreateForm = {
  code: string;
  discountType: "senior" | "standard" | "none";
  discountAmount: string;
  monthlyPrice: string;
  description: string;
  maxUses: string;
  expiresAt: string;
  notes: string;
};

const emptyForm: CreateForm = {
  code: "",
  discountType: "senior",
  discountAmount: "10.00",
  monthlyPrice: "10.00",
  description: "Senior citizen discount: 50% off",
  maxUses: "",
  expiresAt: "",
  notes: "",
};

export default function PromoCodesPage() {
  const [codes, setCodes] = useState<PromoCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState<CreateForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [revealed, setRevealed] = useState<Record<string, string>>({});

  const load = async () => {
    setLoading(true);
    setErr(null);
    try {
      const { data, error } = await supabase.functions.invoke<{ codes: PromoCode[] }>(
        "admin-manage-promo-codes",
        { body: { action: "list" } },
      );
      if (error) throw error;
      setCodes(data?.codes ?? []);
    } catch (e: any) {
      setErr(e?.message ?? "Failed to load promo codes.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const reveal = async (id: string) => {
    try {
      const { data, error } = await supabase.functions.invoke<{ id: string; code: string }>(
        "admin-manage-promo-codes",
        { body: { action: "reveal", id } },
      );
      if (error) throw error;
      setRevealed((prev) => ({ ...prev, [id]: data?.code ?? "" }));
    } catch (e: any) {
      setErr(e?.message ?? "Failed to reveal code.");
    }
  };

  const toggleActive = async (row: PromoCode) => {
    const action = row.active ? "disable" : "enable";
    try {
      const { error } = await supabase.functions.invoke("admin-manage-promo-codes", {
        body: { action, id: row.id },
      });
      if (error) throw error;
      await load();
    } catch (e: any) {
      setErr(e?.message ?? "Update failed.");
    }
  };

  const remove = async (row: PromoCode) => {
    if (!confirm(`Delete the promo code "${row.code}"? This cannot be undone.`)) return;
    try {
      const { error } = await supabase.functions.invoke("admin-manage-promo-codes", {
        body: { action: "delete", id: row.id },
      });
      if (error) throw error;
      await load();
    } catch (e: any) {
      setErr(e?.message ?? "Delete failed.");
    }
  };

  const create = async () => {
    setErr(null);
    if (!form.code || form.code.length < 4) {
      setErr("Code must be at least 4 characters.");
      return;
    }
    const monthlyPrice = Number(form.monthlyPrice);
    if (!Number.isFinite(monthlyPrice) || monthlyPrice < 0) {
      setErr("Monthly price must be a non-negative number.");
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase.functions.invoke("admin-manage-promo-codes", {
        body: {
          action: "create",
          code: form.code.trim(),
          discountType: form.discountType,
          discountAmount: Number(form.discountAmount || 0),
          monthlyPrice,
          description: form.description,
          maxUses: form.maxUses ? Number(form.maxUses) : null,
          expiresAt: form.expiresAt ? new Date(form.expiresAt).toISOString() : null,
          notes: form.notes,
        },
      });
      if (error) throw error;
      setForm(emptyForm);
      setShowCreate(false);
      await load();
    } catch (e: any) {
      setErr(e?.message ?? "Create failed.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page">
      <div className="page-header" style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, flex: 1 }}>Promo Codes</h1>
        <button
          onClick={() => setShowCreate((v) => !v)}
          style={{
            background: "var(--accent)",
            color: "#fff",
            border: "none",
            padding: "8px 16px",
            borderRadius: 8,
            cursor: "pointer",
            fontWeight: 700,
          }}
        >
          {showCreate ? "Cancel" : "+ New code"}
        </button>
      </div>
      <p style={{ color: "var(--muted)", marginTop: 4 }}>
        Codes unlock signup discounts. Live codes are masked in this list — click Reveal to view a
        single one (reveal is logged in the audit trail).
      </p>

      {err && (
        <div
          className="card"
          style={{
            background: "rgba(220, 80, 80, 0.12)",
            color: "var(--danger)",
            marginTop: 12,
            padding: 10,
            borderRadius: 8,
          }}
        >
          {err}
        </div>
      )}

      {showCreate && (
        <div className="card" style={{ marginTop: 16, padding: 16 }}>
          <h3 style={{ fontSize: 16, fontWeight: 800, marginBottom: 12 }}>Create a new promo code</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <label style={{ display: "block" }}>
              <span style={{ fontSize: 12, color: "var(--muted)" }}>Code</span>
              <input
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value })}
                placeholder="SUMMER2027"
                style={inputStyle}
              />
            </label>
            <label style={{ display: "block" }}>
              <span style={{ fontSize: 12, color: "var(--muted)" }}>Discount type</span>
              <select
                value={form.discountType}
                onChange={(e) =>
                  setForm({ ...form, discountType: e.target.value as CreateForm["discountType"] })
                }
                style={inputStyle}
              >
                <option value="senior">Senior (50% off)</option>
                <option value="standard">Standard</option>
                <option value="none">None</option>
              </select>
            </label>
            <label style={{ display: "block" }}>
              <span style={{ fontSize: 12, color: "var(--muted)" }}>Discount amount ($ off / month)</span>
              <input
                value={form.discountAmount}
                onChange={(e) => setForm({ ...form, discountAmount: e.target.value })}
                type="number"
                min="0"
                step="0.01"
                style={inputStyle}
              />
            </label>
            <label style={{ display: "block" }}>
              <span style={{ fontSize: 12, color: "var(--muted)" }}>Monthly price the customer pays ($)</span>
              <input
                value={form.monthlyPrice}
                onChange={(e) => setForm({ ...form, monthlyPrice: e.target.value })}
                type="number"
                min="0"
                step="0.01"
                style={inputStyle}
              />
            </label>
            <label style={{ display: "block", gridColumn: "1 / span 2" }}>
              <span style={{ fontSize: 12, color: "var(--muted)" }}>Description (shown to customer on signup)</span>
              <input
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                style={inputStyle}
              />
            </label>
            <label style={{ display: "block" }}>
              <span style={{ fontSize: 12, color: "var(--muted)" }}>Max uses (blank = unlimited)</span>
              <input
                value={form.maxUses}
                onChange={(e) => setForm({ ...form, maxUses: e.target.value })}
                type="number"
                min="1"
                style={inputStyle}
              />
            </label>
            <label style={{ display: "block" }}>
              <span style={{ fontSize: 12, color: "var(--muted)" }}>Expires (blank = never)</span>
              <input
                value={form.expiresAt}
                onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
                type="datetime-local"
                style={inputStyle}
              />
            </label>
            <label style={{ display: "block", gridColumn: "1 / span 2" }}>
              <span style={{ fontSize: 12, color: "var(--muted)" }}>Internal notes (not shown to customers)</span>
              <input
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                style={inputStyle}
              />
            </label>
          </div>
          <div style={{ marginTop: 16, display: "flex", gap: 8 }}>
            <button
              onClick={create}
              disabled={saving}
              style={{
                background: "var(--accent)",
                color: "#fff",
                border: "none",
                padding: "10px 20px",
                borderRadius: 8,
                cursor: "pointer",
                fontWeight: 700,
                opacity: saving ? 0.6 : 1,
              }}
            >
              {saving ? "Creating…" : "Create code"}
            </button>
            <button
              onClick={() => {
                setForm(emptyForm);
                setShowCreate(false);
              }}
              style={{
                background: "transparent",
                border: "1px solid var(--line)",
                padding: "10px 20px",
                borderRadius: 8,
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="spinner" style={{ marginTop: 24 }} aria-label="Loading" />
      ) : codes.length === 0 ? (
        <p style={{ marginTop: 24, color: "var(--muted)" }}>No promo codes yet.</p>
      ) : (
        <div className="card" style={{ marginTop: 16, padding: 0, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "var(--surface-2)", textAlign: "left" }}>
                <th style={th}>Code</th>
                <th style={th}>Type</th>
                <th style={th}>Monthly price</th>
                <th style={th}>Uses</th>
                <th style={th}>Status</th>
                <th style={th}>Updated</th>
                <th style={th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {codes.map((row) => {
                const shown = revealed[row.id] ?? row.code;
                const revealedFlag = !!revealed[row.id];
                return (
                  <tr key={row.id} style={{ borderTop: "1px solid var(--line)" }}>
                    <td style={td}>
                      <span style={{ fontFamily: "monospace", fontWeight: 700 }}>{shown}</span>
                      {!revealedFlag && (
                        <button
                          onClick={() => reveal(row.id)}
                          style={miniBtn}
                          title="Reveal the live code (logged)"
                        >
                          Reveal
                        </button>
                      )}
                    </td>
                    <td style={td}>{row.discount_type}</td>
                    <td style={td}>${Number(row.monthly_price).toFixed(2)}</td>
                    <td style={td}>
                      {row.times_used}
                      {row.max_uses ? ` / ${row.max_uses}` : ""}
                    </td>
                    <td style={td}>
                      <StatusBadge status={row.active ? "active" : "inactive"} />
                    </td>
                    <td style={td}>{new Date(row.updated_at).toLocaleDateString()}</td>
                    <td style={{ ...td, whiteSpace: "nowrap" }}>
                      <button onClick={() => toggleActive(row)} style={miniBtn}>
                        {row.active ? "Disable" : "Enable"}
                      </button>
                      <button
                        onClick={() => remove(row)}
                        style={{ ...miniBtn, color: "var(--danger)" }}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  display: "block",
  width: "100%",
  marginTop: 4,
  padding: "8px 10px",
  border: "1px solid var(--line)",
  borderRadius: 6,
  background: "var(--surface)",
  color: "var(--ink)",
  fontSize: 14,
};

const th: React.CSSProperties = {
  padding: "10px 12px",
  fontSize: 12,
  fontWeight: 800,
  color: "var(--muted)",
  textTransform: "uppercase",
  letterSpacing: 0.4,
};
const td: React.CSSProperties = { padding: "10px 12px", fontSize: 14 };
const miniBtn: React.CSSProperties = {
  marginLeft: 6,
  padding: "4px 8px",
  fontSize: 12,
  background: "transparent",
  border: "1px solid var(--line)",
  borderRadius: 6,
  cursor: "pointer",
};
