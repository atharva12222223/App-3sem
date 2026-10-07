export function VerifiedBadge({ label = true }: { label?: boolean }) {
  return (
    <span
      className="inline-flex shrink-0 items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-extrabold text-verified-600"
      title="Verified by the municipal Town Vending Committee"
    >
      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-verified-500" aria-hidden>
        <path d="M12 2l2.4 2.1 3.2-.3 1 3 2.9 1.4-.9 3.1.9 3.1-2.9 1.4-1 3-3.2-.3L12 22l-2.4-2.1-3.2.3-1-3L2.5 15.8l.9-3.1-.9-3.1 2.9-1.4 1-3 3.2.3L12 2zm-1.2 13.1l5-5-1.4-1.4-3.6 3.6-1.7-1.7-1.4 1.4 3.1 3.1z" />
      </svg>
      {label && <span>Municipality Verified</span>}
    </span>
  );
}
