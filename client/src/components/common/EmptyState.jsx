export default function EmptyState({ title, description }) {
  return (
    <div className="rounded-xl border border-dashed border-line p-6 text-center">
      <p className="font-semibold text-ink">{title}</p>
      <p className="mt-1 text-sm text-muted">{description}</p>
    </div>
  );
}
