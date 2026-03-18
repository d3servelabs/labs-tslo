"use client";

import { useMemo, useState } from "react";
import { encodeFunctionData } from "viem";

const castVoteAbi = [
  {
    inputs: [
      { internalType: "uint256", name: "proposalId", type: "uint256" },
      { internalType: "uint8", name: "support", type: "uint8" }
    ],
    name: "castVote",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "nonpayable",
    type: "function"
  }
] as const;

export function VoteOnchainButton({
  chainId,
  governorAddress,
  proposalId
}: {
  chainId: number;
  governorAddress: string;
  proposalId: string;
}) {
  const [support, setSupport] = useState<"1" | "0" | "2">("1");
  const [status, setStatus] = useState<string>("");
  const [pending, setPending] = useState(false);
  const chainHex = useMemo(() => `0x${chainId.toString(16)}`, [chainId]);

  async function voteOnchain() {
    if (!window.ethereum) {
      setStatus("No injected wallet found.");
      return;
    }

    setPending(true);
    setStatus("Awaiting wallet confirmation...");

    try {
      const walletChainId = (await window.ethereum.request({ method: "eth_chainId" })) as string;
      if (walletChainId.toLowerCase() !== chainHex.toLowerCase()) {
        await window.ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: chainHex }]
        });
      }

      const accounts = (await window.ethereum.request({ method: "eth_requestAccounts" })) as string[];
      const from = accounts[0];
      if (!from) {
        throw new Error("No connected account returned by wallet.");
      }

      const data = encodeFunctionData({
        abi: castVoteAbi,
        functionName: "castVote",
        args: [BigInt(proposalId), Number(support)]
      });

      const txHash = (await window.ethereum.request({
        method: "eth_sendTransaction",
        params: [
          {
            from,
            to: governorAddress,
            data,
            value: "0x0"
          }
        ]
      })) as string;

      setStatus(`Vote submitted: ${txHash.slice(0, 10)}...`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Vote transaction failed.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="panel sidebar-panel vote-onchain-panel" style={{ position: "relative" }}>
      <div style={{ position: "absolute", top: 16, right: 16, background: "rgba(15, 23, 42, 0.04)", padding: "4px 8px", borderRadius: "999px", fontSize: "0.75rem", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
        Soon
      </div>
      <h3 className="sidebar-title">Vote</h3>
      <div className="vote-onchain-controls">
        <select
          className="search-input vote-onchain-select"
          value={support}
          onChange={(event) => setSupport(event.target.value as "1" | "0" | "2")}
          disabled
        >
          <option value="1">For</option>
          <option value="0">Against</option>
          <option value="2">Abstain</option>
        </select>
        <button type="button" className="button" onClick={voteOnchain} disabled title="coming soon and disabled for now">
          {pending ? "Submitting..." : "Vote onchain"}
        </button>
      </div>
      {status ? <p className="footnote">{status}</p> : null}
    </div>
  );
}
