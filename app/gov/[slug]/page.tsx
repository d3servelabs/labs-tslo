import { notFound } from "next/navigation";

import { DaoOverview } from "@/components/dao-overview";
import { getSiteMode } from "@/lib/config";
import { getActiveDataAdapterKind, loadDaoBySlug } from "@/lib/data-adapter";

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
  const dao = await loadDaoBySlug(slug);
  const adapterKind = getActiveDataAdapterKind();

  if (!dao) {
    notFound();
  }

  return <DaoOverview dao={dao} apiBasePath={`/api/daos/${dao.slug}`} adapterKind={adapterKind} />;
}
