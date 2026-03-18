import Link from "next/link";

import { DaoDirectory } from "@/components/dao-directory";
import { DaoOverview } from "@/components/dao-overview";
import { SetupGuide } from "@/components/setup-guide";
import { WalletCard } from "@/components/wallet-card";
import { getSiteMode, getTsloConfig } from "@/lib/config";
import { getActiveDataAdapterKind } from "@/lib/data-adapter";
import { ethereumDaoTargets } from "@/lib/data";
import { loadDaos, loadPrimaryDao } from "@/lib/data-adapter";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const mode = getSiteMode();
  const config = getTsloConfig();

  if (mode === "setup") {
    return <SetupGuide />;
  }

  const adapterKind = getActiveDataAdapterKind();
  const daos = await loadDaos();
  const primaryDao = await loadPrimaryDao();

  if (mode === "single" && primaryDao) {
    return (
      <>
        <DaoOverview dao={{ ...primaryDao, slug: "" }} apiBasePath="/api/dao" adapterKind={adapterKind} />
        <section className="shell section grid-2">
          <div className="panel">
            <div className="eyebrow">Deployment Mode</div>
            <h3 className="card-title">Single DAO install</h3>
            <p className="muted">
              This deployment behaves like a single-site WordPress install. The DAO is the site, so
              proposal routes omit the DAO slug and branding follows the configured protocol.
            </p>
            <div className="pill-row">
              <span className="metric-pill">{primaryDao.name}</span>
              <span className="metric-pill">{primaryDao.chainName}</span>
              <span className="metric-pill">{config.siteName}</span>
              <span className="metric-pill">Adapter {adapterKind}</span>
            </div>
          </div>
          <WalletCard />
        </section>
      </>
    );
  }

  return (
    <main className="shell">
      <section className="hero">
        <div className="hero-grid">
          <div>
            <div className="eyebrow">TSLO • Tally Shall Live On</div>
            <h1>Governance continuity for DAOs.</h1>
            <p className="lede">
              This deployment runs in directory mode. Use the search below to select a DAO and open
              its branded governance space.
            </p>
            <div className="cta-row">
              <Link href={`/gov/${daos[0].slug}`} className="button">
                Open first DAO
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

      <section className="section" id="directory">
        <DaoDirectory daos={daos} />
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
            <Link href="/gov/ens" className="button">
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
