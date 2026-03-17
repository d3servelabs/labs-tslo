import type { Route } from "next";
import Link from "next/link";

import { getSiteMode } from "@/lib/config";
import { formatPercent } from "@/lib/format";
import { DaoConfig } from "@/lib/types";

export function DaoCard({ dao }: { dao: DaoConfig }) {
  const href = (getSiteMode() === "single" ? "/" : `/daos/${dao.slug}`) as Route;

  return (
    <Link href={href} className="dao-card">
      <div className="row-between">
        <div>
          <div className="eyebrow">
            {dao.chainName} • {dao.governanceVersion}
          </div>
          <h3 className="card-title">{dao.name}</h3>
        </div>
        <span className="status-pill" data-status="active">
          {dao.stats.activeProposals} active
        </span>
      </div>
      <p className="muted">{dao.tagline}</p>
      <div className="pill-row">
        <span className="metric-pill">{dao.stats.totalProposals} proposals</span>
        <span className="metric-pill">{dao.stats.delegates} delegates</span>
        <span className="metric-pill">{formatPercent(dao.stats.turnoutAverage)} avg turnout</span>
        {dao.supportTier ? <span className="metric-pill">{dao.supportTier} support</span> : null}
      </div>
    </Link>
  );
}
