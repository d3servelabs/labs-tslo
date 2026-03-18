import { formatNumber } from "@/lib/format";
import { VoteTally } from "@/lib/types";

export function ProposalVoteBars({ votes }: { votes: VoteTally }) {
  const total = votes.for + votes.against + votes.abstain;

  function pct(value: number) {
    return total === 0 ? "0%" : `${(value / total) * 100}%`;
  }

  const segments = [
    { label: "For", value: votes.for, width: pct(votes.for), className: "vote-for" },
    { label: "Against", value: votes.against, width: pct(votes.against), className: "vote-against" },
    { label: "Abstain", value: votes.abstain, width: pct(votes.abstain), className: "vote-abstain" }
  ];

  return (
    <div className="progress-stack">
      {total === 0 ? (
        <div className="footnote">No votes recorded yet</div>
      ) : (
        segments.map((segment) => (
          <div key={segment.label}>
            <div className="progress-label">
              <span>{segment.label}</span>
              <span>{formatNumber(segment.value)}</span>
            </div>
            <div className="progress">
              <span className={segment.className} style={{ width: segment.width }} />
            </div>
          </div>
        ))
      )}
      <div className="footnote">Quorum target: {formatNumber(votes.quorum)} votes</div>
    </div>
  );
}
