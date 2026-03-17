import { NextResponse } from "next/server";

import { getDaoBySlug, getSiteMode } from "@/lib/config";
import { getLiveDaoBySlug } from "@/lib/live";

export const dynamic = "force-dynamic";

export async function GET(_: Request, { params }: { params: Promise<{ slug: string }> }) {
  if (getSiteMode() === "single") {
    return NextResponse.json({ error: "Use /api/dao in single-DAO mode." }, { status: 404 });
  }

  const { slug } = await params;
  const dao = (await getLiveDaoBySlug(slug)) ?? getDaoBySlug(slug);

  if (!dao) {
    return NextResponse.json({ error: "DAO not found" }, { status: 404 });
  }

  return NextResponse.json({ dao });
}
