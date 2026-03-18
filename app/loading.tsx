export default function HomeLoading() {
  return (
    <div className="shell page">
      <div className="loading-skeleton panel">
        <div className="loading-bar" style={{ height: 24, width: "40%" }} />
        <div className="loading-bar" style={{ height: 16, width: "60%" }} />
        <div className="loading-bar" style={{ height: 16, width: "50%" }} />
      </div>
      <div className="loading-skeleton" style={{ marginTop: 24 }}>
        <div className="loading-bar" style={{ height: 20, width: "30%" }} />
        {[1, 2, 3].map((i) => (
          <div key={i} className="loading-skeleton panel" style={{ padding: 18 }}>
            <div className="loading-bar" style={{ height: 16, width: "55%" }} />
            <div className="loading-bar" style={{ height: 14, width: "80%" }} />
          </div>
        ))}
      </div>
      <div className="loading-status">
        <span className="loading-spinner" />
        <span>Connecting to governance contracts…</span>
      </div>
    </div>
  );
}
