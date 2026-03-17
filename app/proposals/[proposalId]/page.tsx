import { notFound } from "next/navigation";

import { ProposalDetail } from "@/components/proposal-detail";
import { getSiteMode } from "@/lib/config";
import { loadPrimaryDao, loadProposalById } from "@/lib/data-adapter";

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
  const proposal = await loadProposalById(dao.slug, proposalId);

  if (!proposal) {
    notFound();
  }

  return <ProposalDetail dao={{ ...dao, slug: "" }} proposal={proposal} daoHref="/" />;
}
