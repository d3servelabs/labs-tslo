import { useState, useEffect } from "react";
import { createPublicClient, http, parseAbiItem, formatUnits } from "viem";
import { get, set } from "idb-keyval";
import { DaoConfig, Proposal, ProposalState } from "@/lib/types";
import { extractAbstract } from "@/lib/format";

const proposalCreatedEvent = parseAbiItem(
  "event ProposalCreated(uint256 proposalId, address proposer, address[] targets, uint256[] values, string[] signatures, bytes[] calldatas, uint256 voteStart, uint256 voteEnd, string description)"
);
const voteCastEvent = parseAbiItem(
  "event VoteCast(address indexed voter, uint256 proposalId, uint8 support, uint256 weight, string reason)"
);

const defaultRpcUrls: Record<number, string> = {
  1: "https://eth-mainnet.public.blastapi.io"
};

function getClient(chainId: number) {
  const rpcUrl = defaultRpcUrls[chainId];
  if (!rpcUrl) throw new Error(`No RPC configured for chain ${chainId}.`);
  return createPublicClient({ transport: http(rpcUrl) });
}

function formatDate(timestamp: bigint) { return new Date(Number(timestamp) * 1000).toISOString(); }
function formatVoteValue(value: bigint) { const number = Number(formatUnits(value, 18)); return Number.isFinite(number) ? number : 0; }
function slugify(value: string) { return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, ""); }
function extractTitle(description: string, fallbackId: string) {
  const firstLine = description.split("\n").map((line) => line.trim()).find(Boolean);
  return firstLine ? firstLine.replace(/^#+\s*/, "") : `Proposal ${fallbackId}`;
}
function extractSummary(description: string, title: string) {
  const abstract = extractAbstract(description);
  if (abstract) return abstract.slice(0, 300);
  const lines = description.split("\n").map((line) => line.trim()).filter(Boolean).filter((line) => line.replace(/^#+\s*/, "") !== title);
  return lines[0] ?? description.slice(0, 180);
}
function buildActionSummary(signature: string | undefined, target: string) { return `${signature || "call()"} on ${target}`; }
function inferPartialState(latestBlock: bigint, voteStart: bigint, voteEnd: bigint): ProposalState {
  if (latestBlock < voteStart) return "pending";
  if (latestBlock <= voteEnd) return "active";
  return "expired";
}

export function useDaoSync(dao: DaoConfig, initialStartBlock: number) {
  const [proposals, setProposals] = useState<Proposal[]>(dao.proposals || []);
  const [isSyncing, setIsSyncing] = useState(true);
  const [progress, setProgress] = useState({ scanned: 0, total: 1, startBlock: initialStartBlock, latestBlock: initialStartBlock });

  useEffect(() => {
    let mounted = true;

    async function sync() {
      try {
        const client = getClient(dao.chainId);
        const cacheKey = `tslo_logs_${dao.chainId}_${dao.contracts.governor.toLowerCase()}`;
        
        let cachedData = await get(cacheKey);
        if (!cachedData) cachedData = { lastBlock: initialStartBlock.toString(), proposalLogs: [], voteLogs: [] };
        
        const latestBlock = await client.getBlockNumber();
        const fromBlock = BigInt(cachedData.lastBlock);
        
        // Ensure fromBlock isn't completely out of sync bounds (e.g. if cache starts way before initialStartBlock)
        const effectiveFromBlock = fromBlock < BigInt(initialStartBlock) ? BigInt(initialStartBlock) : fromBlock;
        
        const effectiveScanned = Math.max(0, Number(effectiveFromBlock) - initialStartBlock);
        
        setProgress(p => ({ 
          ...p, 
          latestBlock: Number(latestBlock), 
          total: Number(latestBlock) - initialStartBlock,
          scanned: effectiveScanned
        }));

        let newProposalLogs: any[] = [];
        let newVoteLogs: any[] = [];

        if (effectiveFromBlock < latestBlock) {
          let currentFromBlock = effectiveFromBlock;
          // Most free RPCs allow 100k or 50k blocks; using 49999 to be safe and fast
          const BATCH_SIZE = BigInt(49999);

          while (currentFromBlock <= latestBlock && mounted) {
            const currentToBlock = currentFromBlock + BATCH_SIZE > latestBlock ? latestBlock : currentFromBlock + BATCH_SIZE;

            const [pLogs, vLogs] = await Promise.all([
              client.getLogs({
                address: dao.contracts.governor as `0x${string}`,
                event: proposalCreatedEvent,
                fromBlock: currentFromBlock,
                toBlock: currentToBlock
              }),
              client.getLogs({
                address: dao.contracts.governor as `0x${string}`,
                event: voteCastEvent,
                fromBlock: currentFromBlock,
                toBlock: currentToBlock
              })
            ]);
            
            const pLogsMapped = pLogs.map(log => ({
              ...log,
              args: {
                ...log.args,
                proposalId: log.args.proposalId?.toString(),
                values: log.args.values?.map((v: bigint) => v.toString()),
                voteStart: log.args.voteStart?.toString(),
                voteEnd: log.args.voteEnd?.toString()
              },
              blockNumber: log.blockNumber?.toString()
            }));

            const vLogsMapped = vLogs.map(log => ({
              ...log,
              args: {
                ...log.args,
                proposalId: log.args.proposalId?.toString(),
                weight: log.args.weight?.toString()
              },
              blockNumber: log.blockNumber?.toString()
            }));

            newProposalLogs.push(...pLogsMapped);
            newVoteLogs.push(...vLogsMapped);

            cachedData = {
              lastBlock: currentToBlock.toString(),
              proposalLogs: [...cachedData.proposalLogs, ...pLogsMapped],
              voteLogs: [...cachedData.voteLogs, ...vLogsMapped]
            };

            await set(cacheKey, cachedData);
            
            if (mounted) {
              setProgress(p => ({ ...p, scanned: Number(currentToBlock) - initialStartBlock }));
            }

            currentFromBlock = currentToBlock + BigInt(1);
          }
        }

        if (!mounted) return;

        // Build proposals
        const blockCache = new Map<string, Promise<bigint>>();
        function getBlockTimestamp(blockNumberStr: string) {
          const existing = blockCache.get(blockNumberStr);
          if (existing) return existing;
          const next = client.getBlock({ blockNumber: BigInt(blockNumberStr) }).then((block) => block.timestamp);
          blockCache.set(blockNumberStr, next);
          return next;
        }

        const voteStatsMap = new Map();
        for (const log of cachedData.voteLogs) {
          const pid = log.args.proposalId;
          if (!voteStatsMap.has(pid)) {
            voteStatsMap.set(pid, { for: BigInt(0), against: BigInt(0), abstain: BigInt(0), voters: new Set(), voteList: [] });
          }
          const bucket = voteStatsMap.get(pid);
          const support = Number(log.args.support);
          const weight = BigInt(log.args.weight);
          if (support === 0) bucket.against += weight;
          else if (support === 1) bucket.for += weight;
          else bucket.abstain += weight;
          bucket.voters.add(log.args.voter);
          
          bucket.voteList.push({
            voter: log.args.voter,
            support: support === 0 ? "against" : support === 1 ? "for" : "abstain",
            weight: formatVoteValue(weight),
            timestamp: await getBlockTimestamp(log.blockNumber).then(formatDate)
          });
        }

        const newProposals = await Promise.all(
          cachedData.proposalLogs.map(async (log: any) => {
            const args = log.args;
            const createdAt = formatDate(await getBlockTimestamp(log.blockNumber));
            const title = extractTitle(args.description, args.proposalId);
            const stats = voteStatsMap.get(args.proposalId);
            const forVotes = stats ? formatVoteValue(stats.for) : 0;
            const againstVotes = stats ? formatVoteValue(stats.against) : 0;
            const abstainVotes = stats ? formatVoteValue(stats.abstain) : 0;
            const totalVotes = forVotes + againstVotes + abstainVotes;

            return {
              id: args.proposalId,
              title,
              slug: `${slugify(title)}-${args.proposalId.slice(-6)}`,
              summary: extractSummary(args.description, title),
              state: inferPartialState(latestBlock, BigInt(args.voteStart), BigInt(args.voteEnd)),
              proposer: args.proposer,
              createdAt,
              votingStartsAt: createdAt,
              votingEndsAt: createdAt,
              description: args.description,
              turnout: 0,
              votes: { for: forVotes, against: againstVotes, abstain: abstainVotes, quorum: 0 },
              totalVotes,
              voterCount: stats ? stats.voters.size : 0,
              actions: args.targets.map((target: string, index: number) => ({
                target,
                value: args.values[index],
                signature: args.signatures[index] || "call()",
                calldata: args.calldatas[index],
                summary: buildActionSummary(args.signatures[index], target)
              })),
              timeline: [{ label: "Created", timestamp: createdAt, complete: true, note: "ProposalCreated event loaded from the governor.", icon: "plus", actor: args.proposer }],
              voters: stats ? stats.voteList : [],
              loadStatus: { isPartial: false, message: "Client synced.", estimate: "" }
            } as Proposal;
          })
        );

        newProposals.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
        
        if (!mounted) return;
        setProgress(p => ({ ...p, scanned: Number(latestBlock) - initialStartBlock }));
        setProposals(newProposals);
      } catch (err) {
        console.error("Failed to sync dao logs", err);
      } finally {
        if (mounted) setIsSyncing(false);
      }
    }

    sync();

    return () => { mounted = false; };
  }, [dao.chainId, dao.contracts.governor, initialStartBlock]);

  return { proposals, isSyncing, progress };
}
