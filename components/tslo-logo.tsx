export function TsloLogo({ className }: { className?: string }) {
  return (
    <svg
      width="32"
      height="32"
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <rect x="2" y="4" width="28" height="6" rx="1" fill="currentColor" />
      <rect x="8" y="12" width="4" height="16" rx="1" fill="currentColor" />
      <rect x="14" y="12" width="4" height="16" rx="1" fill="currentColor" />
      <rect x="20" y="12" width="4" height="16" rx="1" fill="currentColor" />
    </svg>
  );
}
