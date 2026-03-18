import { cache } from "react";
import { createPublicClient, formatUnits, http, parseAbiItem } from "viem";

import {
  getConfiguredDaoInputs,
  getConfiguredDaos,
  getDaoBySlug as getConfiguredDaoBySlug
} from "@/lib/config";
import { extractAbstract } from "@/lib/format";
import { DaoConfig, Proposal, ProposalState } from "@/lib/types";

const proposalCreatedEvent = parseAbiItem(
  "event ProposalCreated(uint256 proposalId, address proposer, address[] targets, uint256[] values, string[] signatures, bytes[] calldatas, uint256 voteStart, uint256 voteEnd, string description)"
);

const governorReadAbi = [
  {
    inputs: [{ internalType: "uint256", name: "proposalId", type: "uint256" }],
    name: "state",
    outputs: [{ internalType: "enum IGovernor.ProposalState", name: "", type: "uint8" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [{ internalType: "uint256", name: "proposalId", type: "uint256" }],
    name: "proposalVotes",
    outputs: [
      { internalType: "uint256", name: "againstVotes", type: "uint256" },
      { internalType: "uint256", name: "forVotes", type: "uint256" },
      { internalType: "uint256", name: "abstainVotes", type: "uint256" }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [{ internalType: "uint256", name: "proposalId", type: "uint256" }],
    name: "proposalSnapshot",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [{ internalType: "uint256", name: "proposalId", type: "uint256" }],
    name: "proposalDeadline",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [{ internalType: "uint256", name: "timepoint", type: "uint256" }],
    name: "quorum",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function"
  }
] as const;

const defaultRpcUrls: Record<number, string> = {
  1: "https://eth-mainnet.public.blastapi.io"
};

type ProposalLogEntry = {
  proposalId: bigint;
  proposer: `0x${string}`;
  targets: readonly `0x${string}`[];
  values: readonly bigint[];
  signatures: readonly string[];
  calldatas: readonly `0x${string}`[];
  voteStart: bigint;
  voteEnd: bigint;
  description: string;
  createdAt: string;
  blockNumber: bigint;
  latestBlock: bigint;
  title: string;
  summary: string;
};

type ScanResult = {
  entries: ProposalLogEntry[];
  startBlock: number;
  latestBlock: number;
};

function getRpcUrl(chainId: number) {
  const envKey = `TSLO_RPC_URL_${chainId}`;
  const envValue = process.env[envKey];
  return envValue ?? defaultRpcUrls[chainId];
}

function getClient(chainId: number) {
  const rpcUrl = getRpcUrl(chainId);

  if (!rpcUrl) {
    throw new Error(`No RPC configured for chain ${chainId}.`);
  }

  return createPublicClient({
    transport: http(rpcUrl)
  });
}

function mapProposalState(state: number): ProposalState {
  switch (state) {
    case 0:
      return "pending";
    case 1:
      return "active";
    case 2:
      return "canceled";
    case 3:
      return "defeated";
    case 4:
      return "succeeded";
    case 5:
      return "queued";
    case 6:
      return "expired";
    case 7:
      return "executed";
    default:
      return "pending";
  }
}

function inferPartialState(latestBlock: bigint, voteStart: bigint, voteEnd: bigint): ProposalState {
  if (latestBlock < voteStart) {
    return "pending";
  }

  if (latestBlock <= voteEnd) {
    return "active";
  }

  return "expired";
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function extractTitle(description: string, fallbackId: string) {
  const firstLine = description
    .split("\n")
    .map((line) => line.trim())
    .find(Boolean);

  if (!firstLine) {
    return `Proposal ${fallbackId}`;
  }

  return firstLine.replace(/^#+\s*/, "");
}

function extractSummary(description: string, title: string) {
  const abstract = extractAbstract(description);

  if (abstract) {
    return abstract.slice(0, 300);
  }

  const lines = description
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => line.replace(/^#+\s*/, "") !== title);

  return lines[0] ?? description.slice(0, 180);
}

function formatDate(timestamp: bigint) {
  return new Date(Number(timestamp) * 1000).toISOString();
}

function formatVoteValue(value: bigint) {
  const number = Number(formatUnits(value, 18));
  return Number.isFinite(number) ? number : 0;
}

function buildActionSummary(signature: string | undefined, target: string) {
  return `${signature || "call()"} on ${target}`;
}

function buildPartialProposal(entry: ProposalLogEntry): Proposal {
  return {
    id: entry.proposalId.toString(),
    title: entry.title,
    slug: `${slugify(entry.title)}-${entry.proposalId.toString().slice(-6)}`,
    summary: entry.summary,
    state: inferPartialState(entry.latestBlock, entry.voteStart, entry.voteEnd),
    proposer: entry.proposer,
    createdAt: entry.createdAt,
    votingStartsAt: entry.createdAt,
    votingEndsAt: entry.createdAt,
    description: entry.description,
    turnout: 0,
    votes: {
      for: 0,
      against: 0,
      abstain: 0,
      quorum: 0
    },
    actions: entry.targets.map((target, index) => ({
      target,
      value: entry.values[index].toString(),
      signature: entry.signatures[index] || "call()",
      calldata: entry.calldatas[index],
      summary: buildActionSummary(entry.signatures[index], target)
    })),
    timeline: [
      {
        label: "Created",
        timestamp: entry.createdAt,
        complete: true,
        note: "ProposalCreated event loaded from the governor."
      }
    ],
    loadStatus: {
      isPartial: true,
      message: "Proposal list data is loaded, but vote tallies, quorum, and final outcome are still pending a deeper RPC read.",
      estimate:
        "Expect about 7 additional RPC reads for a full proposal detail load: 5 contract reads and 2 block lookups."
    }
  };
}

function buildActivity(proposals: Proposal[]) {
  return proposals.slice(0, 3).map((proposal) => ({
    label:
      proposal.state === "active"
        ? "Voting active"
        : proposal.state === "pending"
          ? "Proposal scheduled"
          : "Proposal discovered",
    timestamp: proposal.createdAt,
    detail: proposal.summary
  }));
}

function buildDaoStats(baseDao: DaoConfig, proposals: Proposal[]) {
  const turnoutValues = proposals.map((proposal) => proposal.turnout).filter((value) => value > 0);
  const turnoutAverage =
    turnoutValues.length > 0
      ? turnoutValues.reduce((total, value) => total + value, 0) / turnoutValues.length
      : 0;

  return {
    ...baseDao.stats,
    totalProposals: proposals.length,
    activeProposals: proposals.filter((proposal) => proposal.state === "active").length,
    turnoutAverage
  };
}

function formatBlockRange(startBlock: number, latestBlock: number) {
  const total = latestBlock - startBlock;
  const scanned = total;

  return { scanned, total, progress: 100 };
}

function buildDaoLoadEstimate(proposalCount: number, startBlock: number, latestBlock: number) {
  const totalDetailReads = proposalCount * 7;
  const blockRange = latestBlock - startBlock;

  if (proposalCount === 0) {
    return `Scanned ${blockRange.toLocaleString()} blocks (${startBlock.toLocaleString()} to ${latestBlock.toLocaleString()}). No proposals discovered.`;
  }

  return `Scanned ${blockRange.toLocaleString()} blocks. Found ${proposalCount} proposals. Hydrating each takes ~7 RPC reads (${totalDetailReads} total).`;
}

async function loadProposalEntries(dao: DaoConfig, configStartBlock?: number): Promise<ScanResult> {
  const client = getClient(dao.chainId);
  const latestBlock = await client.getBlockNumber();
  const fromBlock = configStartBlock ?? 0;
  const proposalLogs = await client.getLogs({
    address: dao.contracts.governor as `0x${string}`,
    event: proposalCreatedEvent,
    fromBlock: BigInt(fromBlock),
    toBlock: "latest"
  });

  const blockCache = new Map<bigint, Promise<bigint>>();

  function getBlockTimestamp(blockNumber: bigint) {
    const existing = blockCache.get(blockNumber);
    if (existing) {
      return existing;
    }

    const next = client.getBlock({ blockNumber }).then((block) => block.timestamp);
    blockCache.set(blockNumber, next);
    return next;
  }

  const entries = await Promise.all(
    proposalLogs.map(async (log) => {
      const args = log.args as {
        proposalId: bigint;
        proposer: `0x${string}`;
        targets: readonly `0x${string}`[];
        values: readonly bigint[];
        signatures: readonly string[];
        calldatas: readonly `0x${string}`[];
        voteStart: bigint;
        voteEnd: bigint;
        description: string;
      };

      const createdAt = formatDate(await getBlockTimestamp(log.blockNumber ?? BigInt(0)));
      const title = extractTitle(args.description, args.proposalId.toString());

      return {
        ...args,
        createdAt,
        blockNumber: log.blockNumber ?? BigInt(0),
        latestBlock,
        title,
        summary: extractSummary(args.description, title)
      } satisfies ProposalLogEntry;
    })
  );

  return {
    entries: entries.sort((left, right) => right.createdAt.localeCompare(left.createdAt)),
    startBlock: fromBlock,
    latestBlock: Number(latestBlock)
  };
}

async function loadProposalDetail(dao: DaoConfig, entry: ProposalLogEntry) {
  const client = getClient(dao.chainId);
  const blockCache = new Map<bigint, Promise<bigint>>();

  function getBlockTimestamp(blockNumber: bigint) {
    const existing = blockCache.get(blockNumber);
    if (existing) {
      return existing;
    }

    const next = client.getBlock({ blockNumber }).then((block) => block.timestamp);
    blockCache.set(blockNumber, next);
    return next;
  }

  const [snapshotBlock, deadlineBlock, rawState, votesTuple, quorumValue] = await Promise.all([
    client.readContract({
      address: dao.contracts.governor as `0x${string}`,
      abi: governorReadAbi,
      functionName: "proposalSnapshot",
      args: [entry.proposalId]
    }),
    client.readContract({
      address: dao.contracts.governor as `0x${string}`,
      abi: governorReadAbi,
      functionName: "proposalDeadline",
      args: [entry.proposalId]
    }),
    client.readContract({
      address: dao.contracts.governor as `0x${string}`,
      abi: governorReadAbi,
      functionName: "state",
      args: [entry.proposalId]
    }),
    client.readContract({
      address: dao.contracts.governor as `0x${string}`,
      abi: governorReadAbi,
      functionName: "proposalVotes",
      args: [entry.proposalId]
    }),
    client.readContract({
      address: dao.contracts.governor as `0x${string}`,
      abi: governorReadAbi,
      functionName: "quorum",
      args: [entry.voteStart]
    })
  ]);

  const [againstVotes, forVotes, abstainVotes] = votesTuple;
  const [snapshotTimestamp, deadlineTimestamp] = await Promise.all([
    getBlockTimestamp(snapshotBlock),
    getBlockTimestamp(deadlineBlock)
  ]);
  const totalVotes = forVotes + againstVotes + abstainVotes;
  const turnout =
    Number(quorumValue) > 0 ? Math.min((Number(totalVotes) / Number(quorumValue)) * 100, 999) : 0;

  return {
    id: entry.proposalId.toString(),
    title: entry.title,
    slug: `${slugify(entry.title)}-${entry.proposalId.toString().slice(-6)}`,
    summary: entry.summary,
    state: mapProposalState(Number(rawState)),
    proposer: entry.proposer,
    createdAt: entry.createdAt,
    votingStartsAt: formatDate(snapshotTimestamp),
    votingEndsAt: formatDate(deadlineTimestamp),
    description: entry.description,
    turnout,
    votes: {
      for: formatVoteValue(forVotes),
      against: formatVoteValue(againstVotes),
      abstain: formatVoteValue(abstainVotes),
      quorum: formatVoteValue(quorumValue)
    },
    actions: entry.targets.map((target, index) => ({
      target,
      value: entry.values[index].toString(),
      signature: entry.signatures[index] || "call()",
      calldata: entry.calldatas[index],
      summary: buildActionSummary(entry.signatures[index], target)
    })),
    timeline: [
      {
        label: "Created",
        timestamp: entry.createdAt,
        complete: true,
        note: "ProposalCreated event emitted by the governor."
      },
      {
        label: "Voting opens",
        timestamp: formatDate(snapshotTimestamp),
        complete: true,
        note: `Snapshot block ${snapshotBlock.toString()}.`
      },
      {
        label: "Voting closes",
        timestamp: formatDate(deadlineTimestamp),
        complete: mapProposalState(Number(rawState)) !== "pending" && mapProposalState(Number(rawState)) !== "active",
        note: `Deadline block ${deadlineBlock.toString()}.`
      }
    ]
  } satisfies Proposal;
}

const getCachedScanResult = cache(async (slug: string) => {
  const dao = getConfiguredDaoBySlug(slug);

  if (!dao) {
    return undefined;
  }

  const configuredInput = getConfiguredDaoInputs().find((entry) => entry.slug === slug);
  return loadProposalEntries(dao, configuredInput?.startBlock);
});

export const getLiveDaoBySlug = cache(async (slug: string) => {
  const dao = getConfiguredDaoBySlug(slug);

  if (!dao) {
    return undefined;
  }

  try {
    const scanResult = await getCachedScanResult(slug);
    const entries = scanResult?.entries ?? [];
    const proposals = entries.map(buildPartialProposal);
    const startBlock = scanResult?.startBlock ?? 0;
    const latestBlock = scanResult?.latestBlock ?? 0;
    const estimate = buildDaoLoadEstimate(proposals.length, startBlock, latestBlock);
    const { scanned, total, progress } = formatBlockRange(startBlock, latestBlock);

    return {
      ...dao,
      proposals,
      activity: buildActivity(proposals),
      stats: buildDaoStats(dao, proposals),
      loadStatus: {
        isPartial: true,
        message:
          `Discovered ${proposals.length} proposals across ${total.toLocaleString()} blocks. Vote tallies and final outcomes load when you open a proposal.`,
        estimate,
        progress,
        scannedBlocks: scanned,
        totalBlocks: total
      },
      supportNotes:
        `TSLO scanned blocks ${startBlock.toLocaleString()}–${latestBlock.toLocaleString()} via public JSON-RPC. Proposal details hydrate on demand.`
    } satisfies DaoConfig;
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown error";

    return {
      ...dao,
      activity: [],
      proposals: [],
      stats: buildDaoStats(dao, []),
      loadStatus: {
        isPartial: true,
        message: `RPC scan incomplete: ${message}`,
        estimate:
          "Public RPC retries can take tens of seconds. Proposal totals and list data will appear once the log scan succeeds.",
        progress: 0
      },
      supportNotes: `Live public JSON-RPC loading is still in progress or failed on this request: ${message}`
    } satisfies DaoConfig;
  }
});

export const getLiveConfiguredDaos = cache(async () => {
  const daos = getConfiguredDaos();
  return Promise.all(daos.map((dao) => getLiveDaoBySlug(dao.slug).then((liveDao) => liveDao ?? dao)));
});

export async function getLivePrimaryDao() {
  const daos = getConfiguredDaos();

  if (daos.length === 0) {
    return undefined;
  }

  return getLiveDaoBySlug(daos[0].slug);
}

export const getLiveProposalById = cache(async (slug: string, proposalId: string) => {
  const dao = getConfiguredDaoBySlug(slug);

  if (!dao) {
    return undefined;
  }

  try {
    const scanResult = await getCachedScanResult(slug);
    const entry = scanResult?.entries.find((candidate) => {
      const id = candidate.proposalId.toString();
      const entrySlug = `${slugify(candidate.title)}-${id.slice(-6)}`;
      const normalizedProposalId = proposalId.toLowerCase();

      return id.toLowerCase() === normalizedProposalId || entrySlug.toLowerCase() === normalizedProposalId;
    });

    if (!entry) {
      return undefined;
    }

    return await loadProposalDetail(dao, entry);
  } catch (error) {
    const scanResult = await getCachedScanResult(slug).catch(() => undefined);
    const entry = scanResult?.entries.find((candidate) => {
      const id = candidate.proposalId.toString();
      const entrySlug = `${slugify(candidate.title)}-${id.slice(-6)}`;
      const normalizedProposalId = proposalId.toLowerCase();

      return id.toLowerCase() === normalizedProposalId || entrySlug.toLowerCase() === normalizedProposalId;
    });

    if (!entry) {
      return undefined;
    }

    const proposal = buildPartialProposal(entry);
    const message = error instanceof Error ? error.message : "unknown error";

    return {
      ...proposal,
      loadStatus: {
        isPartial: true,
        message: `This proposal is only partially hydrated because the detailed RPC reads did not complete: ${message}`,
        estimate:
          "Retrying the detail page should complete after about 7 additional RPC reads if the public endpoint responds."
      }
    } satisfies Proposal;
  }
});
