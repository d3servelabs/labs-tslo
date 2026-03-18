"use client";

import { useMemo, useState } from "react";
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

    const values =
      valueInputs.length === 1 && targets.length > 1
        ? Array.from({ length: targets.length }, () => parseEther(valueInputs[0] ?? "0"))
        : valueInputs.map((value) => parseEther(value));

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
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Proposal transaction failed.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="create-proposal-wrap">
      <button type="button" className="button" onClick={() => setOpen((value) => !value)}>
        Create Proposal
      </button>
      {open ? (
        <div className="panel create-proposal-panel">
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
          <button type="button" className="button" onClick={submitProposal} disabled={pending}>
            {pending ? "Submitting..." : "Create Proposal"}
          </button>
        </div>
      ) : null}
      {status ? <p className="footnote">{status}</p> : null}
    </div>
  );
}
