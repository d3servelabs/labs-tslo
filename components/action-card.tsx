"use client";

import { useState } from "react";
import { AddressDisplay } from "@/components/address-display";
import { ActionCall } from "@/lib/types";

export function ActionCard({ action, index, chainId }: { action: ActionCall; index: number; chainId: number }) {
  const [showParams, setShowParams] = useState(false);
  const [showRaw, setShowRaw] = useState(false);

  // basic parse of calldata
  // OpenZeppelin signatures are usually like "setBudget(address,uint256)"
  const paramsCount = action.signature ? action.signature.split(",").length : 0;

  return (
    <div className="action-card">
      <div className="action-card-header">
        <div className="action-card-title">
          <span className="action-index">Action {index + 1}</span>
          <strong>{action.signature || "call()"}</strong>
        </div>
      </div>
      <div className="action-card-body">
        <p className="muted">{action.summary}</p>
        <AddressDisplay chainId={chainId} address={action.target} mode="inline" />

        <div className="action-toggles">
          <button className="button-secondary action-toggle-btn" onClick={() => setShowParams(!showParams)}>
            {showParams ? "Hide params" : `${paramsCount} params`}
          </button>
          <button className="button-secondary action-toggle-btn" onClick={() => setShowRaw(!showRaw)}>
            {showRaw ? "Hide raw" : "Raw"}
          </button>
        </div>

        {showParams && (
          <div className="action-params-table">
            <div className="action-param-row">
              <div className="action-param-key">to</div>
              <div className="action-param-value">{action.target}</div>
            </div>
            <div className="action-param-row">
              <div className="action-param-key">value</div>
              <div className="action-param-value">{action.value}</div>
            </div>
            <div className="action-param-row">
              <div className="action-param-key">data</div>
              <div className="action-param-value">{action.calldata.slice(0, 10)}...</div>
            </div>
          </div>
        )}

        {showRaw && (
          <div className="action-raw-data">
            <pre className="code-block">{action.calldata}</pre>
          </div>
        )}
      </div>
    </div>
  );
}
