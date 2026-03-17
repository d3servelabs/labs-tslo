import { getTsloConfig } from "@/lib/config";

export function SetupGuide() {
  const config = getTsloConfig();

  return (
    <main className="shell">
      <section className="hero">
        <div className="hero-grid">
          <div>
            <div className="eyebrow">TSLO Setup</div>
            <h1>Configure your DAO to bring TSLO online.</h1>
            <p className="lede">
              This deployment has no DAO configured yet. Add one or more DAOs to `tslo.config.ts`
              and TSLO will switch from setup mode into a branded governance site.
            </p>
            <div className="cta-row">
              <a className="button" href={config.repoUrl} target="_blank" rel="noreferrer">
                Open repository
              </a>
              <a className="button-secondary" href={config.docsUrl} target="_blank" rel="noreferrer">
                Read plan
              </a>
            </div>
          </div>
          <div className="panel">
            <div className="eyebrow">Required config</div>
            <div className="activity-list">
              <div className="activity-item">Official DAO website URL</div>
              <div className="activity-item">Chain ID and chain name</div>
              <div className="activity-item">Governor contract address</div>
              <div className="activity-item">Voting token address</div>
              <div className="activity-item">Optional timelock address</div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
