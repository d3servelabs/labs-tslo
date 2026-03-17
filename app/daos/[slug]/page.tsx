import Link from "next/link";
import { notFound } from "next/navigation";

import { ProposalCard } from "@/components/proposal-card";
import { formatAddress, formatNumber, formatPercent } from "@/lib/format";
import { getDaoBySlug } from "@/lib/data";

export default async function DaoPage({
  params
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const dao = getDaoBySlug(slug);

  if (!dao) {
    notFound();
  }

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
            </div>
          </div>
          <div className="panel">
            <div className="eyebrow">Contracts</div>
            <div className="activity-list">
              <div className="activity-item">
                <strong>Governor:</strong> {formatAddress(dao.contracts.governor)}
              </div>
              <div className="activity-item">
                <strong>Token:</strong> {formatAddress(dao.contracts.token)}
              </div>
              {dao.contracts.timelock ? (
                <div className="activity-item">
                  <strong>Timelock:</strong> {formatAddress(dao.contracts.timelock)}
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
            {dao.capabilityFlags.map((capability) => (
              <span key={capability} className="metric-pill">
                {capability}
              </span>
            ))}
          </div>
          <p className="footnote">
            MVP handles explicit feature flags per DAO instead of assuming all Governor variants are
            identical.
          </p>
          {dao.supportNotes ? <p className="footnote">{dao.supportNotes}</p> : null}
        </div>
        <div className="panel">
          <div className="eyebrow">Links</div>
          <div className="activity-list">
            <a className="activity-item" href={dao.links.website} target="_blank" rel="noreferrer">
              Website
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
            {dao.delegates.map((delegate) => (
              <div key={delegate.address} className="activity-item">
                <div className="row-between">
                  <strong>{delegate.ens ?? formatAddress(delegate.address)}</strong>
                  <span>{formatNumber(delegate.votingPower)} votes</span>
                </div>
                <div className="footnote">{delegate.statement}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="panel">
          <div className="eyebrow">Recent activity</div>
          <div className="activity-list">
            {dao.activity.map((item) => (
              <div key={`${item.label}-${item.timestamp}`} className="activity-item">
                <div className="row-between">
                  <strong>{item.label}</strong>
                  <span>{new Date(item.timestamp).toLocaleDateString("en-US")}</span>
                </div>
                <div className="footnote">{item.detail}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="row-between">
          <div>
            <div className="eyebrow">Proposals</div>
            <h2 className="section-title">Proposal history</h2>
          </div>
          <Link href={`/api/daos/${dao.slug}`} className="button-secondary">
            DAO JSON
          </Link>
        </div>
        <div className="proposal-list">
          {dao.proposals.map((proposal) => (
            <ProposalCard key={proposal.id} dao={dao} proposal={proposal} />
          ))}
        </div>
      </section>
    </main>
  );
}
