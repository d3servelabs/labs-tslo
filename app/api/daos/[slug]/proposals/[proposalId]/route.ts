import { NextResponse } from "next/server";

import { getSiteMode } from "@/lib/config";
import { loadProposalById } from "@/lib/data-adapter";

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
  const proposal = await loadProposalById(slug, proposalId);

  if (!proposal) {
    return NextResponse.json({ error: "Proposal not found" }, { status: 404 });
  }

  return NextResponse.json({ proposal });
}
