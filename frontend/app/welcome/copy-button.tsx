import { useEffect, useState } from "react";
import { cn } from "~/lib/utils";

const COPIED_RESET_MS = 2000;

// Both icons stay mounted and crossfade, so the swap reads as one object changing
const ICON = "absolute inset-0 h-3.5 w-3.5 transition-[opacity,filter] duration-150 ease-out";
const SHOWN = "opacity-100 blur-0";
const HIDDEN = "opacity-0 blur-[2px]";

/**
 * A small title-bar button that copies a command to the clipboard.
 */
export function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), COPIED_RESET_MS);
    return () => clearTimeout(t);
  }, [copied]);

  return (
    <button
      type="button"
      onClick={() => navigator.clipboard.writeText(text).then(() => setCopied(true))}
      aria-label={copied ? "Copied" : `Copy: ${text}`}
      title={`Copy “${text}”`}
      className="grid h-5 w-6 place-items-center continuous [--corner:4px] text-white/45 hover:bg-white/10 hover:text-white/80"
    >
      <span className="relative h-3.5 w-3.5">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={cn(ICON, copied ? HIDDEN : SHOWN)} aria-hidden>
          <rect width="14" height="14" x="8" y="8" rx="2" />
          <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
        </svg>
        <svg viewBox="0 0 24 24" fill="none" stroke="#28c840" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={cn(ICON, copied ? SHOWN : HIDDEN)} aria-hidden>
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </span>
    </button>
  );
}
