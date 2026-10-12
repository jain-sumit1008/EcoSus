export default function ErrorState({ error, onRetry }) {
  return (
    <div className="card border-red-100 bg-red-50 p-6">
      <h2 className="text-lg font-bold text-error">Backend unavailable or request failed</h2>
      <p className="mt-2 text-sm text-ink">{error?.message || "Unable to load data."}</p>
      <ol className="mt-3 list-decimal pl-5 text-sm text-muted">
        <li>Start MongoDB locally or set MONGODB_URI.</li>
        <li>Run <code>npm run seed</code> then <code>npm run dev</code> in /server.</li>
        <li>Confirm VITE_API_BASE_URL points to http://localhost:5000/api.</li>
      </ol>
      {onRetry ? (
        <button className="btn-primary mt-4" type="button" onClick={onRetry}>
          Retry
        </button>
      ) : null}
    </div>
  );
}
