"use client";

import { useDaoSync } from "@/hooks/use-dao-sync";
import { ProposalDetail } from "./proposal-detail";
import { DaoConfig } from "@/lib/types";

export function ProposalDetailWrapper({
  dao,
  proposalId,
  daoHref
}: {
  dao: DaoConfig;
  proposalId: string;
  daoHref: string;
}) {
  const initialStartBlock = dao.loadStatus?.startBlock ?? 0;
  const { proposals, isSyncing } = useDaoSync(dao, initialStartBlock);

  const proposal = proposals.find(
    (p) =>
      p.id.toLowerCase() === proposalId.toLowerCase() ||
      p.slug.toLowerCase() === proposalId.toLowerCase()
  );

  if (!proposal && isSyncing) {
    return (
      <main className="shell proposal-shell">
        <div style={{ padding: "40px", textAlign: "center", color: "var(--muted)" }}>
          Syncing proposal data from RPC...
        </div>
      </main>
    );
  }

  if (!proposal) {
    return (
      <main className="shell proposal-shell">
        <div style={{ padding: "40px", textAlign: "center", color: "var(--danger)" }}>
          Proposal not found.
        </div>
      </main>
    );
  }

  return <ProposalDetail dao={dao} proposal={proposal} daoHref={daoHref} />;
}
