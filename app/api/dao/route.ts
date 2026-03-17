import { NextResponse } from "next/server";

import { getPrimaryDao, getSiteMode } from "@/lib/config";
import { getLivePrimaryDao } from "@/lib/live";

export const dynamic = "force-dynamic";

export async function GET() {
  if (getSiteMode() !== "single") {
    return NextResponse.json({ error: "Single DAO route unavailable in this mode" }, { status: 404 });
  }

  return NextResponse.json({ dao: (await getLivePrimaryDao()) ?? getPrimaryDao() });
}
