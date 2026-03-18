import Link from "next/link";

import { WalletButton } from "@/components/wallet-button";
import { getSiteMode } from "@/lib/config";
import { loadPrimaryDao } from "@/lib/data-adapter";

import { HeaderSyncDot } from "@/components/header-sync-dot";
import { TsloLogo } from "@/components/tslo-logo";

export async function Header() {
  const mode = getSiteMode();
  const primaryDao = mode === "setup" ? undefined : await loadPrimaryDao();

  let daoHostname = "ens.domains";
  if (primaryDao?.links?.website) {
    try {
      daoHostname = new URL(primaryDao.links.website).hostname;
    } catch {
      // Ignore
    }
  }

  return (
    <header className="nav shell">
      <div className="nav-brand-area">
        <Link href="/" className="brand">
          <div className="brand-logo-tslo">
            <TsloLogo />
          </div>
          {!primaryDao && <span>TSLO</span>}
        </Link>

        {primaryDao && (
          <div className="brand-dao-pill">
            <img 
              src={`https://s2.googleusercontent.com/s2/favicons?domain=${daoHostname}&sz=128`} 
              alt={`${primaryDao.name} logo`} 
              className="dao-logo-img" 
              width={20} 
              height={20} 
            />
            <span>{primaryDao.shortName}</span>
          </div>
        )}

        <HeaderSyncDot />
      </div>
      <nav className="nav-links">
        <Link href="/">Home</Link>
        <Link href={mode === "single" ? "/#proposals" : "/#directory"}>
          {mode === "single" ? "Proposals" : "Directory"}
        </Link>
      </nav>
      <WalletButton chainId={primaryDao?.chainId} />
    </header>
  );
}
