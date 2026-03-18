"use client";

import { useEffect, useState } from "react";

export function HeaderSyncDot() {
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    const handleSyncProgress = (e: any) => {
      const { scannedBlocks, totalBlocks } = e.detail;
      // Consider syncing if we haven't scanned everything yet.
      // Also show if totalBlocks is 0 which implies still fetching the range
      if (totalBlocks === 0 || scannedBlocks < totalBlocks) {
        setSyncing(true);
      } else {
        setSyncing(false);
      }
    };
    window.addEventListener("tslo_sync_progress", handleSyncProgress);
    return () => window.removeEventListener("tslo_sync_progress", handleSyncProgress);
  }, []);

  if (!syncing) return null;

  return (
    <div className="sync-dot-container" title="Syncing onchain data...">
      <div className="sync-dot" />
    </div>
  );
}
