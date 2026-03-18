"use client";

import { useState, useEffect } from "react";
import { DaoConfig } from "@/lib/types";
import { get as idbGet } from "idb-keyval";
import { createPublicClient, http } from "viem";

async function get(key: string): Promise<any> {
  try {
    return await idbGet(key);
  } catch (err) {
    try {
      const val = localStorage.getItem(key);
      return val ? JSON.parse(val) : undefined;
    } catch (lsErr) {
      return undefined;
    }
  }
}

const defaultRpcUrls: Record<number, string> = {
  1: "https://eth-mainnet.public.blastapi.io"
};

function getClient(chainId: number) {
  const rpcUrl = defaultRpcUrls[chainId];
  if (!rpcUrl) throw new Error(`No RPC configured for chain ${chainId}.`);
  return createPublicClient({ transport: http(rpcUrl) });
}

export function FooterSyncProgress({ primaryDao }: { primaryDao?: DaoConfig }) {
  const [progress, setProgress] = useState<{ startBlock: number; latestBlock: number; scannedBlocks: number; totalBlocks: number; syncedRanges: [number, number][] } | null>(null);

  useEffect(() => {
    if (!primaryDao) return;
    
    let mounted = true;
    let timeoutId: any;

    async function pollProgress() {
      try {
        const client = getClient(primaryDao!.chainId);
        const cacheKey = `tslo_logs_${primaryDao!.chainId}_${primaryDao!.contracts.governor.toLowerCase()}`;
        
        let cachedData: any = await get(cacheKey);
        
        const latestBlock = Number(await client.getBlockNumber());
        const startBlock = primaryDao!.loadStatus?.startBlock ?? 0;
        
        let lastSyncedBlock = startBlock;
        let scannedBlocks = 0;
        let syncedRangesNum: [number, number][] = [];
        
        if (cachedData) {
          let syncedRanges: [bigint, bigint][] = [];
          
          if (cachedData.syncedRanges) {
            syncedRanges = cachedData.syncedRanges.map((r: [string, string]) => [BigInt(r[0]), BigInt(r[1])]);
          } else if (cachedData.lastBlock && Number(cachedData.lastBlock) > startBlock) {
            // fallback for legacy cache format
            syncedRanges = [[BigInt(startBlock), BigInt(cachedData.lastBlock)]];
          }

          const targetStartBlock = BigInt(startBlock);
          const targetEndBlock = BigInt(latestBlock);
          
          let scanned = BigInt(0);
          for (const r of syncedRanges) {
            const overlapStart = r[0] > targetStartBlock ? r[0] : targetStartBlock;
            const overlapEnd = r[1] < targetEndBlock ? r[1] : targetEndBlock;
            if (overlapStart <= overlapEnd) {
              scanned += (overlapEnd - overlapStart + BigInt(1));
              syncedRangesNum.push([Number(overlapStart), Number(overlapEnd)]);
            }
          }
          scannedBlocks = Number(scanned);
        }

        const totalBlocks = Math.max(0, latestBlock - startBlock + 1);

        if (mounted) {
          setProgress({
            startBlock,
            latestBlock,
            scannedBlocks,
            totalBlocks,
            syncedRanges: syncedRangesNum
          });
        }
      } catch (err) {
        // ignore
      }

      if (mounted) {
        timeoutId = setTimeout(pollProgress, 5000);
      }
    }

    pollProgress();

    return () => {
      mounted = false;
      clearTimeout(timeoutId);
    };
  }, [primaryDao]);

  const loadStatus = primaryDao?.loadStatus;

  const startBlock = progress?.startBlock ?? loadStatus?.startBlock;
  const latestBlock = progress?.latestBlock ?? loadStatus?.latestBlock;
  const scannedBlocks = progress?.scannedBlocks ?? loadStatus?.scannedBlocks;
  const totalBlocks = progress?.totalBlocks ?? loadStatus?.totalBlocks;
  const syncedRanges = progress?.syncedRanges ?? [];

  const hasSyncInfo =
    startBlock !== undefined &&
    latestBlock !== undefined &&
    scannedBlocks !== undefined &&
    totalBlocks !== undefined;

  let percentage = 0;
  if (hasSyncInfo && totalBlocks > 0) {
    // Only show 100% if we are completely done. Otherwise, if we're very close, show 99%.
    const rawPercentage = (scannedBlocks / totalBlocks) * 100;
    if (scannedBlocks >= totalBlocks) {
      percentage = 100;
    } else {
      percentage = Math.floor(rawPercentage);
      if (percentage === 100) {
        percentage = 99; // Cap at 99% until fully complete
      }
    }
  } else if (hasSyncInfo && totalBlocks === 0) {
    percentage = 100;
  }

  if (!hasSyncInfo) return null;

  return (
    <div style={{ marginBottom: "24px", maxWidth: "600px" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: "8px",
          fontSize: "0.85rem",
          color: "var(--muted)"
        }}
      >
        <span>
          Syncing blocks: {startBlock.toLocaleString()} &rarr; {latestBlock.toLocaleString()}
        </span>
        <span>
          {percentage}% ({scannedBlocks.toLocaleString()} / {totalBlocks.toLocaleString()} blocks)
        </span>
      </div>
      <div className="progress" style={{ position: "relative", backgroundColor: "var(--border)", overflow: "hidden" }}>
        {totalBlocks > 0 ? (
          syncedRanges.map(([rangeStart, rangeEnd], idx) => {
            const leftPerc = Math.max(0, ((rangeStart - startBlock) / totalBlocks) * 100);
            const widthPerc = Math.min(100 - leftPerc, ((rangeEnd - rangeStart + 1) / totalBlocks) * 100);
            return (
              <span
                key={idx}
                className="vote-for"
                style={{
                  position: "absolute",
                  left: `${leftPerc}%`,
                  width: `${widthPerc}%`,
                  height: "100%",
                  transition: "all 0.3s ease",
                  borderRadius: "0px"
                }}
              ></span>
            );
          })
        ) : (
          <span
            className="vote-for"
            style={{ width: `100%`, height: "100%", borderRadius: "0px" }}
          ></span>
        )}
      </div>
    </div>
  );
}
