import { formatNumber } from "@/lib/format";
import { VoteTally } from "@/lib/types";

export function VoteSummaryCard({ votes }: { votes: VoteTally }) {
  const total = votes.for + votes.against + votes.abstain;
  const hasQuorum = total >= votes.quorum;
  const isMajority = votes.for > votes.against;

  function pct(value: number) {
    return total === 0 ? "0%" : `${(value / total) * 100}%`;
  }

  return (
    <div className="vote-summary-card">
      <div className="vote-summary-header">
        <div className="vote-summary-stat">
          <div className="vote-summary-label">Quorum</div>
          <div className="vote-summary-value">
            {formatNumber(total)} of {formatNumber(votes.quorum)}
            {hasQuorum ? (
              <span className="icon-success">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
              </span>
            ) : null}
          </div>
        </div>
        <div className="vote-summary-stat">
          <div className="vote-summary-label">Majority</div>
          <div className="vote-summary-value">
            {isMajority ? "Yes" : "No"}
            {isMajority ? (
              <span className="icon-success">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
              </span>
            ) : null}
          </div>
        </div>
      </div>

      <div className="compact-progress-stack">
        <div className="compact-progress">
          <span className="vote-for" style={{ width: pct(votes.for) }} />
          <span className="vote-against" style={{ width: pct(votes.against) }} />
          <span className="vote-abstain" style={{ width: pct(votes.abstain) }} />
        </div>
      </div>

      <div className="vote-breakdown-list">
        <div className="vote-breakdown-row">
          <div className="vote-breakdown-label">
            <div className="vote-dot dot-for" /> For
          </div>
          <div>{formatNumber(votes.for)}</div>
        </div>
        <div className="vote-breakdown-row">
          <div className="vote-breakdown-label">
            <div className="vote-dot dot-against" /> Against
          </div>
          <div>{formatNumber(votes.against)}</div>
        </div>
        <div className="vote-breakdown-row">
          <div className="vote-breakdown-label">
            <div className="vote-dot dot-abstain" /> Abstain
          </div>
          <div>{formatNumber(votes.abstain)}</div>
        </div>
      </div>
    </div>
  );
}
