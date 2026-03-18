import { cache } from "react";
import { createPublicClient, formatUnits, http, parseAbiItem } from "viem";

import {
  getConfiguredDaoInputs,
  getConfiguredDaos,
  getDaoBySlug as getConfiguredDaoBySlug
} from "@/lib/config";
import { extractAbstract } from "@/lib/format";
import { DaoConfig, Proposal, ProposalState, TimelineStep } from "@/lib/types";

const proposalCreatedEvent = parseAbiItem(
  "event ProposalCreated(uint256 proposalId, address proposer, address[] targets, uint256[] values, string[] signatures, bytes[] calldatas, uint256 voteStart, uint256 voteEnd, string description)"
);

const voteCastEvent = parseAbiItem(
  "event VoteCast(address indexed voter, uint256 proposalId, uint8 support, uint256 weight, string reason)"
);

const proposalQueuedEvent = parseAbiItem("event ProposalQueued(uint256 proposalId, uint256 etaSeconds)");
const proposalExecutedEvent = parseAbiItem("event ProposalExecuted(uint256 proposalId)");

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
  voteStats?: {
    forVotes: bigint;
    againstVotes: bigint;
    abstainVotes: bigint;
    voterCount: number;
  };
};

type ProposalExecutionRecord = {
  queuedAt?: string;
  executedAt?: string;
  queueTxHash?: `0x${string}`;
  executionTxHash?: `0x${string}`;
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

function buildVoteStats(proposalIds: bigint[], voteLogs: readonly any[]) {
  const voteMap = new Map<
    string,
    { forVotes: bigint; againstVotes: bigint; abstainVotes: bigint; voters: Set<string> }
  >();

  for (const proposalId of proposalIds) {
    voteMap.set(proposalId.toString(), {
      forVotes: BigInt(0),
      againstVotes: BigInt(0),
      abstainVotes: BigInt(0),
      voters: new Set<string>()
    });
  }

  for (const log of voteLogs) {
    const proposalId = log.args?.proposalId?.toString();
    if (!proposalId) {
      continue;
    }

    const bucket = voteMap.get(proposalId);
    if (!bucket) {
      continue;
    }

    const support = Number(log.args.support);
    const weight = BigInt(log.args.weight ?? BigInt(0));
    const voter = (log.args.voter as string | undefined)?.toLowerCase();

    if (support === 0) {
      bucket.againstVotes += weight;
    } else if (support === 1) {
      bucket.forVotes += weight;
    } else {
      bucket.abstainVotes += weight;
    }

    if (voter) {
      bucket.voters.add(voter);
    }
  }

  return voteMap;
}

function buildPartialProposal(entry: ProposalLogEntry): Proposal {
  const forVotes = entry.voteStats ? formatVoteValue(entry.voteStats.forVotes) : 0;
  const againstVotes = entry.voteStats ? formatVoteValue(entry.voteStats.againstVotes) : 0;
  const abstainVotes = entry.voteStats ? formatVoteValue(entry.voteStats.abstainVotes) : 0;
  const quorum = 0;
  const totalVotes = forVotes + againstVotes + abstainVotes;

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
      for: forVotes,
      against: againstVotes,
      abstain: abstainVotes,
      quorum
    },
    totalVotes,
    voterCount: entry.voteStats?.voterCount ?? 0,
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
        note: "ProposalCreated event loaded from the governor.",
        icon: "plus",
        actor: entry.proposer
      }
    ],
    voters: [],
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
  const total = Math.max(0, latestBlock - startBlock);
  const scanned = 0; // Let client component handle scanned value based on indexeddb cache

  return { scanned, total, progress: 0 };
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
  
  // We skip loading logs on the server to prevent heavy RPC queries
  // The client will fetch and cache them in IndexedDB.
  const proposalLogs: any[] = [];
  const voteLogs: any[] = [];

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

  const voteStatsMap = buildVoteStats(
    proposalLogs.map((proposalLog) => (proposalLog.args as { proposalId: bigint }).proposalId),
    voteLogs
  );

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
      const voteStats = voteStatsMap.get(args.proposalId.toString());

      return {
        ...args,
        createdAt,
        blockNumber: log.blockNumber ?? BigInt(0),
        latestBlock,
        title,
        summary: extractSummary(args.description, title),
        voteStats: voteStats
          ? {
              forVotes: voteStats.forVotes,
              againstVotes: voteStats.againstVotes,
              abstainVotes: voteStats.abstainVotes,
              voterCount: voteStats.voters.size
            }
          : undefined
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
  const proposalState = mapProposalState(Number(rawState));
  const [snapshotTimestamp, deadlineTimestamp] = await Promise.all([
    getBlockTimestamp(snapshotBlock),
    getBlockTimestamp(deadlineBlock)
  ]);
  const totalVotes = forVotes + againstVotes + abstainVotes;
  const turnout =
    Number(quorumValue) > 0 ? Math.min((Number(totalVotes) / Number(quorumValue)) * 100, 999) : 0;

  let voteLogs: any[] = [];
  let queuedLogs: any[] = [];
  let executedLogs: any[] = [];
  try {
    [voteLogs, queuedLogs, executedLogs] = await Promise.all([
      client.getLogs({
        address: dao.contracts.governor as `0x${string}`,
        event: voteCastEvent,
        fromBlock: entry.blockNumber,
        toBlock: "latest"
      }),
      client.getLogs({
        address: dao.contracts.governor as `0x${string}`,
        event: proposalQueuedEvent,
        fromBlock: entry.blockNumber,
        toBlock: "latest"
      }),
      client.getLogs({
        address: dao.contracts.governor as `0x${string}`,
        event: proposalExecutedEvent,
        fromBlock: entry.blockNumber,
        toBlock: "latest"
      })
    ]);
  } catch (error) {
    console.warn("Could not fetch all proposal lifecycle logs:", error);
  }

  const proposalVoteLogs = voteLogs.filter((log) => log.args.proposalId === entry.proposalId);
  const proposalQueuedLogs = queuedLogs.filter((log) => log.args.proposalId === entry.proposalId);
  const proposalExecutedLogs = executedLogs.filter((log) => log.args.proposalId === entry.proposalId);
  const queuedLog = proposalQueuedLogs[proposalQueuedLogs.length - 1];
  const executedLog = proposalExecutedLogs[proposalExecutedLogs.length - 1];

  const executionRecord: ProposalExecutionRecord = {};
  if (queuedLog?.blockNumber !== undefined) {
    executionRecord.queuedAt = formatDate(await getBlockTimestamp(queuedLog.blockNumber));
    executionRecord.queueTxHash = queuedLog.transactionHash;
  }
  if (executedLog?.blockNumber !== undefined) {
    executionRecord.executedAt = formatDate(await getBlockTimestamp(executedLog.blockNumber));
    executionRecord.executionTxHash = executedLog.transactionHash;
  }

  const voters = await Promise.all(
    proposalVoteLogs.map(async (log) => {
      const timestamp = await getBlockTimestamp(log.blockNumber);
      return {
        voter: log.args.voter,
        support: log.args.support === 0 ? "against" : log.args.support === 1 ? "for" : "abstain",
        weight: formatVoteValue(log.args.weight),
        timestamp: formatDate(timestamp)
      };
    })
  );

  const meetsQuorum = quorumValue > BigInt(0) && totalVotes >= quorumValue;
  const passed = proposalState === "succeeded" || proposalState === "queued" || proposalState === "executed";
  const timeline: TimelineStep[] = [
    {
      label: "Created",
      timestamp: entry.createdAt,
      complete: true,
      note: "ProposalCreated event emitted by the governor.",
      icon: "plus",
      actor: entry.proposer
    },
    {
      label: "Voting opens",
      timestamp: formatDate(snapshotTimestamp),
      complete: true,
      note: `Snapshot block ${snapshotBlock.toString()}.`,
      icon: "play"
    },
    {
      label: "Voting closes",
      timestamp: formatDate(deadlineTimestamp),
      complete: proposalState !== "pending" && proposalState !== "active",
      note: `Deadline block ${deadlineBlock.toString()}.`,
      icon: "stop"
    }
  ];

  if (proposalState !== "pending" && proposalState !== "active") {
    timeline.push({
      label: passed
        ? "Proposal passed"
        : proposalState === "defeated" && !meetsQuorum
          ? "Expired (quorum not met)"
          : proposalState === "expired"
            ? "Expired"
            : proposalState === "canceled"
              ? "Proposal canceled"
              : "Proposal rejected",
      timestamp: formatDate(deadlineTimestamp),
      complete: true,
      note: passed
        ? "Majority and quorum requirements were met."
        : proposalState === "defeated" && !meetsQuorum
          ? "The vote ended without meeting quorum."
          : "The proposal did not pass governance checks.",
      icon: passed ? "success" : "defeat"
    });
  }

  if (executionRecord.queuedAt) {
    timeline.push({
      label: "Proposal queued",
      timestamp: executionRecord.queuedAt,
      complete: true,
      note: "Queue transaction submitted to timelock.",
      icon: "publish"
    });
  }

  if (executionRecord.executedAt) {
    timeline.push({
      label: "Proposal executed",
      timestamp: executionRecord.executedAt,
      complete: true,
      note: "Execution transaction mined.",
      icon: "execute"
    });
  }

  return {
    id: entry.proposalId.toString(),
    title: entry.title,
    slug: `${slugify(entry.title)}-${entry.proposalId.toString().slice(-6)}`,
    summary: entry.summary,
    state: proposalState,
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
    totalVotes: formatVoteValue(totalVotes),
    voterCount: voters.length,
    actions: entry.targets.map((target, index) => ({
      target,
      value: entry.values[index].toString(),
      signature: entry.signatures[index] || "call()",
      calldata: entry.calldatas[index],
      summary: buildActionSummary(entry.signatures[index], target)
    })),
    timeline,
    executionTxHash: executionRecord.executionTxHash,
    queueTxHash: executionRecord.queueTxHash,
    voters: voters as any
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
        totalBlocks: total,
        startBlock,
        latestBlock
      },
      supportNotes:
        `TSLO scanned blocks ${startBlock.toLocaleString()}–${latestBlock.toLocaleString()} via public JSON-RPC. Proposal details hydrate on demand.`
    } satisfies DaoConfig;
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown error";
    const configuredInput = getConfiguredDaoInputs().find((entry) => entry.slug === slug);
    const startBlock = configuredInput?.startBlock ?? 0;

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
        progress: 0,
        scannedBlocks: 0,
        totalBlocks: 1,
        startBlock,
        latestBlock: startBlock
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
