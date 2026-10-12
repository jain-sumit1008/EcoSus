export default function LoadingState({ label = "Loading campus data..." }) {
  return (
    <div className="card flex items-center gap-3 p-6 text-sm text-muted">
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-line border-t-primary" />
      {label}
    </div>
  );
}
