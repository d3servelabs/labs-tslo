"use client";

import { useEffect, useRef, useState } from "react";
import { createPublicClient, getAddress, http } from "viem";
import { mainnet } from "viem/chains";

import { formatAddress } from "@/lib/format";

type AddressDisplayMode = "short" | "full" | "inline";

type ExplorerConfig = {
  id: string;
  name: string;
  href: string;
  favicon: string;
};

type EnsProfile = {
  name?: string;
  avatarUrl?: string;
};

const ensProfileCache = new Map<string, EnsProfile>();
const ensClient = createPublicClient({
  chain: mainnet,
  transport: http("https://eth-mainnet.public.blastapi.io")
});

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
  const [ensProfile, setEnsProfile] = useState<EnsProfile>({});
  const displayValue = mode === "full" ? address : formatAddress(address);
  const explorers = getExplorerConfigs(chainId, address);

  useEffect(() => {
    let cancelled = false;

    async function resolveEnsProfile() {
      if (chainId !== 1) {
        if (!cancelled) {
          setEnsProfile({});
        }
        return;
      }

      let normalizedAddress: `0x${string}`;
      try {
        normalizedAddress = getAddress(address);
      } catch {
        if (!cancelled) {
          setEnsProfile({});
        }
        return;
      }

      const cacheKey = normalizedAddress.toLowerCase();
      const cached = ensProfileCache.get(cacheKey);
      if (cached) {
        if (!cancelled) {
          setEnsProfile(cached);
        }
        return;
      }

      try {
        const ensName = await ensClient.getEnsName({ address: normalizedAddress });
        if (!ensName) {
          ensProfileCache.set(cacheKey, {});
          if (!cancelled) {
            setEnsProfile({});
          }
          return;
        }

        const [ensAvatar, githubUsername] = await Promise.all([
          ensClient.getEnsAvatar({ name: ensName }),
          ensClient.getEnsText({ name: ensName, key: "com.github" })
        ]);

        const profile = {
          name: ensName,
          avatarUrl: ensAvatar ?? (githubUsername ? `https://github.com/${githubUsername}.png?size=96` : undefined)
        } satisfies EnsProfile;

        ensProfileCache.set(cacheKey, profile);
        if (!cancelled) {
          setEnsProfile(profile);
        }
      } catch {
        if (!cancelled) {
          setEnsProfile({});
        }
      }
    }

    resolveEnsProfile();

    return () => {
      cancelled = true;
    };
  }, [address, chainId]);

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
    const inlineLabel = ensProfile.name ?? formatAddress(address);

    return (
      <span className="address-inline-wrap">
        {ensProfile.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={ensProfile.avatarUrl} alt="" className="ens-avatar-inline" width={18} height={18} />
        ) : null}
        <code className="address-inline" title={address} onClick={handleCopy} role="button" tabIndex={0}>
          {inlineLabel}
        </code>
      </span>
    );
  }

  return (
    <div className={`address-display address-display-${mode}`}>
      <div className="address-display-main">
        {ensProfile.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={ensProfile.avatarUrl} alt="" className="ens-avatar" width={32} height={32} />
        ) : (
          <Jazzicon address={address} size={32} />
        )}
        <div className="address-display-content">
          <div className="address-display-row" style={{ position: "relative", alignItems: "center" }}>
            <code 
              className="address-display-value" 
              title={address} 
              onClick={handleCopy}
              style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }}
            >
              {ensProfile.name ?? displayValue}
              <span 
                className="address-copy-icon" 
                style={{ opacity: copied ? 1 : 0, transition: "opacity 160ms ease", color: copied ? "#10b981" : "var(--muted)", display: "flex" }}
                title="Copy address"
              >
                {copied ? (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                ) : (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                )}
              </span>
            </code>
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
