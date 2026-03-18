import type { Route } from "next";
import Link from "next/link";

import { LoadStatusBanner } from "@/components/load-status-banner";
import { formatCompactNumber, formatDate, formatNumber, formatPercent } from "@/lib/format";
import { DaoConfig, Proposal } from "@/lib/types";

export function ProposalCard({ dao, proposal }: { dao: DaoConfig; proposal: Proposal }) {
  const href = (
    dao.slug ? `/gov/${dao.slug}/proposal/${proposal.id}` : `/proposals/${proposal.id}`
  ) as Route;
  const totalVotes = proposal.totalVotes ?? proposal.votes.for + proposal.votes.against + proposal.votes.abstain;
  const voterCount = proposal.voterCount ?? proposal.voters?.length ?? 0;

  function pct(value: number) {
    return totalVotes === 0 ? "0%" : `${(value / totalVotes) * 100}%`;
  }

  return (
    <Link href={href} className="proposal-card">
      <div className="proposal-card-grid">
        <div className="proposal-card-main">
          <div className="row-between">
            <h3 className="card-title">{proposal.title}</h3>
            <span className="status-pill" data-status={proposal.state}>
              {proposal.state}
            </span>
          </div>
          <div className="pill-row">
            <span className="metric-pill">
              {proposal.loadStatus?.isPartial ? "End date pending" : `Ends ${formatDate(proposal.votingEndsAt)}`}
            </span>
            <span className="metric-pill">{formatPercent(proposal.turnout)} turnout</span>
          </div>
        </div>

        <div className="proposal-card-votes">
          <div className="proposal-card-vote-numbers">
            <span className="vote-for-text">{formatCompactNumber(proposal.votes.for)}</span>
            <span className="vote-against-text">{formatCompactNumber(proposal.votes.against)}</span>
            <span className="vote-abstain-text">{formatCompactNumber(proposal.votes.abstain)}</span>
          </div>
          <div className="compact-progress">
            <span className="vote-for" style={{ width: pct(proposal.votes.for) }} />
            <span className="vote-against" style={{ width: pct(proposal.votes.against) }} />
            <span className="vote-abstain" style={{ width: pct(proposal.votes.abstain) }} />
          </div>
          <div className="proposal-card-vote-meta">
            <span>{formatNumber(voterCount)} addresses</span>
            <span>{formatCompactNumber(totalVotes)} total votes</span>
          </div>
        </div>
      </div>
      {proposal.loadStatus?.isPartial ? (
        <LoadStatusBanner variant="info" message={proposal.loadStatus.message} estimate={proposal.loadStatus.estimate} />
      ) : null}
    </Link>
  );
}
