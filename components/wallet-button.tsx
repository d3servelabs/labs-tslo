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
      <button className="button-secondary" type="button" onClick={connectWallet}>
        {account ? formatAddress(account) : "Connect wallet"}
      </button>
      {status ? <span className="wallet-inline-note">{status}</span> : null}
    </div>
  );
}
