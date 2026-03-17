import { NextResponse } from "next/server";

import { getProposalById, getSiteMode } from "@/lib/config";
import { getLiveProposalById } from "@/lib/live";

export const dynamic = "force-dynamic";

export async function GET(
  _: Request,
  { params }: { params: Promise<{ slug: string; proposalId: string }> }
) {
  if (getSiteMode() === "single") {
    return NextResponse.json(
      { error: "Use /api/proposals/:proposalId in single-DAO mode." },
      { status: 404 }
    );
  }

  const { slug, proposalId } = await params;
  const proposal = (await getLiveProposalById(slug, proposalId)) ?? getProposalById(slug, proposalId);

  if (!proposal) {
    return NextResponse.json({ error: "Proposal not found" }, { status: 404 });
  }

  return NextResponse.json({ proposal });
}
