export default function DaoLoading() {
  return (
    <div className="shell page">
      <div className="hero loading-skeleton">
        <div className="loading-bar" style={{ height: 14, width: "25%" }} />
        <div className="loading-bar" style={{ height: 56, width: "50%", marginTop: 8 }} />
        <div className="loading-bar" style={{ height: 16, width: "70%", marginTop: 8 }} />
      </div>
      <div className="loading-skeleton" style={{ marginTop: 24 }}>
        <div className="loading-bar" style={{ height: 20, width: "30%" }} />
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="loading-skeleton panel" style={{ padding: 18 }}>
            <div className="loading-bar" style={{ height: 16, width: "55%" }} />
            <div className="loading-bar" style={{ height: 14, width: "80%" }} />
          </div>
        ))}
      </div>
      <div className="loading-status">
        <span className="loading-spinner" />
        <span>Reading proposal history from on-chain logs…</span>
      </div>
    </div>
  );
}
