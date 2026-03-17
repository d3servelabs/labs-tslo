import Link from "next/link";

import { DaoCard } from "@/components/dao-card";
import { WalletCard } from "@/components/wallet-card";
import { ethereumDaoTargets, getDaos } from "@/lib/data";

export default function HomePage() {
  const daos = getDaos();

  return (
    <main className="shell">
      <section className="hero">
        <div className="hero-grid">
          <div>
            <div className="eyebrow">TSLO • Tally Shall Live On</div>
            <h1>Governance continuity for DAOs.</h1>
            <p className="lede">
              TSLO is a free, open-source replacement for Tally’s core governance workflows. This
              MVP focuses on the fastest route to launch for OpenZeppelin Governor DAOs.
            </p>
            <div className="cta-row">
              <Link href={`/daos/${daos[0].slug}`} className="button">
                View sample DAO
              </Link>
              <Link href="/api/daos" className="button-secondary">
                Read API
              </Link>
            </div>
          </div>
          <div className="panel">
            <div className="eyebrow">Launch Wedge</div>
            <div className="metrics">
              <div className="metric">
                <div className="metric-label">Target</div>
                <div className="metric-value">OZ Governor DAOs</div>
              </div>
              <div className="metric">
                <div className="metric-label">Compatibility</div>
                <div className="metric-value">User-flow first</div>
              </div>
              <div className="metric">
                <div className="metric-label">Surface</div>
                <div className="metric-value">Read API + governance UI</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="row-between">
          <div>
            <div className="eyebrow">DAOs</div>
            <h2 className="section-title">Ready-to-index governance spaces</h2>
          </div>
          <p className="muted">DAO onboarding is config-driven so TSLO can ship faster.</p>
        </div>
        <div className="dao-list">
          {daos.map((dao) => (
            <DaoCard key={dao.slug} dao={dao} />
          ))}
        </div>
      </section>

      <section className="section grid-2">
        <div className="panel">
          <div className="eyebrow">Ethereum Targets</div>
          <h3 className="card-title">Major Tally DAOs we can pursue next</h3>
          <div className="activity-list">
            {ethereumDaoTargets.map((dao) => (
              <div key={dao.name} className="activity-item">
                <div className="row-between">
                  <strong>{dao.name}</strong>
                  <span className="status-pill" data-status={dao.supportTier}>
                    {dao.supportTier}
                  </span>
                </div>
                <div className="footnote">{dao.reason}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="panel">
          <div className="eyebrow">First Real Target</div>
          <h3 className="card-title">ENS DAO support added</h3>
          <p className="muted">
            TSLO now includes an ENS DAO configuration with Ethereum mainnet governor, token, and
            timelock addresses. That gives us a real top-tier Tally DAO in the app and anchors the
            next indexing work on a standard OpenZeppelin Governor target.
          </p>
          <div className="cta-row">
            <Link href="/daos/ens" className="button">
              Open ENS DAO
            </Link>
            <Link href="/api/daos/ens" className="button-secondary">
              ENS JSON
            </Link>
          </div>
        </div>
      </section>

      <section className="section grid-2" id="launch">
        <div className="panel">
          <div className="eyebrow">MVP Scope</div>
          <h3 className="card-title">Included now</h3>
          <div className="activity-list">
            <div className="activity-item">DAO landing pages with proposal history</div>
            <div className="activity-item">Proposal detail with vote tallies and calldata</div>
            <div className="activity-item">Minimal read API for DAO and proposal data</div>
            <div className="activity-item">Wallet-connect stub for upcoming write flows</div>
          </div>
        </div>
        <WalletCard />
      </section>

      <section className="section api-shell" id="api">
        <div className="eyebrow">API Surface</div>
        <h2 className="section-title">Normalized governance read API</h2>
        <p className="muted">
          TSLO exposes a small JSON API that the frontend consumes. This keeps contract variance out
          of the UI and makes it easier to add a compatibility shim later if strict migration
          requirements emerge.
        </p>
        <pre className="code-block">
{`GET /api/daos
GET /api/daos/:slug
GET /api/daos/:slug/proposals/:proposalId`}
        </pre>
      </section>
    </main>
  );
}
