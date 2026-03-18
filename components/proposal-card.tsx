import type { Route } from "next";
import Link from "next/link";

import { LoadStatusBanner } from "@/components/load-status-banner";
import { formatDate, formatPercent } from "@/lib/format";
import { DaoConfig, Proposal } from "@/lib/types";

export function ProposalCard({ dao, proposal }: { dao: DaoConfig; proposal: Proposal }) {
  const href = (
    dao.slug ? `/daos/${dao.slug}/proposals/${proposal.slug}` : `/proposals/${proposal.slug}`
  ) as Route;

  return (
    <Link href={href} className="proposal-card">
      <div className="row-between">
        <h3 className="card-title">{proposal.title}</h3>
        <span className="status-pill" data-status={proposal.state}>
          {proposal.state}
        </span>
      </div>
      <p className="muted">{proposal.summary}</p>
      <div className="pill-row">
        <span className="metric-pill">
          {proposal.loadStatus?.isPartial ? "End date pending" : `Ends ${formatDate(proposal.votingEndsAt)}`}
        </span>
        <span className="metric-pill">{formatPercent(proposal.turnout)} turnout</span>
      </div>
      {proposal.loadStatus?.isPartial ? (
        <LoadStatusBanner variant="info" message={proposal.loadStatus.message} estimate={proposal.loadStatus.estimate} />
      ) : null}
    </Link>
  );
}
