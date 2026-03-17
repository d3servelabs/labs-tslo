import { NextResponse } from "next/server";

import { getConfiguredDaos, getSiteMode } from "@/lib/config";

export const dynamic = "force-dynamic";

export function GET() {
  if (getSiteMode() === "single") {
    return NextResponse.json({ error: "Use /api/dao in single-DAO mode." }, { status: 404 });
  }

  return NextResponse.json({
    daos: getConfiguredDaos().map((dao) => ({
      slug: dao.slug,
      name: dao.name,
      shortName: dao.shortName,
      chainId: dao.chainId,
      chainName: dao.chainName,
      governanceType: dao.governanceType,
      governanceVersion: dao.governanceVersion,
      capabilityFlags: dao.capabilityFlags,
      stats: dao.stats
    }))
  });
}
