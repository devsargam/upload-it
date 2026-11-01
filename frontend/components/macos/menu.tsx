import { useState, type ReactNode } from "react";
import { cn } from "~/lib/utils";
import { CheckmarkIcon } from "./status-icons";

export type MenuEntry =
  | "separator"
  | {
      label: string;
      shortcut?: string;
      disabled?: boolean;
      checked?: boolean;
      /** Status menus (Wi-Fi, Battery) put a bold heading or grey caption here */
      kind?: "heading" | "caption";
      /** Shown on the right of a heading, e.g. the battery percentage */
      detail?: ReactNode;
      action?: () => void;
    };

// macOS blinks the chosen item once before the menu fades away
const BLINK_MS = 160;

interface MenuPanelProps {
  entries: MenuEntry[];
  /** Called after the blink, so the menu can close before the action runs */
  onChoose: (action?: () => void) => void;
}

/**
 * The open menu itself: frosted panel, blue highlight, shortcuts on the right.
 */
export function MenuPanel({ entries, onChoose }: MenuPanelProps) {
  const [blinking, setBlinking] = useState<number | null>(null);

  const choose = (index: number, action?: () => void) => {
    setBlinking(index);
    setTimeout(() => onChoose(action), BLINK_MS);
  };

  return (
    <div
      role="menu"
      className={cn(
        "min-w-[230px] continuous [--corner:7px] bg-[rgba(36,36,36,0.72)] p-[5px] text-[13px] text-white",
        "shadow-[inset_0_0_0_0.5px_rgba(255,255,255,0.16),0_0_0_0.5px_rgba(0,0,0,0.6),0_10px_30px_rgba(0,0,0,0.35)] backdrop-blur-2xl backdrop-saturate-150",
        // While an item blinks, the pointer shouldn't move the highlight
        blinking !== null && "pointer-events-none",
      )}
    >
      {entries.map((entry, i) => {
        if (entry === "separator") {
          return <div key={`sep-${i}`} className="mx-2.5 my-[5px] h-px bg-white/10" />;
        }

        if (entry.kind) {
          return (
            <div
              key={entry.label}
              className={cn(
                "flex h-[22px] items-center justify-between px-2.5",
                entry.kind === "heading" ? "font-semibold" : "text-white/45",
              )}
            >
              <span>{entry.label}</span>
              {entry.detail && <span className="font-normal text-white/60">{entry.detail}</span>}
            </div>
          );
        }

        return (
          <button
            key={entry.label}
            type="button"
            role="menuitem"
            disabled={entry.disabled}
            onClick={() => choose(i, entry.action)}
            className={cn(
              "flex h-[22px] w-full items-center gap-1 continuous [--corner:4px] pr-2.5 pl-1.5 text-left",
              entry.disabled ? "text-white/30" : "hover:bg-[#0a84ff]",
              blinking === i && "menu-blink",
            )}
          >
            <span className="grid w-3.5 shrink-0 place-items-center">
              {entry.checked && <CheckmarkIcon className="h-3 w-3" />}
            </span>
            <span className="flex-1 truncate">{entry.label}</span>
            {entry.shortcut && (
              <span className={cn("ml-6 tracking-wide", entry.disabled ? "text-white/25" : "text-white/45")}>
                {entry.shortcut}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
