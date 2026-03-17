import { NextResponse } from "next/server";

import { getSiteMode } from "@/lib/config";
import { loadDaoBySlug } from "@/lib/data-adapter";

export const dynamic = "force-dynamic";

export async function GET(_: Request, { params }: { params: Promise<{ slug: string }> }) {
  if (getSiteMode() === "single") {
    return NextResponse.json({ error: "Use /api/dao in single-DAO mode." }, { status: 404 });
  }

  const { slug } = await params;
  const dao = await loadDaoBySlug(slug);

  if (!dao) {
    return NextResponse.json({ error: "DAO not found" }, { status: 404 });
  }

  return NextResponse.json({ dao });
}
