import { notFound } from "next/navigation";

import { ProposalDetailWrapper } from "@/components/proposal-detail-wrapper";
import { getSiteMode } from "@/lib/config";
import { loadPrimaryDao } from "@/lib/data-adapter";

export const dynamic = "force-dynamic";

export default async function SingleProposalPage({
  params
}: {
  params: Promise<{ proposalId: string }>;
}) {
  if (getSiteMode() !== "single") {
    notFound();
  }

  const dao = await loadPrimaryDao();

  if (!dao) {
    notFound();
  }

  const { proposalId } = await params;

  return <ProposalDetailWrapper dao={{ ...dao, slug: "" }} proposalId={proposalId} daoHref="/" />;
}
