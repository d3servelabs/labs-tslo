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

export function WalletCard() {
  const [account, setAccount] = useState<string | null>(null);
  const [status, setStatus] = useState("Connect a wallet to validate TSLO write-path UX.");

  async function connectWallet() {
    if (!window.ethereum) {
      setStatus("No injected wallet found. Install a browser wallet to test write flows.");
      return;
    }

    try {
      const accounts = (await window.ethereum.request({ method: "eth_requestAccounts" })) as string[];
      setAccount(accounts[0] ?? null);
      setStatus("Wallet connected. Contract write adapters are the next implementation layer.");
    } catch {
      setStatus("Wallet connection was rejected or failed.");
    }
  }

  return (
    <div className="panel wallet-card" style={{ position: "relative" }}>
      <div style={{ position: "absolute", top: 16, right: 16, background: "rgba(15, 23, 42, 0.04)", padding: "4px 8px", borderRadius: "999px", fontSize: "0.75rem", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
        Soon
      </div>
      <div className="eyebrow">Write Flow Readiness</div>
      <h3 className="card-title">Wallet adapter stub</h3>
      <p className="muted">
        Reads should stay public. Wallet connection is only required for writes, and TSLO should
        surface explicit states for not connected, wrong network, unsupported action, pending, and
        confirmed transactions.
      </p>
      {account ? <div className="wallet-badge">{formatAddress(account)}</div> : null}
      <div className="action-row">
        <button className="button" type="button" disabled title="coming soon and disabled for now">
          Connect wallet
        </button>
      </div>
    </div>
  );
}
