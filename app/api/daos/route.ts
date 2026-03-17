import { NextResponse } from "next/server";

import { getSiteMode } from "@/lib/config";
import { getDataAdapter } from "@/lib/data-adapter";

export const dynamic = "force-dynamic";

export async function GET() {
  if (getSiteMode() === "single") {
    return NextResponse.json({ error: "Use /api/dao in single-DAO mode." }, { status: 404 });
  }

  const adapter = getDataAdapter();
  const daos = await adapter.getDaos();

  return NextResponse.json({
    daos: daos.map((dao) => ({
      slug: dao.slug,
      name: dao.name,
      shortName: dao.shortName,
      chainId: dao.chainId,
      chainName: dao.chainName,
      governanceType: dao.governanceType,
      governanceVersion: dao.governanceVersion,
      capabilityFlags: dao.capabilityFlags,
      stats: dao.stats,
      loadStatus: dao.loadStatus
    })),
    adapter: adapter.kind
  });
}
