"use client";

import { useState } from "react";

export function TruncatedDescription({ htmlContent }: { htmlContent: string }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className={`truncated-description-wrapper ${expanded ? "expanded" : ""}`}>
      <div
        className="proposal-description"
        dangerouslySetInnerHTML={{ __html: htmlContent }}
      />
      {!expanded && (
        <div className="truncated-description-overlay">
          <button className="button-secondary" onClick={() => setExpanded(true)}>
            Read more
          </button>
        </div>
      )}
    </div>
  );
}
