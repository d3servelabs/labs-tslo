import { compressAddressERC8117 } from "@ercref/erc8117";
import { marked } from "marked";

const markdownRenderer = new marked.Renderer();

markdownRenderer.link = ({ href, title, tokens, text: fallbackText }) => {
  const safeHref = href ?? "#";
  const text = tokens ? marked.parseInline(fallbackText || "") : fallbackText;
  const titleAttr = title ? ` title="${title}"` : "";
  const isExternal = /^https?:\/\//i.test(safeHref);
  const externalAttrs = isExternal ? ` target="_blank" rel="noreferrer"` : "";

  return `<a href="${safeHref}"${titleAttr}${externalAttrs}>${text}</a>`;
};

markdownRenderer.image = ({ href, title, text }) => {
  const safeHref = href ?? "";
  const safeAlt = text ?? "";
  const titleAttr = title ? ` title="${title}"` : "";
  return `<img src="${safeHref}" alt="${safeAlt}"${titleAttr} loading="lazy" />`;
};

markdownRenderer.html = () => "";

marked.setOptions({
  gfm: true,
  breaks: true,
  renderer: markdownRenderer
});

export function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: value >= 100 ? 0 : 1
  }).format(value);
}

export function formatCompactNumber(value: number) {
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: value >= 1_000_000 ? 1 : 2
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
  try {
    return compressAddressERC8117(value, "unicode", true);
  } catch (err) {
    return `${value.slice(0, 6)}...${value.slice(-4)}`;
  }
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
  return marked.parse(text, { async: false });
}
