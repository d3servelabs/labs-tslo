import { formatNumber } from "@/lib/format";
import { VoteTally } from "@/lib/types";

export function ProposalVoteBars({ votes }: { votes: VoteTally }) {
  const total = votes.for + votes.against + votes.abstain;
  const segments = [
    {
      label: "For",
      value: votes.for,
      width: `${(votes.for / total) * 100}%`,
      className: "vote-for"
    },
    {
      label: "Against",
      value: votes.against,
      width: `${(votes.against / total) * 100}%`,
      className: "vote-against"
    },
    {
      label: "Abstain",
      value: votes.abstain,
      width: `${(votes.abstain / total) * 100}%`,
      className: "vote-abstain"
    }
  ];

  return (
    <div className="progress-stack">
      {segments.map((segment) => (
        <div key={segment.label}>
          <div className="progress-label">
            <span>{segment.label}</span>
            <span>{formatNumber(segment.value)}</span>
          </div>
          <div className="progress">
            <span className={segment.className} style={{ width: segment.width }} />
          </div>
        </div>
      ))}
      <div className="footnote">Quorum target: {formatNumber(votes.quorum)} votes</div>
    </div>
  );
}
