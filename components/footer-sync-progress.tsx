"use client";

import { useState, useEffect } from "react";
import { DaoConfig } from "@/lib/types";
import { get } from "idb-keyval";
import { createPublicClient, http } from "viem";

const defaultRpcUrls: Record<number, string> = {
  1: "https://eth-mainnet.public.blastapi.io"
};

function getClient(chainId: number) {
  const rpcUrl = defaultRpcUrls[chainId];
  if (!rpcUrl) throw new Error(`No RPC configured for chain ${chainId}.`);
  return createPublicClient({ transport: http(rpcUrl) });
}

export function FooterSyncProgress({ primaryDao }: { primaryDao?: DaoConfig }) {
  const [progress, setProgress] = useState<{ startBlock: number; latestBlock: number; scannedBlocks: number; totalBlocks: number } | null>(null);

  useEffect(() => {
    if (!primaryDao) return;
    
    let mounted = true;
    let timeoutId: any;

    async function pollProgress() {
      try {
        const client = getClient(primaryDao!.chainId);
        const cacheKey = `tslo_logs_${primaryDao!.chainId}_${primaryDao!.contracts.governor.toLowerCase()}`;
        const cachedData = await get(cacheKey);
        
        const latestBlock = Number(await client.getBlockNumber());
        const startBlock = primaryDao!.loadStatus?.startBlock ?? 0;
        const lastSyncedBlock = cachedData?.lastBlock ? Number(cachedData.lastBlock) : startBlock;
        const scannedBlocks = Math.max(0, lastSyncedBlock - startBlock);
        const totalBlocks = Math.max(0, latestBlock - startBlock);

        if (mounted) {
          setProgress({
            startBlock,
            latestBlock,
            scannedBlocks,
            totalBlocks
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

  const hasSyncInfo =
    startBlock !== undefined &&
    latestBlock !== undefined &&
    scannedBlocks !== undefined &&
    totalBlocks !== undefined;

  let percentage = 0;
  if (hasSyncInfo && totalBlocks > 0) {
    percentage = Math.floor((scannedBlocks / totalBlocks) * 100);
  } else if (hasSyncInfo && totalBlocks === 0) {
    percentage = 100;
  }

  const syncTilBlock = hasSyncInfo ? startBlock + scannedBlocks : undefined;

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
          {percentage}% (Synced until: {syncTilBlock?.toLocaleString()})
        </span>
      </div>
      <div className="progress">
        <span
          className="vote-for"
          style={{ width: `${percentage}%`, transition: "width 0.3s ease" }}
        ></span>
      </div>
    </div>
  );
}
