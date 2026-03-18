import { notFound } from "next/navigation";

import { ProposalDetailWrapper } from "@/components/proposal-detail-wrapper";
import { getSiteMode } from "@/lib/config";
import { loadDaoBySlug } from "@/lib/data-adapter";

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

  if (!dao) {
    notFound();
  }

  return <ProposalDetailWrapper dao={dao} proposalId={proposalId} daoHref={`/gov/${dao.slug}`} />;
}
