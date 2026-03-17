import type { Route } from "next";
import Link from "next/link";

import { formatDate, formatPercent } from "@/lib/format";
import { DaoConfig, Proposal } from "@/lib/types";

export function ProposalCard({ dao, proposal }: { dao: DaoConfig; proposal: Proposal }) {
  const href = (
    dao.slug ? `/daos/${dao.slug}/proposals/${proposal.slug}` : `/proposals/${proposal.slug}`
  ) as Route;

  return (
    <Link href={href} className="proposal-card">
      <div className="row-between">
        <div>
          <div className="eyebrow">{proposal.id}</div>
          <h3 className="card-title">{proposal.title}</h3>
        </div>
        <span className="status-pill" data-status={proposal.state}>
          {proposal.state}
        </span>
      </div>
      <p className="muted">{proposal.summary}</p>
      <div className="pill-row">
        <span className="metric-pill">Ends {formatDate(proposal.votingEndsAt)}</span>
        <span className="metric-pill">{formatPercent(proposal.turnout)} turnout</span>
      </div>
    </Link>
  );
}
