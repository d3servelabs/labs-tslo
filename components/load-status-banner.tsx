export function LoadStatusBanner({
  variant,
  message,
  estimate,
  progress
}: {
  variant: "info" | "error";
  message?: string;
  estimate?: string;
  progress?: number;
}) {
  return (
    <div className={`load-status-banner load-status-${variant}`}>
      {variant === "error" ? (
        <span className="load-status-icon">⚠</span>
      ) : (
        <span className="loading-spinner" />
      )}
      <div className="load-status-body">
        <span className="load-status-message">
          {message ?? (variant === "error" ? "Failed to load data" : "Partial data — loading in progress")}
          {estimate ? ` — ${estimate}` : ""}
        </span>
        {progress != null && (
          <div className="load-progress-track">
            <div className="load-progress-fill" style={{ width: `${Math.min(progress, 100)}%` }} />
          </div>
        )}
      </div>
    </div>
  );
}
