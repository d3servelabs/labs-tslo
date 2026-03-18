"use client";

import { Proposal } from "@/lib/types";
import { formatNumber } from "@/lib/format";

export function StatusPill({ proposal }: { proposal: Proposal }) {
  const isDefeatedQuorum = proposal.state === "defeated" && !proposal.meetsQuorum;
  
  let label = proposal.state as string;
  let displayState = proposal.state;

  if (proposal.state === "succeeded") {
    label = "Passed";
  } else if (proposal.state === "defeated") {
    if (isDefeatedQuorum) {
      label = "Expired without a quorum";
      displayState = "expired_quorum" as any;
    } else {
      label = "Rejected";
    }
  } else {
    label = label.charAt(0).toUpperCase() + label.slice(1);
  }

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Tally explanation
    const forVotes = proposal.votes.for;
    const againstVotes = proposal.votes.against;
    const abstainVotes = proposal.votes.abstain;
    const quorum = proposal.votes.quorum;
    
    // Using OpenZeppelin GovernorCountingSimple logic: quorum only considers For + Abstain
    const quorumVotes = forVotes + abstainVotes;
    const meetsQuorum = quorumVotes >= quorum;
    const meetsMajority = forVotes > againstVotes;

    let explanation = `Tally Explanation:\n\n`;
    explanation += `For: ${formatNumber(forVotes)}\n`;
    explanation += `Against: ${formatNumber(againstVotes)}\n`;
    explanation += `Abstain: ${formatNumber(abstainVotes)}\n\n`;
    explanation += `Quorum required: ${formatNumber(quorum)}\n`;
    explanation += `Votes counting towards quorum (For + Abstain): ${formatNumber(quorumVotes)}\n`;
    explanation += `Quorum reached? ${meetsQuorum ? "Yes" : "No"}\n\n`;
    
    explanation += `Majority required: For > Against\n`;
    explanation += `Majority reached? ${meetsMajority ? "Yes" : "No"}\n\n`;

    if (proposal.state === "succeeded" || proposal.state === "executed" || proposal.state === "queued") {
      explanation += `Result: PASSED because both quorum and majority were reached.`;
    } else if (proposal.state === "defeated") {
      if (!meetsQuorum) {
        explanation += `Result: EXPIRED WITHOUT A QUORUM because the votes counting towards quorum (${formatNumber(quorumVotes)}) were less than the required quorum (${formatNumber(quorum)}).`;
      } else {
        explanation += `Result: REJECTED because the majority requirement was not met (For votes must be strictly greater than Against votes).`;
      }
    } else {
      explanation += `Result: Currently ${label.toUpperCase()}.`;
    }

    alert(explanation);
  };

  return (
    <button 
      className="status-pill" 
      data-status={displayState}
      onClick={handleClick}
      style={{ cursor: "pointer", border: "none", fontFamily: "inherit" }}
      title="Click for tally explanation"
    >
      {label}
    </button>
  );
}
