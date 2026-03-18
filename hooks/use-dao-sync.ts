import { useState, useEffect } from "react";
import { createPublicClient, http, parseAbiItem, formatUnits } from "viem";
import { get as idbGet, set as idbSet } from "idb-keyval";
import { DaoConfig, Proposal, ProposalState } from "@/lib/types";
import { extractAbstract } from "@/lib/format";

// Wrapper for idb-keyval that falls back to localStorage if IndexedDB is completely broken (e.g. Arc/Chrome corruption bug)
async function get(key: string): Promise<any> {
  try {
    return await idbGet(key);
  } catch (err) {
    console.warn("IndexedDB get failed, falling back to localStorage", err);
    try {
      const val = localStorage.getItem(key);
      return val ? JSON.parse(val) : undefined;
    } catch (lsErr) {
      console.warn("localStorage get also failed", lsErr);
      return undefined;
    }
  }
}

async function set(key: string, val: any): Promise<void> {
  try {
    await idbSet(key, val);
  } catch (err) {
    console.warn("IndexedDB set failed, falling back to localStorage", err);
    try {
      localStorage.setItem(key, JSON.stringify(val));
    } catch (lsErr) {
      console.warn("localStorage set also failed, likely quota exceeded", lsErr);
    }
  }
}

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

function mergeRanges(ranges: [bigint, bigint][]): [bigint, bigint][] {
  if (ranges.length === 0) return [];
  // Sort by start block ascending
  ranges.sort((a, b) => a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0);
  const merged: [bigint, bigint][] = [ranges[0]];
  for (let i = 1; i < ranges.length; i++) {
    const current = ranges[i];
    const lastMerged = merged[merged.length - 1];
    // If they overlap or are adjacent (e.g., [1, 10] and [11, 20])
    if (current[0] <= lastMerged[1] + BigInt(1)) {
      lastMerged[1] = current[1] > lastMerged[1] ? current[1] : lastMerged[1];
    } else {
      merged.push(current);
    }
  }
  return merged;
}

function calculateScannedBlocks(ranges: [bigint, bigint][], start: bigint, end: bigint): bigint {
  let scanned = BigInt(0);
  for (const r of ranges) {
    const overlapStart = r[0] > start ? r[0] : start;
    const overlapEnd = r[1] < end ? r[1] : end;
    if (overlapStart <= overlapEnd) {
      scanned += (overlapEnd - overlapStart + BigInt(1));
    }
  }
  return scanned;
}

