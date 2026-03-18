"use client";

import { useMemo, useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { encodeFunctionData, parseEther } from "viem";

const proposeAbi = [
  {
    inputs: [
      { internalType: "address[]", name: "targets", type: "address[]" },
      { internalType: "uint256[]", name: "values", type: "uint256[]" },
      { internalType: "bytes[]", name: "calldatas", type: "bytes[]" },
      { internalType: "string", name: "description", type: "string" }
    ],
    name: "propose",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "nonpayable",
    type: "function"
  }
] as const;

export function CreateProposalButton({
  chainId,
  governorAddress
}: {
  chainId: number;
  governorAddress: string;
}) {
  const [open, setOpen] = useState(false);
  const [targetsRaw, setTargetsRaw] = useState("");
  const [valuesRaw, setValuesRaw] = useState("0");
  const [calldatasRaw, setCalldatasRaw] = useState("0x");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("");
  const [pending, setPending] = useState(false);
  const chainHex = useMemo(() => `0x${chainId.toString(16)}`, [chainId]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  function splitList(raw: string) {
    return raw
      .split(/[\n,]/)
      .map((item) => item.trim())
      .filter(Boolean);
  }

  async function submitProposal() {
    if (!window.ethereum) {
      setStatus("No injected wallet found.");
      return;
    }

    const targets = splitList(targetsRaw);
    const valueInputs = splitList(valuesRaw);
    const calldataInputs = splitList(calldatasRaw);

    if (!description.trim()) {
      setStatus("Proposal description is required.");
      return;
    }

    if (targets.length === 0 || calldataInputs.length === 0) {
      setStatus("At least one target and calldata item are required.");
      return;
    }

    if (targets.length !== calldataInputs.length) {
      setStatus("Targets and calldata arrays must have the same length.");
      return;
    }

    let values: readonly bigint[];
    try {
      values =
        valueInputs.length === 1 && targets.length > 1
          ? Array.from({ length: targets.length }, () => parseEther(valueInputs[0] ?? "0"))
          : valueInputs.map((value) => parseEther(value));
    } catch (err) {
      setStatus("Invalid ETH value provided.");
      return;
    }

    if (values.length !== targets.length) {
      setStatus("Values must be one value or the same length as targets.");
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
        abi: proposeAbi,
        functionName: "propose",
        args: [
          targets as `0x${string}`[],
          values,
          calldataInputs.map((item) => (item.startsWith("0x") ? item : `0x${item}`)) as `0x${string}`[],
          description
        ]
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

      setStatus(`Proposal transaction submitted: ${txHash.slice(0, 10)}...`);
      setOpen(false);
      
      // Clear form after success
      setTargetsRaw("");
      setValuesRaw("0");
      setCalldatasRaw("0x");
      setDescription("");
      
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Proposal transaction failed.");
    } finally {
      setPending(false);
    }
  }

  const modalContent = open && mounted ? (
    <div className="modal-overlay" onClick={() => setOpen(false)}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Create Proposal</h2>
          <button className="modal-close" onClick={() => setOpen(false)} aria-label="Close modal">
            &times;
          </button>
        </div>
        <div className="create-proposal-fields">
          <label>
            Target address(es)
            <textarea
              className="search-input"
              value={targetsRaw}
              onChange={(event) => setTargetsRaw(event.target.value)}
              placeholder="0xabc..., 0xdef..."
            />
          </label>
          <label>
            ETH value(s)
            <textarea
              className="search-input"
              value={valuesRaw}
              onChange={(event) => setValuesRaw(event.target.value)}
              placeholder="0 or 0.5"
            />
          </label>
          <label>
            Calldata item(s)
            <textarea
              className="search-input"
              value={calldatasRaw}
              onChange={(event) => setCalldatasRaw(event.target.value)}
              placeholder="0xabcdef..."
            />
          </label>
          <label>
            Description
            <textarea
              className="search-input"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Proposal summary and rationale"
            />
          </label>
        </div>
        <div className="cta-row" style={{ marginTop: "24px" }}>
          <button type="button" className="button" onClick={submitProposal} disabled={pending}>
            {pending ? "Submitting..." : "Submit to Network"}
          </button>
          <button type="button" className="button-secondary" onClick={() => setOpen(false)}>
            Cancel
          </button>
        </div>
        {status ? <p className="footnote" style={{ color: pending ? "inherit" : "var(--danger)" }}>{status}</p> : null}
      </div>
    </div>
  ) : null;

  return (
    <div className="create-proposal-wrap" style={{ position: "relative" }}>
      <button type="button" className="button" disabled title="coming soon and disabled for now" style={{ position: "relative", paddingRight: "56px" }}>
        Create Proposal
        <span style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", background: "rgba(255, 255, 255, 0.2)", padding: "2px 6px", borderRadius: "999px", fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>
          Soon
        </span>
      </button>
      {mounted && createPortal(modalContent, document.body)}
      {status && !open ? <p className="footnote">{status}</p> : null}
    </div>
  );
}
