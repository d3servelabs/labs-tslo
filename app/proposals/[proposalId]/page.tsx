import { notFound } from "next/navigation";

import { ProposalDetail } from "@/components/proposal-detail";
import { getPrimaryDao, getSiteMode } from "@/lib/config";
import { getLivePrimaryDao, getLiveProposalById } from "@/lib/live";

export const dynamic = "force-dynamic";

export default async function SingleProposalPage({
  params
}: {
  params: Promise<{ proposalId: string }>;
}) {
  if (getSiteMode() !== "single") {
    notFound();
  }

  const dao = (await getLivePrimaryDao()) ?? getPrimaryDao();

  if (!dao) {
    notFound();
  }

  const { proposalId } = await params;
  const proposal = await getLiveProposalById(dao.slug, proposalId);

  if (!proposal) {
    notFound();
  }

  return <ProposalDetail dao={{ ...dao, slug: "" }} proposal={proposal} daoHref="/" />;
}
