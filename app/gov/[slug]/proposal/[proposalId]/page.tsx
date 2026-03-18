import { notFound } from "next/navigation";

import { ProposalDetail } from "@/components/proposal-detail";
import { getSiteMode } from "@/lib/config";
import { loadDaoBySlug, loadProposalById } from "@/lib/data-adapter";

export const dynamic = "force-dynamic";

export default async function ProposalPage({
  params
}: {
  params: Promise<{ slug: string; proposalId: string }>;
}) {
  if (getSiteMode() === "single") {
    notFound();
  }

  const { slug, proposalId } = await params;
  const dao = await loadDaoBySlug(slug);
  const proposal = await loadProposalById(slug, proposalId);

  if (!dao || !proposal) {
    notFound();
  }

  return <ProposalDetail dao={dao} proposal={proposal} daoHref={`/gov/${dao.slug}`} />;
}
