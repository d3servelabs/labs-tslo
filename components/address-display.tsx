"use client";

import { useEffect, useRef, useState } from "react";

import { formatAddress } from "@/lib/format";

type AddressDisplayMode = "short" | "full" | "inline";

type ExplorerConfig = {
  id: string;
  name: string;
  href: string;
  favicon: string;
};

function addressToSeed(address: string) {
  return parseInt(address.slice(2, 10), 16);
}

function getExplorerConfigs(chainId: number, address: string): ExplorerConfig[] {
  const encodedAddress = encodeURIComponent(address);

  switch (chainId) {
    case 1:
      return [
        {
          id: "etherscan",
          name: "Etherscan",
          href: `https://etherscan.io/address/${encodedAddress}`,
          favicon: "https://etherscan.io/images/favicon3.ico"
        },
        {
          id: "blockscout",
          name: "Blockscout",
          href: `https://eth.blockscout.com/address/${encodedAddress}`,
          favicon: "https://www.blockscout.com/images/favicon/favicon-32x32.png"
        }
      ];
    case 10:
      return [
        {
          id: "optimism",
          name: "Optimistic Etherscan",
          href: `https://optimistic.etherscan.io/address/${encodedAddress}`,
          favicon: "https://optimistic.etherscan.io/images/favicon3.ico"
        },
        {
          id: "blockscout",
          name: "Blockscout",
          href: `https://optimism.blockscout.com/address/${encodedAddress}`,
          favicon: "https://www.blockscout.com/images/favicon/favicon-32x32.png"
        }
      ];
    case 42161:
      return [
        {
          id: "arbiscan",
          name: "Arbiscan",
          href: `https://arbiscan.io/address/${encodedAddress}`,
          favicon: "https://arbiscan.io/images/favicon.ico"
        },
        {
          id: "blockscout",
          name: "Blockscout",
          href: `https://arbitrum.blockscout.com/address/${encodedAddress}`,
          favicon: "https://www.blockscout.com/images/favicon/favicon-32x32.png"
        }
      ];
    case 8453:
      return [
        {
          id: "basescan",
          name: "Basescan",
          href: `https://basescan.org/address/${encodedAddress}`,
          favicon: "https://basescan.org/images/favicon.ico"
        },
        {
          id: "blockscout",
          name: "Blockscout",
          href: `https://base.blockscout.com/address/${encodedAddress}`,
          favicon: "https://www.blockscout.com/images/favicon/favicon-32x32.png"
        }
      ];
    default:
      return [];
  }
}

function Jazzicon({ address, size = 32 }: { address: string; size?: number }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;

    import("@metamask/jazzicon").then((module) => {
      if (cancelled || !containerRef.current) return;
      const generate = module.default ?? module;
      const el = generate(size, addressToSeed(address));
      containerRef.current.replaceChildren(el);
    });

    return () => { cancelled = true; };
  }, [address, size]);

  return (
    <div
      ref={containerRef}
      className="jazz-icon"
      style={{ width: size, height: size, borderRadius: "50%", overflow: "hidden" }}
      aria-hidden="true"
    />
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
        <Jazzicon address={address} size={32} />
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
                  className="explorer-link"
                  title={explorer.name}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={explorer.favicon}
                    alt=""
                    className="explorer-favicon"
                    width={16}
                    height={16}
                  />
                  <span className="explorer-link-label">{explorer.name}</span>
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
