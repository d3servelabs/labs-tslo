import { useState, useEffect } from "react";
import { createPublicClient, http, parseAbiItem, formatUnits } from "viem";
import { get as idbGet, set as idbSet, clear as idbClear } from "idb-keyval";
import { DaoConfig, Proposal, ProposalState } from "@/lib/types";
import { extractAbstract } from "@/lib/format";

// Wrapper for idb-keyval that attempts to clear and reset IndexedDB if it gets corrupted
async function get(key: string): Promise<any> {
  try {
    return await idbGet(key);
  } catch (err) {
    console.warn("IndexedDB get failed, attempting to clear and reset...", err);
    try {
      await idbClear();
      return undefined;
    } catch (clearErr) {
      console.error("IndexedDB is completely locked/broken, falling back to memory.", clearErr);
      return undefined;
    }
  }
}

async function set(key: string, val: any): Promise<void> {
  try {
    await idbSet(key, val);
  } catch (err) {
    console.warn("IndexedDB set failed, attempting to clear and reset...", err);
    try {
      await idbClear();
      await idbSet(key, val);
    } catch (clearErr) {
      console.error("IndexedDB is completely locked/broken, unable to persist cache.", clearErr);
    }
  }
}

const proposalCreatedEvent = parseAbiItem(
  "event ProposalCreated(uint256 proposalId, address proposer, address[] targets, uint256[] values, string[] signatures, bytes[] calldatas, uint256 voteStart, uint256 voteEnd, string description)"
);
const voteCastEvent = parseAbiItem(
  "event VoteCast(address indexed voter, uint256 proposalId, uint8 support, uint256 weight, string reason)"
);
const proposalQueuedEvent = parseAbiItem(
  "event ProposalQueued(uint256 proposalId, uint256 etaSeconds)"
);
const proposalExecutedEvent = parseAbiItem(
  "event ProposalExecuted(uint256 proposalId)"
);
const proposalExtendedEvent = parseAbiItem(
  "event ProposalExtended(uint256 proposalId, uint64 extendedDeadline)"
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

async function buildProposalsList(
  proposalLogs: any[], 
  voteLogs: any[], 
  queuedLogs: any[], 
  executedLogs: any[], 
  extendedLogs: any[], 
  latestBlock: bigint, 
  client: any,
  blockTimestampsCache: Record<string, string>,
  dao: DaoConfig
) {
  let isDirty = false;
  const blockCache = new Map<string, Promise<bigint>>();
  async function getBlockTimestamp(blockNumberStr: string) {
    if (blockTimestampsCache[blockNumberStr]) return BigInt(blockTimestampsCache[blockNumberStr]);
    const existing = blockCache.get(blockNumberStr);
    if (existing) return existing;
    const next = client.getBlock({ blockNumber: BigInt(blockNumberStr) }).then((block: any) => {
      blockTimestampsCache[blockNumberStr] = block.timestamp.toString();
      isDirty = true;
      return block.timestamp;
    });
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

  const queuedMap = new Map();
  if (queuedLogs) {
    for (const log of queuedLogs) {
      queuedMap.set(log.args.proposalId, log);
    }
  }

  const executedMap = new Map();
  if (executedLogs) {
    for (const log of executedLogs) {
      executedMap.set(log.args.proposalId, log);
    }
  }

  const extendedMap = new Map();
  if (extendedLogs) {
    for (const log of extendedLogs) {
      extendedMap.set(log.args.proposalId, log);
    }
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

    const queuedLog = queuedMap.get(args.proposalId);
    const executedLog = executedMap.get(args.proposalId);
    const extendedLog = extendedMap.get(args.proposalId);
    const queuedAt = queuedLog ? formatDate(await getBlockTimestamp(queuedLog.blockNumber)) : undefined;
    const executedAt = executedLog ? formatDate(await getBlockTimestamp(executedLog.blockNumber)) : undefined;
    const extendedAt = extendedLog ? formatDate(await getBlockTimestamp(extendedLog.blockNumber)) : undefined;

    let derivedState: ProposalState = inferPartialState(latestBlock, BigInt(args.voteStart), extendedLog ? BigInt(extendedLog.args.extendedDeadline) : BigInt(args.voteEnd));
    if (executedLog) {
      derivedState = "executed";
    } else if (queuedLog) {
      derivedState = "queued";
    }

    const timeline = [];
    timeline.push({ label: "Created", timestamp: createdAt, complete: true, note: "ProposalCreated event loaded from the governor.", icon: "plus", actor: args.proposer });

    const voteStartStr = args.voteStart.toString();
    const voteEndStr = extendedLog ? extendedLog.args.extendedDeadline.toString() : args.voteEnd.toString();
    const voteStartBlock = BigInt(voteStartStr);
    const voteEndBlock = BigInt(voteEndStr);

    let voteStartAt = "";
    if (voteStartBlock <= latestBlock) {
       voteStartAt = formatDate(await getBlockTimestamp(voteStartStr));
       timeline.push({ label: "Voting opens", timestamp: voteStartAt, complete: true, note: `Snapshot block ${voteStartStr}.`, icon: "play" });
    } else {
       voteStartAt = formatDate(BigInt(Math.floor(Date.now() / 1000)) + (voteStartBlock - latestBlock) * BigInt(12));
    }

    if (extendedLog) {
       timeline.push({ label: "Vote extended", timestamp: extendedAt!, complete: true, note: `Deadline extended to block ${voteEndStr}.`, icon: "plus" });
    }

    let voteEndAt = "";
    if (voteEndBlock <= latestBlock) {
       voteEndAt = formatDate(await getBlockTimestamp(voteEndStr));
       timeline.push({ label: "Voting closes", timestamp: voteEndAt, complete: true, note: `Deadline block ${voteEndStr}.`, icon: "stop" });
       
       const quorum = dao.parameters?.quorumNeeded ? Number(dao.parameters.quorumNeeded) : 0;
       const meetsQuorum = totalVotes >= quorum;
       const majorityReached = forVotes > againstVotes && totalVotes > 0;
       
       const isPassed = majorityReached && meetsQuorum;
       
       let finalLabel = "";
       let finalNote = "";
       let finalIcon = "";
       
       if (isPassed) {
         finalLabel = "Passed";
         finalNote = "Reached quorum and majority.";
         finalIcon = "check";
       } else if (!meetsQuorum) {
         finalLabel = "Expired without a Quorum";
         finalNote = "Did not meet quorum requirements.";
         finalIcon = "expired"; // grey icon
       } else {
         finalLabel = "Rejected";
         finalNote = "Did not reach majority.";
         finalIcon = "defeat"; // red cross
       }

       timeline.push({
         label: finalLabel,
         timestamp: voteEndAt,
         complete: true,
         note: finalNote,
         icon: finalIcon
       });
       
       if (!executedLog && !queuedLog && derivedState === "expired") {
          if (isPassed) {
            derivedState = "succeeded";
          } else {
            derivedState = "defeated";
          }
       }
    } else {
       voteEndAt = formatDate(BigInt(Math.floor(Date.now() / 1000)) + (voteEndBlock - latestBlock) * BigInt(12));
    }

    if (queuedLog) {
       timeline.push({ label: "Proposal queued", timestamp: queuedAt!, complete: true, note: "Queue transaction submitted to timelock.", icon: "publish" });
    }
    if (executedLog) {
       timeline.push({ label: "Proposal executed", timestamp: executedAt!, complete: true, note: "Execution transaction mined.", icon: "execute" });
    }

    newProposals.push({
      id: args.proposalId,
      title,
      slug: `${slugify(title)}-${args.proposalId.slice(-6)}`,
      summary: extractSummary(args.description, title),
      state: derivedState,
      proposer: args.proposer,
      createdAt,
      votingStartsAt: voteStartAt || createdAt,
      votingEndsAt: voteEndAt || createdAt,
      description: args.description,
      turnout: 0,
      votes: { for: forVotes, against: againstVotes, abstain: abstainVotes, quorum: dao.parameters?.quorumNeeded ? Number(dao.parameters.quorumNeeded) : 0 },
      totalVotes,
      voterCount: stats ? stats.voters.size : 0,
      actions: args.targets.map((target: string, index: number) => ({
        target,
        value: args.values[index],
        signature: args.signatures[index] || "call()",
        calldata: args.calldatas[index],
        summary: buildActionSummary(args.signatures[index], target)
      })),
      timeline,
      voters: stats ? stats.voteList : [],
      loadStatus: { isPartial: false, message: "Client synced.", estimate: "" }
    } as Proposal);
  }

  newProposals.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return { proposals: newProposals, isDirty };
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
        
        if (!cachedData) cachedData = { syncedRanges: [], proposalLogs: [], voteLogs: [], queuedLogs: [], executedLogs: [], extendedLogs: [], blockTimestampsCache: {}, computedProposals: null };
        if (!cachedData.syncedRanges) cachedData.syncedRanges = [];
        if (!cachedData.queuedLogs) cachedData.queuedLogs = [];
        if (!cachedData.executedLogs) cachedData.executedLogs = [];
        if (!cachedData.extendedLogs) cachedData.extendedLogs = [];
        if (!cachedData.blockTimestampsCache) cachedData.blockTimestampsCache = {};

        const latestBlock = await client.getBlockNumber();
        const targetStartBlock = BigInt(initialStartBlock);

        // **INITIAL UI UPDATE**: Immediately show proposals from cache before syncing completes
        if (cachedData.computedProposals && mounted) {
           setProposals(cachedData.computedProposals);
        } else if (cachedData.proposalLogs.length > 0 && mounted) {
           const { proposals: cachedProposals, isDirty } = await buildProposalsList(cachedData.proposalLogs, cachedData.voteLogs, cachedData.queuedLogs, cachedData.executedLogs, cachedData.extendedLogs, latestBlock, client, cachedData.blockTimestampsCache, dao);
           if (mounted) setProposals(cachedProposals);
           cachedData.computedProposals = cachedProposals;
           await set(cacheKey, cachedData);
        }
        
        let mergedRanges: [bigint, bigint][] = cachedData.syncedRanges.map((r: [string, string]) => [BigInt(r[0]), BigInt(r[1])]);
        
        const effectiveScanned = calculateScannedBlocks(mergedRanges, targetStartBlock, latestBlock);
        
        const initialProgress = { 
          latestBlock: Number(latestBlock), 
          totalBlocks: Number(latestBlock - targetStartBlock + BigInt(1)),
          scannedBlocks: Number(effectiveScanned),
          startBlock: initialStartBlock,
          syncedRanges: mergedRanges.map(r => [Number(r[0]), Number(r[1])])
        };

        setProgress(p => ({ 
          ...p, 
          latestBlock: initialProgress.latestBlock,
          total: initialProgress.totalBlocks,
          scanned: initialProgress.scannedBlocks
        }));
        
        // Broadcast initial cache state to the footer immediately
        if (mounted) window.dispatchEvent(new CustomEvent('tslo_sync_progress', { detail: initialProgress }));

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

            const [pLogs, vLogs, qLogs, eLogs, extLogs] = await Promise.all([
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
              }),
              client.getLogs({
                address: dao.contracts.governor as `0x${string}`,
                event: proposalQueuedEvent,
                fromBlock,
                toBlock
              }),
              client.getLogs({
                address: dao.contracts.governor as `0x${string}`,
                event: proposalExecutedEvent,
                fromBlock,
                toBlock
              }),
              client.getLogs({
                address: dao.contracts.governor as `0x${string}`,
                event: proposalExtendedEvent,
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

            const qLogsMapped = qLogs.map(log => ({
              args: {
                proposalId: log.args.proposalId?.toString(),
                etaSeconds: log.args.etaSeconds?.toString()
              },
              blockNumber: log.blockNumber?.toString()
            }));

            const eLogsMapped = eLogs.map(log => ({
              args: {
                proposalId: log.args.proposalId?.toString()
              },
              blockNumber: log.blockNumber?.toString()
            }));

            const extLogsMapped = extLogs.map(log => ({
              args: {
                proposalId: log.args.proposalId?.toString(),
                extendedDeadline: log.args.extendedDeadline?.toString()
              },
              blockNumber: log.blockNumber?.toString()
            }));

            newProposalLogs.push(...pLogsMapped);
            newVoteLogs.push(...vLogsMapped);

            mergedRanges.push([fromBlock, toBlock]);
            mergedRanges = mergeRanges(mergedRanges);

            cachedData = {
              ...cachedData,
              syncedRanges: mergedRanges.map(r => [r[0].toString(), r[1].toString()]),
              proposalLogs: [...cachedData.proposalLogs, ...pLogsMapped],
              voteLogs: [...cachedData.voteLogs, ...vLogsMapped],
              queuedLogs: [...(cachedData.queuedLogs || []), ...qLogsMapped],
              executedLogs: [...(cachedData.executedLogs || []), ...eLogsMapped],
              extendedLogs: [...(cachedData.extendedLogs || []), ...extLogsMapped]
            };

            await set(cacheKey, cachedData);
            
            if (mounted) {
              const currentScanned = calculateScannedBlocks(mergedRanges, targetStartBlock, latestBlock);
              
              const progressUpdate = {
                startBlock: Number(targetStartBlock),
                latestBlock: Number(latestBlock),
                scannedBlocks: Number(currentScanned),
                totalBlocks: Number(latestBlock - targetStartBlock + BigInt(1)),
                syncedRanges: mergedRanges.map(r => [Number(r[0]), Number(r[1])])
              };
              
              setProgress(p => ({ ...p, scanned: Number(currentScanned) }));
              window.dispatchEvent(new CustomEvent('tslo_sync_progress', { detail: progressUpdate }));
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
             const { proposals: currentProposals, isDirty } = await buildProposalsList(cachedData.proposalLogs, cachedData.voteLogs, cachedData.queuedLogs, cachedData.executedLogs, cachedData.extendedLogs, latestBlock, client, cachedData.blockTimestampsCache, dao);
             if (mounted) setProposals(currentProposals);
             cachedData.computedProposals = currentProposals;
             await set(cacheKey, cachedData);
          }
        }

        if (!mounted) return;

        // Build proposals at the very end to ensure it's fully synced
        const { proposals: finalProposals, isDirty } = await buildProposalsList(cachedData.proposalLogs, cachedData.voteLogs, cachedData.queuedLogs, cachedData.executedLogs, cachedData.extendedLogs, latestBlock, client, cachedData.blockTimestampsCache, dao);
        cachedData.computedProposals = finalProposals;
        await set(cacheKey, cachedData);
        
        if (!mounted) return;
        const finalScanned = calculateScannedBlocks(mergedRanges, targetStartBlock, latestBlock);
        setProgress(p => ({ ...p, scanned: Number(finalScanned) }));
        setProposals(finalProposals);
        
        window.dispatchEvent(new CustomEvent('tslo_sync_progress', { 
           detail: {
             startBlock: initialStartBlock,
             latestBlock: Number(latestBlock),
             scannedBlocks: Number(finalScanned),
             totalBlocks: Number(latestBlock - targetStartBlock + BigInt(1)),
             syncedRanges: mergedRanges.map(r => [Number(r[0]), Number(r[1])])
           } 
        }));
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
