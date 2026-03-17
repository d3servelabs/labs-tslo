import Link from "next/link";

import { WalletButton } from "@/components/wallet-button";
import { getSiteMode } from "@/lib/config";
import { loadPrimaryDao } from "@/lib/data-adapter";

export async function Header() {
  const mode = getSiteMode();
  const primaryDao = mode === "setup" ? undefined : await loadPrimaryDao();

  return (
    <header className="nav shell">
      <Link href="/" className="brand">
        <span className="brand-mark">
          {primaryDao?.shortName.slice(0, 2).toUpperCase() ?? "TS"}
        </span>
        <span>{primaryDao?.name ?? "TSLO"}</span>
      </Link>
      <nav className="nav-links">
        <Link href="/">Home</Link>
        <Link href={mode === "single" ? "/#proposals" : "/#directory"}>
          {mode === "single" ? "Proposals" : "Directory"}
        </Link>
        <Link href="/#api">API</Link>
      </nav>
      <WalletButton chainId={primaryDao?.chainId} />
    </header>
  );
}
