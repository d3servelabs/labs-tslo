"use client";

import { useEffect, useState, useRef } from "react";

export function HeaderSyncDot() {
  const [syncState, setSyncState] = useState<{
    isSyncing: boolean;
    percentage: number;
    etaSecs: number | null;
  }>({ isSyncing: true, percentage: 0, etaSecs: null });

  const lastProgressRef = useRef<{ scanned: number; time: number; etaSecs: number | null } | null>(null);

  useEffect(() => {
    const handleSyncProgress = (e: any) => {
      const { scannedBlocks, totalBlocks } = e.detail;
      const now = Date.now();

      // Assuming average block time of ~12 seconds for Ethereum
      // 6 minutes = 360 seconds = ~30 blocks
      const BLOCKS_IN_6_MINS = 30;

      if (totalBlocks > 0 && totalBlocks - scannedBlocks <= BLOCKS_IN_6_MINS) {
        lastProgressRef.current = null;
        setSyncState({
          isSyncing: false,
          percentage: 100,
          etaSecs: null
        });
      } else if (totalBlocks === 0 || scannedBlocks < totalBlocks) {
        let percentage = 0;
        let etaSecs: number | null = null;
        
        if (totalBlocks > 0) {
          percentage = Math.floor((scannedBlocks / totalBlocks) * 100);
          if (percentage === 100) percentage = 99;

          if (lastProgressRef.current) {
            const { scanned: lastScanned, time: lastTime, etaSecs: lastEta } = lastProgressRef.current;
            const scannedDiff = scannedBlocks - lastScanned;
            const timeDiff = now - lastTime;
            
            if (scannedDiff > 0 && timeDiff > 0) {
              const blocksPerMs = scannedDiff / timeDiff;
              const remainingBlocks = totalBlocks - scannedBlocks;
              etaSecs = Math.max(0, Math.floor(remainingBlocks / blocksPerMs / 1000));
            } else if (lastEta !== null) {
              etaSecs = lastEta;
            }
          }
        }

        lastProgressRef.current = { scanned: scannedBlocks, time: now, etaSecs };
        
        setSyncState({
          isSyncing: true,
          percentage,
          etaSecs
        });
      }
    };
    window.addEventListener("tslo_sync_progress", handleSyncProgress);
    return () => window.removeEventListener("tslo_sync_progress", handleSyncProgress);
  }, []);

  const formatEta = (secs: number) => {
    if (secs < 60) return `${secs}s`;
    const mins = Math.floor(secs / 60);
    return `${mins}m ${secs % 60}s`;
  };

  return (
    <div className="sync-status-indicator" title={syncState.isSyncing ? "Syncing onchain data..." : "Up to date"}>
      <div className={`sync-dot ${syncState.isSyncing ? "syncing" : "real-time"}`} />
      <span className="sync-status-text">
        {syncState.isSyncing 
          ? `${syncState.percentage}%${syncState.etaSecs !== null ? ` - ${formatEta(syncState.etaSecs)} left` : ''}` 
          : "real-time"}
      </span>
    </div>
  );
}

