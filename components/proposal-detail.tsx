import type { Route } from "next";
import Link from "next/link";

import { AddressDisplay } from "@/components/address-display";
import { LoadStatusBanner } from "@/components/load-status-banner";
import { VoteSummaryCard } from "@/components/vote-summary-card";
import { StatusTimeline } from "@/components/status-timeline";
import { Tabs } from "@/components/tabs";
import { TruncatedDescription } from "@/components/truncated-description";
import { ActionCard } from "@/components/action-card";
import { VoterList } from "@/components/voter-list";
import { formatDate, renderMarkdownBasic } from "@/lib/format";
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
      <div className="row-between breadcrumb-row">
        <div className="breadcrumb">
          <Link href={daoHref as Route} className="breadcrumb-link">
            Proposals
          </Link>
          <span className="breadcrumb-separator">/</span>
          <span className="breadcrumb-current">Proposal</span>
        </div>
        <span className="status-pill" data-status={proposal.state}>
          {proposal.state}
        </span>
      </div>

      <section className="section">
        <h1 className="proposal-title">{proposal.title}</h1>
        {proposal.loadStatus?.isPartial ? (
          <LoadStatusBanner variant="info" message={proposal.loadStatus.message} estimate={proposal.loadStatus.estimate} />
        ) : null}
        
        <div className="proposal-meta-line">
          <AddressDisplay chainId={dao.chainId} address={proposal.proposer} mode="inline" />
          <span className="meta-separator">•</span>
          <span className="meta-text">ID {proposal.id.slice(0, 6)}...{proposal.id.slice(-4)}</span>
          <span className="meta-separator">•</span>
          <span className="meta-text">Proposed on: {formatDate(proposal.createdAt)}</span>
        </div>
      </section>

      <section className="section proposal-grid">
        <div className="proposal-main-column">
          <div className="panel">
            <TruncatedDescription htmlContent={renderMarkdownBasic(proposal.description)} />
          </div>

          <div className="panel proposal-actions-panel">
            <h2 className="panel-title">Executable Actions</h2>
            <div className="call-data-list">
              {proposal.actions.map((action, index) => (
                <ActionCard key={`${action.target}-${index}`} action={action} index={index} chainId={dao.chainId} />
              ))}
            </div>
          </div>

          <div className="panel proposal-voters-panel">
            <h2 className="panel-title">Votes</h2>
            <VoterList voters={proposal.voters ?? []} chainId={dao.chainId} />
          </div>
        </div>

        <div className="proposal-sidebar">
          <div className="panel sidebar-panel">
            <h3 className="sidebar-title">Final Votes</h3>
            <VoteSummaryCard votes={proposal.votes} />
          </div>

          {proposal.actions.length > 0 && (
            <div className="panel sidebar-panel tenderly-panel">
              <a
                href={dao.tenderlyProjectUrl ? `${dao.tenderlyProjectUrl}/simulator/new?network=${dao.chainId}&to=${proposal.actions[0]?.target}&data=${proposal.actions[0]?.calldata}` : `https://dashboard.tenderly.co/simulator/new?network=${dao.chainId}&to=${proposal.actions[0]?.target}&data=${proposal.actions[0]?.calldata}`}
                target="_blank"
                rel="noreferrer"
                className="tenderly-link"
              >
                <div className="tenderly-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12h4l3-9 5 18 3-9h5"/></svg>
                </div>
                <span>Simulate on Tenderly</span>
              </a>
            </div>
          )}

          <div className="panel sidebar-panel timeline-panel">
            <h3 className="sidebar-title">Status</h3>
            <StatusTimeline timeline={proposal.timeline} chainId={dao.chainId} />
          </div>
        </div>
      </section>
    </main>
  );
}
