import { NextResponse } from "next/server";

import { getDaoBySlug } from "@/lib/data";

export async function GET(_: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const dao = getDaoBySlug(slug);

  if (!dao) {
    return NextResponse.json({ error: "DAO not found" }, { status: 404 });
  }

  return NextResponse.json({ dao });
}
