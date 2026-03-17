import { NextResponse } from "next/server";

import { getDaos } from "@/lib/data";

export function GET() {
  return NextResponse.json({
    daos: getDaos().map((dao) => ({
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
