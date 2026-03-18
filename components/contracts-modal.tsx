"use client";

import { useEffect, useState } from "react";
import { AddressDisplay } from "@/components/address-display";
import { formatCompactNumber } from "@/lib/format";
import { DaoConfig } from "@/lib/types";

// Helper function to format blocks/seconds into human readable time
function formatTime(blocksOrSeconds: string | undefined): string {
  if (!blocksOrSeconds) return "Loading...";
  
  const val = Number(blocksOrSeconds);
  if (isNaN(val)) return "Loading...";

  // Assuming value is in blocks (~12 seconds per block on Ethereum)
  // Or if it's already in seconds (common in newer OpenZeppelin implementations)
  // We'll just do a rough approximation. 
  // If value is very large, assume it's seconds, otherwise assume blocks (12s per block)
  const seconds = val > 1000000 ? val : val * 12;

  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days} day${days > 1 ? 's' : ''}`;
  if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''}`;
  if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''}`;
  return `${seconds} second${seconds !== 1 ? 's' : ''}`;
}

export function ContractsModal({ 
  dao, 
  isOpen, 
  onClose 
}: { 
  dao: DaoConfig; 
  isOpen: boolean; 
  onClose: () => void;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Ensure modal can be closed with escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  if (!mounted || !isOpen) {
    return null;
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Contracts and parameters</h2>
          <button className="modal-close" onClick={onClose} aria-label="Close modal">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>

        <div className="modal-body">
          <div className="modal-section">
            <h3 className="modal-section-title">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px' }}><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
              Parameters
            </h3>
            <div className="modal-parameter-list">
              <div className="modal-parameter-row">
                <span className="modal-parameter-label">Proposal threshold</span>
                <span className="modal-parameter-value">
                  {dao.parameters?.proposalThreshold 
                    ? formatCompactNumber(Number(dao.parameters.proposalThreshold)) 
                    : "Loading..."}
                </span>
              </div>
              <div className="modal-parameter-row">
                <span className="modal-parameter-label">Quorum needed</span>
                <span className="modal-parameter-value">
                  {dao.parameters?.quorumNeeded 
                    ? formatCompactNumber(Number(dao.parameters.quorumNeeded)) 
                    : "Loading..."}
                </span>
              </div>
              <div className="modal-parameter-row">
                <span className="modal-parameter-label">Proposal delay</span>
                <span className="modal-parameter-value">
                  {dao.parameters?.proposalDelay 
                    ? formatTime(dao.parameters.proposalDelay) 
                    : "Loading..."}
                </span>
              </div>
              <div className="modal-parameter-row">
                <span className="modal-parameter-label">Voting period</span>
                <span className="modal-parameter-value">
                  {dao.parameters?.votingPeriod 
                    ? formatTime(dao.parameters.votingPeriod) 
                    : "Loading..."}
                </span>
              </div>
            </div>
            <div className="modal-parameter-note">
              Parameters are governed by the community. <a href="#">Learn more.</a>
            </div>
          </div>

          <div className="modal-section" style={{ marginTop: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 className="modal-section-title" style={{ margin: 0 }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px' }}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                Contracts
              </h3>
              <div className="modal-chain-badge">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5 12 2"></polygon><line x1="12" y1="22" x2="12" y2="15.5"></line><polyline points="22 8.5 12 15.5 2 8.5"></polyline><polyline points="2 15.5 12 8.5 22 15.5"></polyline><line x1="12" y1="2" x2="12" y2="8.5"></line></svg>
                {dao.chainName}
              </div>
            </div>
            <div className="modal-contracts-list">
              <div className="modal-contract-row">
                <span className="modal-contract-label">GOVERNOR</span>
                <AddressDisplay chainId={dao.chainId} address={dao.contracts.governor} mode="full" />
              </div>
              <div className="modal-contract-row">
                <span className="modal-contract-label">TOKEN</span>
                <AddressDisplay chainId={dao.chainId} address={dao.contracts.token} mode="full" />
              </div>
              {dao.contracts.timelock && (
                <div className="modal-contract-row">
                  <span className="modal-contract-label">TIMELOCK</span>
                  <AddressDisplay chainId={dao.chainId} address={dao.contracts.timelock} mode="full" />
                </div>
              )}
            </div>
          </div>

          <div className="modal-footer-note">
            Organization ID: {dao.chainId}
          </div>
        </div>
      </div>
    </div>
  );
}
