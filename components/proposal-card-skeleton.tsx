export function ProposalCardSkeleton() {
  return (
    <div className="proposal-card" style={{ pointerEvents: "none" }}>
      <div className="proposal-card-grid">
        <div className="proposal-card-main">
          <div className="row-between">
            <div className="loading-bar" style={{ width: "60%", height: "24px" }} />
            <div className="loading-bar" style={{ width: "80px", height: "24px", borderRadius: "999px" }} />
          </div>
          <div className="loading-bar" style={{ width: "100%", height: "16px", marginTop: "12px" }} />
          <div className="loading-bar" style={{ width: "85%", height: "16px", marginTop: "8px" }} />
          <div className="pill-row" style={{ marginTop: "16px" }}>
            <div className="loading-bar" style={{ width: "120px", height: "26px", borderRadius: "999px" }} />
            <div className="loading-bar" style={{ width: "90px", height: "26px", borderRadius: "999px" }} />
          </div>
        </div>

        <div className="proposal-card-votes">
          <div className="proposal-card-vote-numbers">
            <div className="loading-bar" style={{ width: "40px", height: "16px" }} />
            <div className="loading-bar" style={{ width: "40px", height: "16px" }} />
            <div className="loading-bar" style={{ width: "40px", height: "16px" }} />
          </div>
          <div className="loading-bar" style={{ width: "100%", height: "8px", borderRadius: "999px" }} />
          <div className="proposal-card-vote-meta">
            <div className="loading-bar" style={{ width: "80px", height: "12px" }} />
            <div className="loading-bar" style={{ width: "90px", height: "12px" }} />
          </div>
        </div>
      </div>
    </div>
  );
}
