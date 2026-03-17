import tsloConfig from "@/tslo.config";
import { getFixtureDaoBySlug, getFixtureDaos, getFixtureProposalById } from "@/lib/data";
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
  const fixture =
    getFixtureDaoBySlug(dao.slug) ??
    getFixtureDaos().find(
      (candidate) =>
        candidate.contracts.governor.toLowerCase() === dao.governorAddress.toLowerCase()
    );

  if (!fixture) {
    return {
      slug: dao.slug,
      name: dao.name,
      shortName: dao.name,
      tagline: "Configured DAO awaiting governance data.",
      description:
        "TSLO found a DAO configuration but does not yet have fixture or indexed governance data for it.",
      chainId: dao.chainId,
      chainName: dao.chainName,
      governanceType: "Configured Governor",
      governanceVersion: "Pending detection",
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
        "This DAO is configured, but TSLO still needs a live query or indexing adapter before governance history can be shown."
    };
  }

  return {
    ...fixture,
    slug: dao.slug,
    name: dao.name,
    brandColor: dao.branding?.accentColor ?? fixture.brandColor,
    contracts: {
      governor: dao.governorAddress,
      token: dao.tokenAddress,
      timelock: dao.timelockAddress ?? fixture.contracts.timelock
    },
    links: {
      website: dao.officialSiteUrl,
      forum: dao.forumUrl ?? fixture.links.forum,
      docs: dao.docsUrl ?? fixture.links.docs,
      treasury:
        dao.treasuryUrl ??
        fixture.links.treasury ??
        (dao.timelockAddress ? `https://etherscan.io/address/${dao.timelockAddress}` : dao.officialSiteUrl)
    }
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

  return getFixtureProposalById(slug, proposalId);
}
