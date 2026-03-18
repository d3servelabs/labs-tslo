import Link from "next/link";

import { AddressDisplay } from "@/components/address-display";
import { ProposalCard } from "@/components/proposal-card";
import { formatAddress, formatNumber, formatPercent } from "@/lib/format";
import { DataAdapterKind } from "@/lib/data-adapter";
import { DaoConfig } from "@/lib/types";

export function DaoOverview({
  dao,
  apiBasePath,
  adapterKind
}: {
  dao: DaoConfig;
  apiBasePath: string;
  adapterKind: DataAdapterKind;
}) {
  return (
    <main className="shell">
      <section className="hero">
        <div className="hero-grid">
          <div>
            <div className="eyebrow">
              {dao.shortName} • {dao.chainName}
            </div>
            <h1>{dao.name}</h1>
            <p className="lede">{dao.description}</p>
            <div className="pill-row">
              <span className="metric-pill">{dao.governanceType}</span>
              <span className="metric-pill">{dao.governanceVersion}</span>
              <span className="metric-pill">Chain ID {dao.chainId}</span>
              <span className="metric-pill">Adapter {adapterKind}</span>
            </div>
          </div>
          <div className="panel">
            <div className="eyebrow">Contracts</div>
            <div className="activity-list">
              <div className="activity-item">
                <strong>Governor</strong>
                <AddressDisplay chainId={dao.chainId} address={dao.contracts.governor} mode="full" />
              </div>
              <div className="activity-item">
                <strong>Token</strong>
                <AddressDisplay chainId={dao.chainId} address={dao.contracts.token} mode="full" />
              </div>
              {dao.contracts.timelock ? (
                <div className="activity-item">
                  <strong>Timelock</strong>
                  <AddressDisplay chainId={dao.chainId} address={dao.contracts.timelock} mode="full" />
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      <section className="section grid-3">
        <div className="panel">
          <div className="metric-label">Total proposals</div>
          <div className="metric-value">{formatNumber(dao.stats.totalProposals)}</div>
        </div>
        <div className="panel">
          <div className="metric-label">Delegates</div>
          <div className="metric-value">{formatNumber(dao.stats.delegates)}</div>
        </div>
        <div className="panel">
          <div className="metric-label">Average turnout</div>
          <div className="metric-value">{formatPercent(dao.stats.turnoutAverage)}</div>
        </div>
      </section>

      <section className="section grid-2">
        <div className="panel">
          <div className="eyebrow">Capabilities</div>
          <div className="pill-row">
            {dao.capabilityFlags.length > 0 ? (
              dao.capabilityFlags.map((capability) => (
                <span key={capability} className="metric-pill">
                  {capability}
                </span>
              ))
            ) : (
              <span className="metric-pill">Awaiting capability detection</span>
            )}
          </div>
          <p className="footnote">
            TSLO keeps capability flags explicit so Governor variants fail safely instead of
            pretending every DAO supports identical write paths.
          </p>
          {dao.loadStatus?.isPartial ? (
            <p className="footnote">
              Partial load: {dao.loadStatus.message} Estimate: {dao.loadStatus.estimate}
            </p>
          ) : null}
          {dao.supportNotes ? <p className="footnote">{dao.supportNotes}</p> : null}
        </div>
        <div className="panel">
          <div className="eyebrow">Links</div>
          <div className="activity-list">
            <a className="activity-item" href={dao.links.website} target="_blank" rel="noreferrer">
              Official website
            </a>
            <a className="activity-item" href={dao.links.forum} target="_blank" rel="noreferrer">
              Forum
            </a>
            <a className="activity-item" href={dao.links.docs} target="_blank" rel="noreferrer">
              Docs
            </a>
            <a className="activity-item" href={dao.links.treasury} target="_blank" rel="noreferrer">
              Treasury
            </a>
          </div>
        </div>
      </section>

      <section className="section grid-2">
        <div className="panel">
          <div className="eyebrow">Active delegates</div>
          <div className="activity-list">
            {dao.delegates.length > 0 ? (
              dao.delegates.map((delegate) => (
                <div key={delegate.address} className="activity-item">
                  <div className="row-between">
                    <strong>{delegate.ens ?? formatAddress(delegate.address)}</strong>
                    <span>{formatNumber(delegate.votingPower)} votes</span>
                  </div>
                  <div className="footnote">{delegate.statement}</div>
                </div>
              ))
            ) : (
              <div className="empty-state">
                {adapterKind === "live"
                  ? "Delegate data is not loaded yet. TSLO is currently reading proposal history first; delegate data can be added in a later live pass."
                  : "Delegate data is not available from the current adapter yet."}
              </div>
            )}
          </div>
        </div>
        <div className="panel">
          <div className="eyebrow">Recent activity</div>
          <div className="activity-list">
            {dao.activity.length > 0 ? (
              dao.activity.map((item) => (
                <div key={`${item.label}-${item.timestamp}`} className="activity-item">
                  <div className="row-between">
                    <strong>{item.label}</strong>
                    <span>{new Date(item.timestamp).toLocaleDateString("en-US")}</span>
                  </div>
                  <div className="footnote">{item.detail}</div>
                </div>
              ))
            ) : (
              <div className="empty-state">No indexed governance activity yet.</div>
            )}
          </div>
        </div>
      </section>

      <section className="section" id="proposals">
        <div className="row-between">
          <div>
            <div className="eyebrow">Proposals</div>
            <h2 className="section-title">Proposal history</h2>
          </div>
          <a href={apiBasePath} className="button-secondary">
            DAO JSON
          </a>
        </div>
        <div className="proposal-list">
          {dao.proposals.length > 0 ? (
            dao.proposals.map((proposal) => <ProposalCard key={proposal.id} dao={dao} proposal={proposal} />)
          ) : (
            <div className="empty-state">
              This DAO is configured, but there is no proposal history loaded yet.
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
