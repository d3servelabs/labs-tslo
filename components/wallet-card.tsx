"use client";

import { useState } from "react";

import { formatAddress } from "@/lib/format";

declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string }) => Promise<string[]>;
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
      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
      setAccount(accounts[0] ?? null);
      setStatus("Wallet connected. Contract write adapters are the next implementation layer.");
    } catch {
      setStatus("Wallet connection was rejected or failed.");
    }
  }

  return (
    <div className="panel wallet-card">
      <div className="eyebrow">Write Flow Readiness</div>
      <h3 className="card-title">Wallet adapter stub</h3>
      <p className="muted">
        MVP foundation includes connection state and capability messaging. The next step is wiring
        proposal, vote, delegation, queue, execute, and cancel actions to Governor contracts.
      </p>
      {account ? <div className="wallet-badge">{formatAddress(account)}</div> : null}
      <div className="action-row">
        <button className="button" type="button" onClick={connectWallet}>
          {account ? "Reconnect wallet" : "Connect wallet"}
        </button>
      </div>
      <div className="footnote">{status}</div>
    </div>
  );
}
