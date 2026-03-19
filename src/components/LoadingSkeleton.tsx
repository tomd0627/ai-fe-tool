export function LoadingSkeleton() {
  return (
    <div className="skeleton-container" role="status" aria-label="Analyzing CSS, please wait…">
      <span className="sr-only">Analyzing CSS, please wait…</span>
      <div className="skeleton-summary" aria-hidden="true" />
      {[1, 2, 3].map((i) => (
        <div key={i} className="skeleton-card" aria-hidden="true">
          <div className="skeleton-line skeleton-line--title" />
          <div className="skeleton-line skeleton-line--body" />
          <div className="skeleton-line skeleton-line--body skeleton-line--short" />
        </div>
      ))}
    </div>
  );
}
