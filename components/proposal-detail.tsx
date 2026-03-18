import type { Route } from "next";
import Link from "next/link";

import { AddressDisplay } from "@/components/address-display";
import { ProposalVoteBars } from "@/components/proposal-vote-bars";
import { formatDate, formatPercent } from "@/lib/format";
import { DaoConfig, Proposal } from "@/lib/types";

export function ProposalDetail({
  dao,
  proposal,
  daoHref
}: {
  dao: DaoConfig;
  proposal: Proposal;
  daoHref: string;
}) {
  return (
    <main className="shell proposal-shell">
      <div className="row-between">
        <Link href={daoHref as Route} className="button-secondary">
          Back to {dao.shortName}
        </Link>
        <span className="status-pill" data-status={proposal.state}>
          {proposal.state}
        </span>
      </div>

      <section className="section">
        <div className="eyebrow">{proposal.id}</div>
        <h1 className="proposal-title">{proposal.title}</h1>
        <p className="lede">{proposal.summary}</p>
        {proposal.loadStatus?.isPartial ? (
          <p className="footnote">
            Partial data: {proposal.loadStatus.message} Estimate: {proposal.loadStatus.estimate}
          </p>
        ) : null}
        <div className="pill-row">
          <span className="metric-pill">Created {formatDate(proposal.createdAt)}</span>
          <span className="metric-pill">Turnout {formatPercent(proposal.turnout)}</span>
        </div>
        <div className="proposal-meta-grid">
          <div className="proposal-meta-panel">
            <div className="eyebrow">Proposer</div>
            <AddressDisplay chainId={dao.chainId} address={proposal.proposer} mode="short" />
          </div>
          <div className="proposal-meta-panel">
            <div className="eyebrow">Voting Window</div>
            <div className="proposal-meta-copy">
              {formatDate(proposal.votingStartsAt)} to {formatDate(proposal.votingEndsAt)}
            </div>
          </div>
        </div>
      </section>

      <section className="section panel">
        <div className="eyebrow">Description</div>
        <pre className="proposal-description">{proposal.description}</pre>
      </section>

      <section className="section proposal-grid">
        <div className="panel">
          <div className="eyebrow">Vote breakdown</div>
          <ProposalVoteBars votes={proposal.votes} />
          <div className="footnote">
            Voting window: {formatDate(proposal.votingStartsAt)} to {formatDate(proposal.votingEndsAt)}
          </div>
        </div>
        <div className="panel">
          <div className="eyebrow">Lifecycle</div>
          <div className="timeline">
            {proposal.timeline.map((step) => (
              <div key={step.label} className="timeline-item">
                <div className="timeline-dot" data-complete={step.complete} />
                <div>
                  <strong>{step.label}</strong>
                  <div className="timeline-note">{step.timestamp}</div>
                  <div className="footnote">{step.note}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section panel">
        <div className="eyebrow">Executable actions</div>
        <div className="call-data-list">
          {proposal.actions.map((action, index) => (
            <div key={`${action.target}-${index}`} className="call-data-item">
              <div className="row-between">
                <strong>{action.signature}</strong>
                <span className="proposal-action-index">Action {index + 1}</span>
              </div>
              <p className="muted">{action.summary}</p>
              <AddressDisplay chainId={dao.chainId} address={action.target} mode="short" />
              <pre className="code-block">{action.calldata}</pre>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
