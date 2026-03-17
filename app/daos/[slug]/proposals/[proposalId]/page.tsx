import { notFound } from "next/navigation";

import { ProposalDetail } from "@/components/proposal-detail";
import { getDaoBySlug, getSiteMode } from "@/lib/config";
import { getLiveDaoBySlug, getLiveProposalById } from "@/lib/live";

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
  const dao = (await getLiveDaoBySlug(slug)) ?? getDaoBySlug(slug);
  const proposal = await getLiveProposalById(slug, proposalId);

  if (!dao || !proposal) {
    notFound();
  }

  return <ProposalDetail dao={dao} proposal={proposal} daoHref={`/daos/${dao.slug}`} />;
}
