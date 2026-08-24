import { useState, useEffect } from "react";
import { fetchZones } from "@/lib/data";

export default function ZonesPage() {
  const [zones, setZones] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    fetchZones()
      .then(setZones)
      .catch((e: any) => setErr(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="spinner" aria-label="Loading" />;
  if (err) return <div className="status-err">{err}</div>;

  return (
    <div>
      <h3>Gainesville zones</h3>
      <div style={{ overflowX: "auto", marginTop: 16 }}>
        <table className="table">
          <thead>
            <tr>
              <th>Zone</th>
              <th>Pickup day</th>
              <th>Service night</th>
              <th>Active</th>
            </tr>
          </thead>
          <tbody>
            {zones.map((z) => (
              <tr key={z.zone_code}>
                <td>{z.zone_code}</td>
                <td>{z.pickup_day}</td>
                <td>{z.service_night}</td>
                <td>{z.active ? "Yes" : "No"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p style={{ color: "var(--muted)", fontSize: 13, marginTop: 16 }}>
        Zone-day mapping (source of truth): SE = Monday, NE = Tuesday,
        NW = Thursday, SW = Friday.
      </p>
    </div>
  );
}
