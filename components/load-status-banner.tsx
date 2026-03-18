export function LoadStatusBanner({
  variant,
  message,
  estimate
}: {
  variant: "info" | "error";
  message?: string;
  estimate?: string;
}) {
  return (
    <div className={`load-status-banner load-status-${variant}`}>
      {variant === "error" ? (
        <span className="load-status-icon">⚠</span>
      ) : (
        <span className="loading-spinner" />
      )}
      <span className="load-status-message">
        {message ?? (variant === "error" ? "Failed to load data" : "Partial data — loading in progress")}
        {estimate ? ` — ${estimate}` : ""}
      </span>
    </div>
  );
}
