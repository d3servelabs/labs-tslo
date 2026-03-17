import { NextResponse } from "next/server";

import { getProposalById } from "@/lib/data";

export async function GET(
  _: Request,
  { params }: { params: Promise<{ slug: string; proposalId: string }> }
) {
  const { slug, proposalId } = await params;
  const proposal = getProposalById(slug, proposalId);

  if (!proposal) {
    return NextResponse.json({ error: "Proposal not found" }, { status: 404 });
  }

  return NextResponse.json({ proposal });
}
