"use client";

import { useState } from "react";

import { formatAddress } from "@/lib/format";

type AddressDisplayMode = "short" | "full" | "inline";

type ExplorerConfig = {
  id: string;
  name: string;
  href: string;
};

function hashAddress(address: string) {
  let hash = 0;

  for (const character of address.toLowerCase()) {
    hash = (hash * 31 + character.charCodeAt(0)) >>> 0;
  }

  return hash;
}

function getExplorerConfigs(chainId: number, address: string): ExplorerConfig[] {
  const encodedAddress = encodeURIComponent(address);

  switch (chainId) {
    case 1:
      return [
        {
          id: "etherscan",
          name: "Etherscan",
          href: `https://etherscan.io/address/${encodedAddress}`
        },
        {
          id: "blockscout",
          name: "Blockscout",
          href: `https://eth.blockscout.com/address/${encodedAddress}`
        }
      ];
    case 10:
      return [
        {
          id: "optimism",
          name: "Optimism",
          href: `https://optimistic.etherscan.io/address/${encodedAddress}`
        },
        {
          id: "blockscout",
          name: "Blockscout",
          href: `https://optimism.blockscout.com/address/${encodedAddress}`
        }
      ];
    case 42161:
      return [
        {
          id: "arbiscan",
          name: "Arbiscan",
          href: `https://arbiscan.io/address/${encodedAddress}`
        },
        {
          id: "blockscout",
          name: "Blockscout",
          href: `https://arbitrum.blockscout.com/address/${encodedAddress}`
        }
      ];
    case 8453:
      return [
        {
          id: "basescan",
          name: "Basescan",
          href: `https://basescan.org/address/${encodedAddress}`
        },
        {
          id: "blockscout",
          name: "Blockscout",
          href: `https://base.blockscout.com/address/${encodedAddress}`
        }
      ];
    default:
      return [];
  }
}

function ExplorerLogo({ id }: { id: string }) {
  if (id === "etherscan" || id === "optimism" || id === "arbiscan" || id === "basescan") {
    return (
      <svg viewBox="0 0 24 24" className="explorer-logo-svg" aria-hidden="true">
        <circle cx="12" cy="12" r="11" fill="currentColor" opacity="0.12" />
        <path d="M12 4 6.5 13h3.4L8.7 20 17.5 9h-3.6L15 4Z" fill="currentColor" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" className="explorer-logo-svg" aria-hidden="true">
      <circle cx="8" cy="8" r="4" fill="currentColor" opacity="0.85" />
      <circle cx="16" cy="16" r="4" fill="currentColor" opacity="0.65" />
      <circle cx="16" cy="8" r="2.5" fill="currentColor" opacity="0.45" />
      <circle cx="8" cy="16" r="2.5" fill="currentColor" opacity="0.35" />
    </svg>
  );
}

function JazzIcon({ address }: { address: string }) {
  const hash = hashAddress(address);
  const hueA = hash % 360;
  const hueB = (hash >> 3) % 360;
  const hueC = (hash >> 7) % 360;

  return (
    <svg viewBox="0 0 40 40" className="jazz-icon" aria-hidden="true">
      <rect width="40" height="40" rx="14" fill={`hsl(${hueA} 58% 90%)`} />
      <circle cx="12" cy="11" r="9" fill={`hsl(${hueB} 72% 52%)`} />
      <circle cx="28" cy="13" r="8" fill={`hsl(${hueC} 68% 48%)`} opacity="0.9" />
      <circle cx="18" cy="27" r="10" fill={`hsl(${(hueA + hueC) % 360} 70% 56%)`} opacity="0.85" />
      <circle cx="30" cy="30" r="6" fill={`hsl(${(hueB + 90) % 360} 70% 42%)`} opacity="0.9" />
    </svg>
  );
}

export function AddressDisplay({
  chainId,
  address,
  mode
}: {
  chainId: number;
  address: string;
  mode: AddressDisplayMode;
}) {
  const [copied, setCopied] = useState(false);
  const displayValue = mode === "full" ? address : formatAddress(address);
  const explorers = getExplorerConfigs(chainId, address);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }

  if (mode === "inline") {
    return (
      <code className="address-inline" title={address} onClick={handleCopy} role="button" tabIndex={0}>
        {formatAddress(address)}
      </code>
    );
  }

  return (
    <div className={`address-display address-display-${mode}`}>
      <div className="address-display-main">
        <JazzIcon address={address} />
        <div className="address-display-content">
          <div className="address-display-row">
            <code className="address-display-value" title={address}>
              {displayValue}
            </code>
            <button
              type="button"
              className="button-secondary address-copy-button"
              onClick={handleCopy}
            >
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
          {explorers.length > 0 ? (
            <div className="address-display-links">
              {explorers.map((explorer) => (
                <a
                  key={explorer.id}
                  href={explorer.href}
                  target="_blank"
                  rel="noreferrer"
                  className={`explorer-link explorer-link-${explorer.id}`}
                >
                  <ExplorerLogo id={explorer.id} />
                  <span>{explorer.name}</span>
                </a>
              ))}
            </div>
          ) : (
            <div className="address-display-links">
              <span className="explorer-link explorer-link-generic">Explorer unavailable</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
