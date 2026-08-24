export function StatusBadge({ status }: { status: string }) {
  const s = (status ?? "").toLowerCase();
  const cls =
    s === "active" || s === "paid" || s === "completed" || s === "succeeded"
      ? "badge active"
      : s === "canceled" || s === "voided" || s === "failed" || s === "denied"
        ? "badge canceled"
        : s === "none" || !s
          ? "badge past"
          : "badge open";
  return <span className={cls}>{status || "none"}</span>;
}
