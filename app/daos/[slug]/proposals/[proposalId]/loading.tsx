export default function ProposalLoading() {
  return (
    <main className="shell proposal-shell page">
      <div className="loading-skeleton">
        <div className="loading-bar" style={{ height: 12, width: "20%" }} />
        <div className="loading-bar" style={{ height: 48, width: "75%", marginTop: 8 }} />
        <div className="loading-bar" style={{ height: 16, width: "90%" }} />
        <div className="loading-bar" style={{ height: 16, width: "60%" }} />
      </div>
      <div className="loading-skeleton panel" style={{ marginTop: 24 }}>
        <div className="loading-bar" style={{ height: 12, width: "15%" }} />
        <div className="loading-bar" style={{ height: 14, width: "100%" }} />
        <div className="loading-bar" style={{ height: 14, width: "85%" }} />
        <div className="loading-bar" style={{ height: 14, width: "95%" }} />
      </div>
      <div className="loading-skeleton" style={{ marginTop: 24, display: "grid", gridTemplateColumns: "1.6fr 0.9fr", gap: 24 }}>
        <div className="panel loading-skeleton">
          <div className="loading-bar" style={{ height: 12, width: "25%" }} />
          {[1, 2, 3].map((i) => (
            <div key={i}>
              <div className="loading-bar" style={{ height: 10, width: "40%", marginBottom: 4 }} />
              <div className="loading-bar" style={{ height: 14 }} />
            </div>
          ))}
        </div>
        <div className="panel loading-skeleton">
          <div className="loading-bar" style={{ height: 12, width: "25%" }} />
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="loading-bar" style={{ height: 14 }} />
          ))}
        </div>
      </div>
      <div className="loading-status">
        <span className="loading-spinner" />
        <span>Hydrating proposal votes and timeline from RPC…</span>
      </div>
    </main>
  );
}
