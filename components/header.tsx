import Link from "next/link";

export function Header() {
  return (
    <header className="nav shell">
      <Link href="/" className="brand">
        <span className="brand-mark">TS</span>
        <span>TSLO</span>
      </Link>
      <nav className="nav-links">
        <Link href="/">Home</Link>
        <Link href="/#api">API</Link>
        <Link href="/#launch">Launch Scope</Link>
      </nav>
    </header>
  );
}