async function buildProposalsList(proposalLogs: any[], voteLogs: any[], latestBlock: bigint, client: any) {
  const blockCache = new Map<string, Promise<bigint>>();
  function getBlockTimestamp(blockNumberStr: string) {
    const existing = blockCache.get(blockNumberStr);
    if (existing) return existing;
    const next = client.getBlock({ blockNumber: BigInt(blockNumberStr) }).then((block: any) => block.timestamp);
    blockCache.set(blockNumberStr, next);
    return next;
  }

  const voteStatsMap = new Map();
  for (const log of voteLogs) {
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
      timestamp: "" // We don't need accurate timestamps for individual votes (not shown in UI), avoiding 10,000+ RPC calls
    });
  }

  // Build proposals sequentially to avoid hitting RPC rate limits with concurrent getBlock calls
  const newProposals = [];
  for (const log of proposalLogs) {
    const args = log.args;
    const createdAt = formatDate(await getBlockTimestamp(log.blockNumber));
    const title = extractTitle(args.description, args.proposalId);
    const stats = voteStatsMap.get(args.proposalId);
    const forVotes = stats ? formatVoteValue(stats.for) : 0;
    const againstVotes = stats ? formatVoteValue(stats.against) : 0;
    const abstainVotes = stats ? formatVoteValue(stats.abstain) : 0;
    const totalVotes = forVotes + againstVotes + abstainVotes;

    newProposals.push({
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
    } as Proposal);
  }

  newProposals.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return newProposals;
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
        
        let cachedData: any = await get(cacheKey);
        
        // Migration from lastBlock -> syncedRanges
        if (cachedData && cachedData.lastBlock && !cachedData.syncedRanges) {
          cachedData.syncedRanges = [[initialStartBlock.toString(), cachedData.lastBlock]];
          delete cachedData.lastBlock;
        }
        
        if (!cachedData) cachedData = { syncedRanges: [], proposalLogs: [], voteLogs: [] };
        if (!cachedData.syncedRanges) cachedData.syncedRanges = [];
        
        const latestBlock = await client.getBlockNumber();
        const targetStartBlock = BigInt(initialStartBlock);

        // **INITIAL UI UPDATE**: Immediately show proposals from cache before syncing completes
        if (cachedData.proposalLogs.length > 0 && mounted) {
           const cachedProposals = await buildProposalsList(cachedData.proposalLogs, cachedData.voteLogs, latestBlock, client);
           if (mounted) setProposals(cachedProposals);
        }
        
        let mergedRanges: [bigint, bigint][] = cachedData.syncedRanges.map((r: [string, string]) => [BigInt(r[0]), BigInt(r[1])]);
        
        const effectiveScanned = calculateScannedBlocks(mergedRanges, targetStartBlock, latestBlock);
        
        setProgress(p => ({ 
          ...p, 
          latestBlock: Number(latestBlock), 
          total: Number(latestBlock - targetStartBlock + BigInt(1)),
          scanned: Number(effectiveScanned)
        }));

        let newProposalLogs: any[] = [];
        let newVoteLogs: any[] = [];

        let cursor = latestBlock;
        // Most free RPCs allow 100k or 50k blocks; using 49999 to be safe and fast
        const BATCH_SIZE = BigInt(49999);

        // Simple rate limiter state
        let rateLimitDelay = 1000; // start with 1s delay on failure
        let consecutiveErrors = 0;

        while (cursor >= targetStartBlock && mounted) {
          // Check if cursor is already inside a synced range
          // Find if cursor is strictly within or exactly touching a synced range
          const encompassingRange = mergedRanges.find(r => cursor >= r[0] && cursor <= r[1]);
          if (encompassingRange) {
            cursor = encompassingRange[0] - BigInt(1);
            continue;
          }

          let toBlock = cursor;
          let fromBlock = toBlock - BATCH_SIZE + BigInt(1);
          if (fromBlock < targetStartBlock) fromBlock = targetStartBlock;

          // Prevent overlap with the nearest lower synced range
          // Find the highest synced range that is below toBlock
          const lowerRanges = mergedRanges.filter(r => r[1] < toBlock);
          if (lowerRanges.length > 0) {
            // Get the maximum end block of all ranges that are strictly below our toBlock
            const highestLowerEnd = lowerRanges.reduce((max, r) => r[1] > max ? r[1] : max, BigInt(0));
            if (fromBlock <= highestLowerEnd) {
              fromBlock = highestLowerEnd + BigInt(1);
            }
          }

          if (fromBlock > toBlock) {
            cursor = fromBlock - BigInt(1);
            continue;
          }

          try {
            // Add a small delay between batches to respect rate limits (BlastAPI public: ~40 req/sec)
            await new Promise(resolve => setTimeout(resolve, 300));

            const [pLogs, vLogs] = await Promise.all([
              client.getLogs({
                address: dao.contracts.governor as `0x${string}`,
                event: proposalCreatedEvent,
                fromBlock,
                toBlock
              }),
              client.getLogs({
                address: dao.contracts.governor as `0x${string}`,
                event: voteCastEvent,
                fromBlock,
                toBlock
              })
            ]);
            
            const pLogsMapped = pLogs.map(log => ({
              args: {
                proposalId: log.args.proposalId?.toString(),
                proposer: log.args.proposer,
                targets: log.args.targets,
                values: log.args.values?.map((v: bigint) => v.toString()),
                signatures: log.args.signatures,
                calldatas: log.args.calldatas,
                voteStart: log.args.voteStart?.toString(),
                voteEnd: log.args.voteEnd?.toString(),
                description: log.args.description
              },
              blockNumber: log.blockNumber?.toString()
            }));

            const vLogsMapped = vLogs.map(log => ({
              args: {
                proposalId: log.args.proposalId?.toString(),
                voter: log.args.voter,
                support: log.args.support,
                weight: log.args.weight?.toString(),
                reason: log.args.reason
              },
              blockNumber: log.blockNumber?.toString()
            }));

            newProposalLogs.push(...pLogsMapped);
            newVoteLogs.push(...vLogsMapped);

            mergedRanges.push([fromBlock, toBlock]);
            mergedRanges = mergeRanges(mergedRanges);

            cachedData = {
              syncedRanges: mergedRanges.map(r => [r[0].toString(), r[1].toString()]),
              proposalLogs: [...cachedData.proposalLogs, ...pLogsMapped],
              voteLogs: [...cachedData.voteLogs, ...vLogsMapped]
            };

            await set(cacheKey, cachedData);
            
            if (mounted) {
              const currentScanned = calculateScannedBlocks(mergedRanges, targetStartBlock, latestBlock);
              setProgress(p => ({ ...p, scanned: Number(currentScanned) }));
            }

            cursor = fromBlock - BigInt(1);
            
            // Reset error state on success
            rateLimitDelay = 1000;
            consecutiveErrors = 0;

          } catch (error: any) {
            console.warn(`RPC error fetching logs (from ${fromBlock} to ${toBlock}):`, error.message);
            consecutiveErrors++;
            
            if (consecutiveErrors > 5) {
              console.error("Too many consecutive RPC errors. Aborting sync.");
              break; // Give up after 5 retries
            }
            
            // Exponential backoff
            console.log(`Waiting ${rateLimitDelay}ms before retrying...`);
            await new Promise(resolve => setTimeout(resolve, rateLimitDelay));
            rateLimitDelay *= 2; 
            
            // Do NOT advance cursor; the loop will retry the same block range
          }

          // **INCREMENTAL UI UPDATE**: Update the proposals state incrementally during the sync loop
          // instead of waiting until the entire blockchain is scanned.
          if (cachedData.proposalLogs.length > 0 && mounted) {
             const currentProposals = buildProposalsList(cachedData.proposalLogs, cachedData.voteLogs, latestBlock, client);
             // We don't await the whole build to avoid completely blocking the sync loop, 
             // but we fire off an update so it populates as blocks are fetched.
             currentProposals.then(newProposals => {
               if (mounted) setProposals(newProposals);
             });
          }
        }

        if (!mounted) return;

        // Build proposals at the very end to ensure it's fully synced
        const finalProposals = await buildProposalsList(cachedData.proposalLogs, cachedData.voteLogs, latestBlock, client);
        
        if (!mounted) return;
        const finalScanned = calculateScannedBlocks(mergedRanges, targetStartBlock, latestBlock);
        setProgress(p => ({ ...p, scanned: Number(finalScanned) }));
        setProposals(finalProposals);
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
