import { NextResponse } from "next/server";

import { getSiteMode } from "@/lib/config";
import { loadPrimaryDao } from "@/lib/data-adapter";

export const dynamic = "force-dynamic";

export async function GET() {
  if (getSiteMode() !== "single") {
    return NextResponse.json({ error: "Single DAO route unavailable in this mode" }, { status: 404 });
  }

  return NextResponse.json({ dao: await loadPrimaryDao() });
}
