import { NextResponse } from "next/server";

import { getSiteMode } from "@/lib/config";
import { loadPrimaryDao, loadProposalById } from "@/lib/data-adapter";

export const dynamic = "force-dynamic";

export async function GET(_: Request, { params }: { params: Promise<{ proposalId: string }> }) {
  if (getSiteMode() !== "single") {
    return NextResponse.json({ error: "Single DAO route unavailable in this mode" }, { status: 404 });
  }

  const dao = await loadPrimaryDao();

  if (!dao) {
    return NextResponse.json({ error: "DAO not configured" }, { status: 404 });
  }

  const { proposalId } = await params;
  const proposal = await loadProposalById(dao.slug, proposalId);

  if (!proposal) {
    return NextResponse.json({ error: "Proposal not found" }, { status: 404 });
  }

  return NextResponse.json({ proposal });
}
