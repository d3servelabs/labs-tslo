"use client";

import { useDeferredValue, useState } from "react";

import { DaoCard } from "@/components/dao-card";
import { DaoConfig } from "@/lib/types";

export function DaoDirectory({ daos }: { daos: DaoConfig[] }) {
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const normalized = deferredQuery.trim().toLowerCase();
  const filtered = daos.filter((dao) => {
    if (!normalized) {
      return true;
    }

    return [dao.name, dao.shortName, dao.chainName, dao.governanceType]
      .join(" ")
      .toLowerCase()
      .includes(normalized);
  });

  return (
    <div className="panel">
      <div className="eyebrow">DAO Directory</div>
      <h3 className="card-title">Find a governance space</h3>
      <input
        className="search-input"
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search DAOs, chains, or governance type"
      />
      <div className="dao-list">
        {filtered.length > 0 ? (
          filtered.map((dao) => <DaoCard key={dao.slug} dao={dao} />)
        ) : (
          <div className="empty-state">No DAOs match that search yet.</div>
        )}
      </div>
    </div>
  );
}
