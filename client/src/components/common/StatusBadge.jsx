const styles = {
  open: "bg-red-50 text-error",
  investigating: "bg-amber-50 text-amber",
  resolved: "bg-mint text-primary",
  high: "bg-red-50 text-error",
  medium: "bg-amber-50 text-amber",
  low: "bg-mint text-primary",
  active: "bg-mint text-primary",
  closed: "bg-slate-100 text-muted",
  scheduled: "bg-blue-50 text-water",
  present: "bg-mint text-primary",
  absent: "bg-red-50 text-error",
  verified: "bg-mint text-primary",
  simulated: "bg-amber-50 text-amber",
  pending: "bg-slate-100 text-muted",
  failed: "bg-red-50 text-error",
  stale: "bg-amber-50 text-amber",
  live: "bg-mint text-primary",
  manual: "bg-blue-50 text-water",
  integrated: "bg-mint text-primary",
  available: "bg-mint text-primary",
  full: "bg-red-50 text-error",
  unknown: "bg-slate-100 text-muted",
};

export default function StatusBadge({ value }) {
  if (!value) return null;
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold capitalize ${styles[value] || "bg-slate-100 text-muted"}`}>
      {value.replaceAll("_", " ")}
    </span>
  );
}
