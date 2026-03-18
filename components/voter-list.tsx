"use client";

import { useMemo, useState } from "react";
import { AddressDisplay } from "@/components/address-display";
import { Tabs } from "@/components/tabs";
import { formatNumber } from "@/lib/format";
import { Vote } from "@/lib/types";

export function VoterList({ voters, chainId }: { voters: Vote[]; chainId: number }) {
  const forVotes = useMemo(() => voters.filter((v) => v.support === "for").sort((a, b) => b.weight - a.weight), [voters]);
  const againstVotes = useMemo(() => voters.filter((v) => v.support === "against").sort((a, b) => b.weight - a.weight), [voters]);
  const abstainVotes = useMemo(() => voters.filter((v) => v.support === "abstain").sort((a, b) => b.weight - a.weight), [voters]);

  return (
    <div className="voter-list-container">
      <Tabs
        tabs={[
          {
            id: "for",
            label: `For ${forVotes.length}`,
            content: <VoterTabContent votes={forVotes} chainId={chainId} />
          },
          {
            id: "against",
            label: `Against ${againstVotes.length}`,
            content: <VoterTabContent votes={againstVotes} chainId={chainId} />
          },
          {
            id: "abstain",
            label: `Abstain ${abstainVotes.length}`,
            content: <VoterTabContent votes={abstainVotes} chainId={chainId} />
          }
        ]}
      />
    </div>
  );
}

function VoterTabContent({ votes, chainId }: { votes: Vote[]; chainId: number }) {
  const [expanded, setExpanded] = useState(false);
  const limit = 10;
  const visibleVotes = expanded ? votes : votes.slice(0, limit);

  if (votes.length === 0) {
    return <div className="empty-state">No voters</div>;
  }

  return (
    <div className="voter-tab-content">
      <div className="voter-rows">
        {visibleVotes.map((vote) => (
          <div key={vote.voter} className="voter-row">
            <AddressDisplay address={vote.voter} chainId={chainId} mode="inline" />
            <span className="voter-weight">{formatNumber(vote.weight)}</span>
          </div>
        ))}
      </div>
      {votes.length > limit && !expanded && (
        <button className="button-secondary view-all-button" onClick={() => setExpanded(true)}>
          View all
        </button>
      )}
    </div>
  );
}
