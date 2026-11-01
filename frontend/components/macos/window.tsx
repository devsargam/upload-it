import type { CSSProperties, PointerEvent, ReactNode } from "react";
import { cn } from "~/lib/utils";

interface TrafficLightProps {
  label: string;
  fill: string;
  ring: string;
  glyph: ReactNode;
  active: boolean;
  onClick?: () => void;
}

/**
 * One traffic light. The glyph only shows while the cluster is hovered, and an
 * inactive window's lights are grey until then, as on macOS.
 */
function TrafficLight({ label, fill, ring, glyph, active, onClick }: TrafficLightProps) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      onPointerDown={(e) => e.stopPropagation()}
      className={cn(
        "grid h-3 w-3 place-items-center rounded-full bg-(--fill) shadow-[inset_0_0_0_0.5px_var(--ring)]",
        !active && "bg-[#4e4e4e] shadow-[inset_0_0_0_0.5px_#3e3e3e] group-hover/lights:bg-(--fill) group-hover/lights:shadow-[inset_0_0_0_0.5px_var(--ring)]",
      )}
      style={{ "--fill": fill, "--ring": ring } as CSSProperties}
    >
      <svg viewBox="0 0 12 12" className="h-3 w-3 opacity-0 group-hover/lights:opacity-100" aria-hidden>
        {glyph}
      </svg>
    </button>
  );
}

const CLOSE_GLYPH = <path d="M3.8 3.8l4.4 4.4M8.2 3.8L3.8 8.2" stroke="#4d0000" strokeWidth="1.1" strokeLinecap="round" />;
const MINIMIZE_GLYPH = <path d="M3.2 6h5.6" stroke="#995700" strokeWidth="1.2" strokeLinecap="round" />;
const ZOOM_GLYPH = (
  <g fill="#006500">
    <path d="M3.5 4.3v3.4c0 .4.4.6.7.3l3.5-3.5c.3-.3.1-.7-.3-.7H4.3c-.5 0-.8.3-.8.5z" />
    <path d="M8.5 7.7V4.3c0-.4-.4-.6-.7-.3L4.3 7.5c-.3.3-.1.7.3.7h3.1c.5 0 .8-.3.8-.5z" />
  </g>
);

interface WindowProps {
  title: string;
  children: ReactNode;
  /** Extra controls on the right side of the title bar */
  accessory?: ReactNode;
  className?: string;
  /** Whether this is the focused window */
  active?: boolean;
  onClose?: () => void;
  onMinimize?: () => void;
  onZoom?: () => void;
  /** Lets the caller start a drag from the title bar */
  onTitleBarPointerDown?: (event: PointerEvent) => void;
}

/**
 * A dark-mode macOS window: hairline border, soft shadow, 28px title bar.
 */
export function Window({
  title,
  children,
  accessory,
  className,
  active = true,
  onClose,
  onMinimize,
  onZoom,
  onTitleBarPointerDown,
}: WindowProps) {
  return (
    <div
      className={cn(
        "flex h-full flex-col overflow-hidden bg-[#1e1e1e] [--corner:10px] sm:continuous",
        "sm:shadow-[0_0_0_0.5px_rgba(0,0,0,0.8),inset_0_0_0_0.5px_rgba(255,255,255,0.18),0_22px_70px_4px_rgba(0,0,0,0.56)]",
        className,
      )}
    >
      <div
        onPointerDown={onTitleBarPointerDown}
        onDoubleClick={onZoom}
        className="relative flex h-7 shrink-0 cursor-default items-center border-b border-black/60 bg-[#2c2c2c] select-none"
      >
        <div className="group/lights flex gap-2 pl-[13px]">
          <TrafficLight label="Close" fill="#ff5f57" ring="#e0443e" glyph={CLOSE_GLYPH} active={active} onClick={onClose} />
          <TrafficLight label="Minimize" fill="#febc2e" ring="#dea123" glyph={MINIMIZE_GLYPH} active={active} onClick={onMinimize} />
          <TrafficLight label="Zoom" fill="#28c840" ring="#1aab29" glyph={ZOOM_GLYPH} active={active} onClick={onZoom} />
        </div>
        <span
          className={cn(
            "pointer-events-none absolute inset-x-24 truncate text-center text-[13px] font-semibold",
            active ? "text-white/80" : "text-white/35",
          )}
        >
          {title}
        </span>
        {accessory && (
          <div className="ml-auto pr-2" onPointerDown={(e) => e.stopPropagation()}>
            {accessory}
          </div>
        )}
      </div>
      <div className="min-h-0 flex-1">{children}</div>
    </div>
  );
}
