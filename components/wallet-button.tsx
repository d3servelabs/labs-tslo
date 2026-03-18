"use client";

import { useState } from "react";

import { formatAddress } from "@/lib/format";

declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
    };
  }
}

export function WalletButton({ chainId }: { chainId?: number }) {
  const [account, setAccount] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  async function connectWallet() {
    if (!window.ethereum) {
      setStatus("No injected wallet found.");
      return;
    }

    try {
      const accounts = (await window.ethereum.request({
        method: "eth_requestAccounts"
      })) as string[];
      const nextAccount = accounts[0] ?? null;
      setAccount(nextAccount);

      if (chainId) {
        const activeChain = (await window.ethereum.request({
          method: "eth_chainId"
        })) as string;

        if (Number.parseInt(activeChain, 16) !== chainId) {
          setStatus(`Wrong network. Switch to chain ${chainId}.`);
          return;
        }
      }

      setStatus("Wallet connected.");
    } catch {
      setStatus("Wallet connection failed.");
    }
  }

  return (
    <div className="wallet-inline">
      <button className="button-secondary" type="button" disabled title="coming soon and disabled for now" style={{ position: "relative", paddingRight: "56px" }}>
        Connect wallet
        <span style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", background: "rgba(15, 23, 42, 0.04)", padding: "2px 6px", borderRadius: "999px", fontSize: "0.7rem", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
          Soon
        </span>
      </button>
    </div>
  );
}
