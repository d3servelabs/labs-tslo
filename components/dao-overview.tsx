"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

import { AddressDisplay } from "@/components/address-display";
import { CreateProposalButton } from "@/components/create-proposal-button";
import { LoadStatusBanner } from "@/components/load-status-banner";
import { ProposalCard } from "@/components/proposal-card";
import { ProposalCardSkeleton } from "@/components/proposal-card-skeleton";
import { ContractsModal } from "@/components/contracts-modal";
import { formatAddress, formatNumber, formatPercent } from "@/lib/format";
import { DataAdapterKind } from "@/lib/data-adapter";
import { DaoConfig } from "@/lib/types";
import { useDaoSync } from "@/hooks/use-dao-sync";

export function DaoOverview({
  dao,
  apiBasePath,
  adapterKind
}: {
  dao: DaoConfig;
  apiBasePath: string;
  adapterKind: DataAdapterKind;
}) {
  const initialStartBlock = dao.loadStatus?.startBlock ?? 0;
  const { proposals, isSyncing, progress } = useDaoSync(dao, initialStartBlock);
  
  const [visibleCount, setVisibleCount] = useState(10);
  
  const displayProposals = proposals.length > 0 ? proposals : dao.proposals;
  const visibleProposals = displayProposals.slice(0, visibleCount);
  const hasMore = visibleCount < displayProposals.length;

  const totalProps = dao.stats.totalProposals || displayProposals.length;
  const activeProps = displayProposals.filter((p) => p.state === "active").length;
  const passedProps = displayProposals.filter((p) => p.state === "succeeded" || p.state === "executed" || p.state === "queued").length;
  const rejectedProps = displayProposals.filter((p) => p.state === "defeated" && p.meetsQuorum).length;
  const expiredQuorumProps = displayProposals.filter((p) => p.state === "defeated" && !p.meetsQuorum).length;

  const [isContractsModalOpen, setIsContractsModalOpen] = useState(false);

  return (
    <main className="shell">
      <section className="hero">
        <div className="hero-grid" style={{ gridTemplateColumns: "1fr" }}>
          <div>
            <div className="eyebrow">
              {dao.shortName} • {dao.chainName}
            </div>
            <h1>{dao.name}</h1>
            <p className="lede">{dao.description}</p>
            <div className="pill-row" style={{ marginBottom: "20px" }}>
              <span className="metric-pill">{dao.governanceType}</span>
              <span className="metric-pill">{dao.governanceVersion}</span>
            </div>
            <div className="activity-list" style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
              {dao.links.website && (
                <a className="button-secondary" href={dao.links.website} target="_blank" rel="noreferrer" title="Official website" style={{ padding: "8px 12px" }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>
                </a>
              )}
              {dao.links.forum && (
                <a className="button-secondary" href={dao.links.forum} target="_blank" rel="noreferrer" title="Forum" style={{ padding: "8px 12px" }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                </a>
              )}
              {dao.links.docs && (
                <a className="button-secondary" href={dao.links.docs} target="_blank" rel="noreferrer" title="Docs" style={{ padding: "8px 12px" }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path></svg>
                </a>
              )}
              {dao.links.treasury && (
                <a className="button-secondary" href={dao.links.treasury} target="_blank" rel="noreferrer" title="Treasury" style={{ padding: "8px 12px" }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"></rect><line x1="2" y1="10" x2="22" y2="10"></line></svg>
                </a>
              )}
              <button 
                className="button-secondary" 
                onClick={() => setIsContractsModalOpen(true)} 
                title="Contracts and parameters" 
                style={{ padding: "8px 12px" }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="section" id="proposals">
        <div className="row-between">
          <div>
            <div className="eyebrow">Proposals</div>
            <h2 className="section-title">
              Proposal history <span style={{ fontSize: "1rem", color: "var(--muted)", fontWeight: "normal" }}>({activeProps} active, {passedProps} passed, {rejectedProps} rejected, {expiredQuorumProps} expired without a quorum, {totalProps} total)</span>
            </h2>
          </div>
          <div className="cta-row">
            <CreateProposalButton chainId={dao.chainId} governorAddress={dao.contracts.governor} />
          </div>
        </div>
        <div className="proposal-list">
          {displayProposals.length > 0 ? (
            <>
              {visibleProposals.map((proposal) => (
                <ProposalCard key={proposal.id} dao={dao} proposal={proposal} />
              ))}
              {isSyncing && !hasMore && (
                <ProposalCardSkeleton />
              )}
              <div style={{ display: "flex", justifyContent: "center", gap: "12px", marginTop: "1rem" }}>
                {hasMore && (
                  <button
                    className="button-secondary"
                    onClick={() => setVisibleCount(displayProposals.length)}
                  >
                    Show more
                  </button>
                )}
                {visibleCount > 10 && (
                  <button
                    className="button-secondary"
                    onClick={() => setVisibleCount(10)}
                  >
                    Show less
                  </button>
                )}
              </div>
            </>
          ) : isSyncing ? (
            <ProposalCardSkeleton />
          ) : (
            <div className="empty-state">
              This DAO is configured, but there is no proposal history loaded yet.
            </div>
          )}
        </div>
      </section>

      <ContractsModal 
        dao={dao} 
        isOpen={isContractsModalOpen} 
        onClose={() => setIsContractsModalOpen(false)} 
      />
    </main>
  );
}
