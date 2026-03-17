import tsloConfig from "@/tslo.config";
import { DaoConfig, TsloDaoConfigInput } from "@/lib/types";

export type TsloMode = "setup" | "single" | "multi";

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normalizeDaoInput(dao: TsloDaoConfigInput, daoCount: number) {
  const slug = dao.slug ?? slugify(dao.name);

  if (daoCount > 1 && !dao.slug) {
    throw new Error(`DAO "${dao.name}" is missing a slug in multi-DAO mode.`);
  }

  return { ...dao, slug };
}

function mergeConfiguredDao(dao: ReturnType<typeof normalizeDaoInput>): DaoConfig {
  return {
    slug: dao.slug,
    name: dao.name,
    shortName: dao.branding?.logoText ?? dao.name,
    tagline: `Live governance data from ${dao.chainName}.`,
    description: `${dao.name} governance activity is loaded directly from the configured Governor contract over public JSON-RPC.`,
    chainId: dao.chainId,
    chainName: dao.chainName,
    governanceType: "Governor-compatible",
    governanceVersion: "Live RPC",
    brandColor: dao.branding?.accentColor ?? "#0f766e",
    capabilityFlags: [],
    contracts: {
      governor: dao.governorAddress,
      token: dao.tokenAddress,
      timelock: dao.timelockAddress
    },
    links: {
      website: dao.officialSiteUrl,
      forum: dao.forumUrl ?? dao.officialSiteUrl,
      docs: dao.docsUrl ?? tsloConfig.docsUrl,
      treasury: dao.treasuryUrl ?? (dao.timelockAddress
        ? `https://etherscan.io/address/${dao.timelockAddress}`
        : dao.officialSiteUrl)
    },
    stats: {
      totalProposals: 0,
      activeProposals: 0,
      delegates: 0,
      tokenHolders: 0,
      turnoutAverage: 0
    },
    delegates: [],
    activity: [],
    proposals: [],
    supportNotes:
      "TSLO loads proposal history from public JSON-RPC. Delegate and token-holder stats remain unindexed."
  };
}

export function getTsloConfig() {
  return tsloConfig;
}

export function getSiteMode(): TsloMode {
  if (tsloConfig.daos.length === 0) {
    return "setup";
  }

  if (tsloConfig.daos.length === 1) {
    return "single";
  }

  return "multi";
}

export function getConfiguredDaos() {
  const normalized = tsloConfig.daos.map((dao) => normalizeDaoInput(dao, tsloConfig.daos.length));
  const unique = new Set(normalized.map((dao) => dao.slug));

  if (unique.size !== normalized.length) {
    throw new Error("DAO slugs must be unique.");
  }

  return normalized.map(mergeConfiguredDao);
}

export function getConfiguredDaoInputs() {
  const normalized = tsloConfig.daos.map((dao) => normalizeDaoInput(dao, tsloConfig.daos.length));
  const unique = new Set(normalized.map((dao) => dao.slug));

  if (unique.size !== normalized.length) {
    throw new Error("DAO slugs must be unique.");
  }

  return normalized;
}

export function getPrimaryDao() {
  return getConfiguredDaos()[0];
}

export function getDaoBySlug(slug: string) {
  return getConfiguredDaos().find((dao) => dao.slug === slug);
}

export function getProposalById(slug: string, proposalId: string) {
  const configuredDao = getDaoBySlug(slug);

  if (configuredDao) {
    return configuredDao.proposals.find(
      (proposal) =>
        proposal.id.toLowerCase() === proposalId.toLowerCase() ||
        proposal.slug.toLowerCase() === proposalId.toLowerCase()
    );
  }
}
