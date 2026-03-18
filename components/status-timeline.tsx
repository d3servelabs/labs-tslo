import { TimelineStep } from "@/lib/types";
import { formatDate } from "@/lib/format";
import { AddressDisplay } from "@/components/address-display";

export function StatusTimeline({ timeline, chainId }: { timeline: TimelineStep[]; chainId: number }) {
  function getIcon(iconType?: string, complete?: boolean) {
    switch (iconType) {
      case "plus":
        return (
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
        );
      case "play":
        return (
          <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
            <polygon points="5 3 19 12 5 21 5 3"></polygon>
          </svg>
        );
      case "stop":
        return (
          <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
            <rect x="6" y="6" width="12" height="12"></rect>
          </svg>
        );
      case "publish":
        return (
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2v20"></path>
            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
          </svg>
        );
      case "success":
      case "execute":
        return (
          <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
          </svg>
        );
      case "defeat":
        return (
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        );
      default:
        return null;
    }
  }

  return (
    <div className="status-timeline">
      {timeline.map((step, index) => (
        <div key={step.label} className="status-timeline-item">
          <div className="status-timeline-connector">
            <div className={`status-timeline-icon ${step.complete ? "complete" : ""}`} data-icon={step.icon}>
              {getIcon(step.icon, step.complete)}
            </div>
            {index < timeline.length - 1 && <div className="status-timeline-line" />}
          </div>
          <div className="status-timeline-content">
            <div className="status-timeline-timestamp">{formatDate(step.timestamp)}</div>
            <strong className="status-timeline-label">{step.label}</strong>
            {step.actor && (
              <div className="status-timeline-actor">
                <AddressDisplay chainId={chainId} address={step.actor} mode="inline" />
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
