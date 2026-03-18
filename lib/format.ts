export function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: value >= 100 ? 0 : 1
  }).format(value);
}

export function formatPercent(value: number) {
  return `${value.toFixed(1)}%`;
}

export function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(new Date(value));
}

export function formatAddress(value: string) {
  return `${value.slice(0, 6)}...${value.slice(-4)}`;
}

export function extractAbstract(description: string): string {
  const abstractPattern = /^#+\s*abstract\b[^\n]*/im;
  const match = description.search(abstractPattern);

  if (match === -1) {
    return "";
  }

  const afterHeader = description.slice(match);
  const headerEnd = afterHeader.indexOf("\n");

  if (headerEnd === -1) {
    return "";
  }

  const body = afterHeader.slice(headerEnd + 1);
  const nextHeading = body.search(/^#+\s/m);
  const section = nextHeading === -1 ? body : body.slice(0, nextHeading);

  return section.trim();
}

export function renderMarkdownBasic(text: string): string {
  const escaped = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  return escaped
    .replace(/^### (.+)$/gm, "<h3>$1</h3>")
    .replace(/^## (.+)$/gm, "<h2>$1</h2>")
    .replace(/^# (.+)$/gm, "<h1>$1</h1>")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/`(.+?)`/g, "<code>$1</code>")
    .replace(/\[(.+?)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noreferrer">$1</a>')
    .replace(/^- (.+)$/gm, "<li>$1</li>")
    .replace(/((?:<li>.*<\/li>\n?)+)/g, "<ul>$1</ul>")
    .replace(/\n{2,}/g, "</p><p>")
    .replace(/^(?!<(?:h[1-3]|ul|li|p)[ />])(.+)$/gm, "<p>$1</p>")
    .replace(/<p><\/p>/g, "");
}
