import { cache } from "react";

import { getConfiguredDaos } from "@/lib/config";
import { getFixtureDaoBySlug, getFixtureDaos } from "@/lib/data";
import {
  getLiveConfiguredDaos,
  getLiveDaoBySlug,
  getLivePrimaryDao,
  getLiveProposalById
} from "@/lib/live";
import { DaoConfig, Proposal } from "@/lib/types";

export type DataAdapterKind = "fixture" | "live" | "indexer";

export interface IDataAdapter {
  readonly kind: DataAdapterKind;
  getDaos(): Promise<DaoConfig[]>;
  getPrimaryDao(): Promise<DaoConfig | undefined>;
  getDaoBySlug(slug: string): Promise<DaoConfig | undefined>;
  getProposalById(slug: string, proposalId: string): Promise<Proposal | undefined>;
}

function findProposal(dao: DaoConfig | undefined, proposalId: string) {
  return dao?.proposals.find(
    (proposal) =>
      proposal.id.toLowerCase() === proposalId.toLowerCase() ||
      proposal.slug.toLowerCase() === proposalId.toLowerCase()
  );
}

function mergeFixtureDao(baseDao: DaoConfig) {
  const fixture =
    getFixtureDaoBySlug(baseDao.slug) ??
    getFixtureDaos().find(
      (candidate) =>
        candidate.contracts.governor.toLowerCase() === baseDao.contracts.governor.toLowerCase()
    );

  if (!fixture) {
    return {
      ...baseDao,
      supportNotes: "Fixture adapter selected, but no fixture dataset matched this DAO."
    } satisfies DaoConfig;
  }

  return {
    ...fixture,
    slug: baseDao.slug,
    name: baseDao.name,
    shortName: baseDao.shortName,
    tagline: baseDao.tagline,
    description: baseDao.description,
    chainId: baseDao.chainId,
    chainName: baseDao.chainName,
    brandColor: baseDao.brandColor,
    contracts: {
      ...fixture.contracts,
      ...baseDao.contracts
    },
    links: {
      ...fixture.links,
      ...baseDao.links
    },
    supportNotes: "Loaded from fixture governance data."
  } satisfies DaoConfig;
}

const fixtureAdapter: IDataAdapter = {
  kind: "fixture",
  async getDaos() {
    return getConfiguredDaos().map(mergeFixtureDao);
  },
  async getPrimaryDao() {
    return (await fixtureAdapter.getDaos())[0];
  },
  async getDaoBySlug(slug: string) {
    return (await fixtureAdapter.getDaos()).find((dao) => dao.slug === slug);
  },
  async getProposalById(slug: string, proposalId: string) {
    return findProposal(await fixtureAdapter.getDaoBySlug(slug), proposalId);
  }
};

const liveAdapter: IDataAdapter = {
  kind: "live",
  async getDaos() {
    return getLiveConfiguredDaos();
  },
  async getPrimaryDao() {
    return getLivePrimaryDao();
  },
  async getDaoBySlug(slug: string) {
    return getLiveDaoBySlug(slug);
  },
  async getProposalById(slug: string, proposalId: string) {
    return getLiveProposalById(slug, proposalId);
  }
};

function buildIndexerTodoDao(baseDao: DaoConfig) {
  return {
    ...baseDao,
    loadStatus: {
      isPartial: true,
      message: "Indexer adapter is not implemented yet. This DAO is using the placeholder PostgreSQL-backed adapter shell.",
      estimate: "TODO: replace this estimate once the PostgreSQL indexer exists."
    },
    supportNotes:
      "Indexer adapter selected, but the PostgreSQL implementation is still TODO. Falling back to configured DAO metadata only."
  } satisfies DaoConfig;
}

const indexerAdapter: IDataAdapter = {
  kind: "indexer",
  async getDaos() {
    return getConfiguredDaos().map(buildIndexerTodoDao);
  },
  async getPrimaryDao() {
    return (await indexerAdapter.getDaos())[0];
  },
  async getDaoBySlug(slug: string) {
    return (await indexerAdapter.getDaos()).find((dao) => dao.slug === slug);
  },
  async getProposalById(slug: string, proposalId: string) {
    return findProposal(await indexerAdapter.getDaoBySlug(slug), proposalId);
  }
};

function getRequestedAdapterKind(): DataAdapterKind {
  const configured = process.env.TSLO_DATA_ADAPTER?.toLowerCase();

  if (configured === "fixture" || configured === "indexer" || configured === "live") {
    return configured;
  }

  return "live";
}

export const getDataAdapter = cache((): IDataAdapter => {
  const kind = getRequestedAdapterKind();

  switch (kind) {
    case "fixture":
      return fixtureAdapter;
    case "indexer":
      return indexerAdapter;
    case "live":
    default:
      return liveAdapter;
  }
});

export function getActiveDataAdapterKind() {
  return getDataAdapter().kind;
}

export async function loadDaos() {
  return getDataAdapter().getDaos();
}

export async function loadPrimaryDao() {
  return getDataAdapter().getPrimaryDao();
}

export async function loadDaoBySlug(slug: string) {
  return getDataAdapter().getDaoBySlug(slug);
}

export async function loadProposalById(slug: string, proposalId: string) {
  return getDataAdapter().getProposalById(slug, proposalId);
}
