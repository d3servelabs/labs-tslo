import { http, createPublicClient, formatUnits, parseAbiItem } from "viem";

import {
  getConfiguredDaoInputs,
  getConfiguredDaos,
  getDaoBySlug as getConfiguredDaoBySlug
} from "@/lib/config";
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

const maxLogRangeByChain: Record<number, bigint> = {
};

function getRpcUrl(chainId: number) {
  const envKey = `TSLO_RPC_URL_${chainId}`;
  const envValue = process.env[envKey];
  return envValue ?? defaultRpcUrls[chainId];
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

async function loadOnchainProposals(dao: DaoConfig, startBlock?: number) {
  const rpcUrl = getRpcUrl(dao.chainId);

  if (!rpcUrl) {
    throw new Error(`No RPC configured for chain ${dao.chainId}.`);
  }

  const client = createPublicClient({
    transport: http(rpcUrl)
  });

  const latestBlock = await client.getBlockNumber();
  const fromBlock = BigInt(startBlock ?? 0);
  const rangeSize = maxLogRangeByChain[dao.chainId];
  const proposalLogs = [];

  if (rangeSize) {
    for (let chunkStart = fromBlock; chunkStart <= latestBlock; chunkStart += rangeSize + BigInt(1)) {
      const chunkEnd = chunkStart + rangeSize > latestBlock ? latestBlock : chunkStart + rangeSize;
      const logs = await client.getLogs({
        address: dao.contracts.governor as `0x${string}`,
        event: proposalCreatedEvent,
        fromBlock: chunkStart,
        toBlock: chunkEnd
      });
      proposalLogs.push(...logs);
    }
  } else {
    const logs = await client.getLogs({
      address: dao.contracts.governor as `0x${string}`,
      event: proposalCreatedEvent,
      fromBlock,
      toBlock: "latest"
    });
    proposalLogs.push(...logs);
  }

  const blockCache = new Map<bigint, Promise<{ timestamp: bigint }>>();

  function getBlockTimestamp(blockNumber: bigint) {
    const existing = blockCache.get(blockNumber);
    if (existing) {
      return existing;
    }

    const next = client.getBlock({ blockNumber }).then((block) => ({
      timestamp: block.timestamp
    }));
    blockCache.set(blockNumber, next);
    return next;
  }

  const proposals = await Promise.all(
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

      const proposalId = args.proposalId.toString();
      const title = extractTitle(args.description, proposalId);
      const summary = extractSummary(args.description, title);
      const [createdBlock, snapshotBlock, deadlineBlock, rawState, votesTuple, quorumValue] =
        await Promise.all([
          getBlockTimestamp(log.blockNumber ?? BigInt(0)),
          client.readContract({
            address: dao.contracts.governor as `0x${string}`,
            abi: governorReadAbi,
            functionName: "proposalSnapshot",
            args: [args.proposalId]
          }),
          client.readContract({
            address: dao.contracts.governor as `0x${string}`,
            abi: governorReadAbi,
            functionName: "proposalDeadline",
            args: [args.proposalId]
          }),
          client.readContract({
            address: dao.contracts.governor as `0x${string}`,
            abi: governorReadAbi,
            functionName: "state",
            args: [args.proposalId]
          }),
          client.readContract({
            address: dao.contracts.governor as `0x${string}`,
            abi: governorReadAbi,
            functionName: "proposalVotes",
            args: [args.proposalId]
          }),
          client.readContract({
            address: dao.contracts.governor as `0x${string}`,
            abi: governorReadAbi,
            functionName: "quorum",
            args: [args.voteStart]
          })
        ]);

      const [againstVotes, forVotes, abstainVotes] = votesTuple;
      const snapshotTimestamp = (await getBlockTimestamp(snapshotBlock)).timestamp;
      const deadlineTimestamp = (await getBlockTimestamp(deadlineBlock)).timestamp;
      const totalVotes = forVotes + againstVotes + abstainVotes;
      const turnout = Number(quorumValue) > 0 ? Math.min((Number(totalVotes) / Number(quorumValue)) * 100, 999) : 0;

      const proposal: Proposal = {
        id: proposalId,
        title,
        slug: `${slugify(title)}-${proposalId.slice(-6)}`,
        summary,
        state: mapProposalState(Number(rawState)),
        proposer: args.proposer,
        createdAt: formatDate(createdBlock.timestamp),
        votingStartsAt: formatDate(snapshotTimestamp),
        votingEndsAt: formatDate(deadlineTimestamp),
        description: args.description,
        turnout,
        votes: {
          for: formatVoteValue(forVotes),
          against: formatVoteValue(againstVotes),
          abstain: formatVoteValue(abstainVotes),
          quorum: formatVoteValue(quorumValue)
        },
        actions: args.targets.map((target, index) => ({
          target,
          value: args.values[index].toString(),
          signature: args.signatures[index] || "call()",
          calldata: args.calldatas[index],
          summary: `${args.signatures[index] || "call()"} on ${target}`
        })),
        timeline: [
          {
            label: "Created",
            timestamp: formatDate(createdBlock.timestamp),
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
      };

      return proposal;
    })
  );

  return proposals.sort((left, right) => right.createdAt.localeCompare(left.createdAt));
}

function buildActivity(proposals: Proposal[]) {
  return proposals.slice(0, 3).map((proposal) => ({
    label:
      proposal.state === "queued"
        ? "Proposal queued"
        : proposal.state === "executed"
          ? "Proposal executed"
          : "Proposal created",
    timestamp: proposal.createdAt,
    detail: proposal.summary
  }));
}

export async function getLiveDaoBySlug(slug: string) {
  const dao = getConfiguredDaoBySlug(slug);

  if (!dao) {
    return undefined;
  }

  try {
    const configuredInput = getConfiguredDaoInputs().find((entry) => entry.slug === slug);
    const proposals = await loadOnchainProposals(dao, configuredInput?.startBlock);

    return {
      ...dao,
      proposals,
      activity: buildActivity(proposals),
      stats: {
        ...dao.stats,
        totalProposals: proposals.length,
        activeProposals: proposals.filter((proposal) => proposal.state === "active").length
      },
      supportNotes: `Live proposal data loaded from ${dao.chainName} Governor contract. Delegate and token-holder stats remain placeholder until a broader adapter is added.`
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown error";

    return {
      ...dao,
      supportNotes: `Fell back to fixture governance data because live RPC reads failed: ${message}`
    };
  }
}

export async function getLivePrimaryDao() {
  const daos = getConfiguredDaos();

  if (daos.length === 0) {
    return undefined;
  }

  return getLiveDaoBySlug(daos[0].slug);
}

export async function getLiveProposalById(slug: string, proposalId: string) {
  const dao = await getLiveDaoBySlug(slug);
  return dao?.proposals.find(
    (proposal) =>
      proposal.id.toLowerCase() === proposalId.toLowerCase() ||
      proposal.slug.toLowerCase() === proposalId.toLowerCase()
  );
}
