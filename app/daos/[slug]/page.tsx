import { notFound } from "next/navigation";

import { DaoOverview } from "@/components/dao-overview";
import { getDaoBySlug, getSiteMode } from "@/lib/config";
import { getLiveDaoBySlug } from "@/lib/live";

export const dynamic = "force-dynamic";

export default async function DaoPage({
  params
}: {
  params: Promise<{ slug: string }>;
}) {
  if (getSiteMode() === "single") {
    notFound();
  }

  const { slug } = await params;
  const dao = (await getLiveDaoBySlug(slug)) ?? getDaoBySlug(slug);

  if (!dao) {
    notFound();
  }

  return <DaoOverview dao={dao} apiBasePath={`/api/daos/${dao.slug}`} />;
}
