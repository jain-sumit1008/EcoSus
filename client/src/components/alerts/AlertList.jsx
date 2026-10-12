import StatusBadge from "../common/StatusBadge.jsx";
import EmptyState from "../common/EmptyState.jsx";

export default function AlertList({ items, onSelect }) {
  if (!items?.length) {
    return <EmptyState title="No alerts" description="Anomaly alerts appear after readings exceed the configured baseline threshold." />;
  }
  return (
    <div className="space-y-3">
      {items.map((alert) => (
        <button
          key={alert._id}
          type="button"
          className="w-full rounded-xl border border-line p-3 text-left hover:bg-mint/60"
          onClick={() => onSelect?.(alert)}
        >
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-semibold">{alert.title}</p>
            <StatusBadge value={alert.severity} />
          </div>
          <p className="mt-1 text-xs text-muted">{alert.description}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <StatusBadge value={alert.status} />
            <StatusBadge value={alert.source} />
            <span className="text-[11px] text-muted">Block {alert.block}</span>
          </div>
        </button>
      ))}
    </div>
  );
}
