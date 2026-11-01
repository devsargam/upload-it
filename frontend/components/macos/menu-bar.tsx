import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState, type MouseEvent, type ReactNode } from "react";
import { cn } from "~/lib/utils";
import { MenuPanel, type MenuEntry } from "./menu";
import { appMenus, appleMenu, batteryMenu, wifiMenu, type DesktopActions, type FrontApp } from "./menus";
import { AppleLogo, BatteryFullIcon, ControlCenterIcon, SearchIcon, WifiIcon } from "./status-icons";

/** Which menu is open, and where its title sits so the panel can hang below it. */
type OpenMenu = { id: string; entries: MenuEntry[]; left: number; right: number; alignRight: boolean };

/** "Mon Nov 2  1:15 AM", the way the macOS menu bar writes it. */
function formatClock(date: Date): string {
  const day = date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  const time = date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  return `${day.replace(",", "")}  ${time}`;
}

/**
 * Live clock. Rendered only in the browser, so the server's time zone never
 * leaks into the page and hydration never mismatches.
 */
function Clock() {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const interval = setInterval(() => setNow(new Date()), 10_000);
    return () => clearInterval(interval);
  }, []);

  return <span className="whitespace-pre tabular-nums">{now ? formatClock(now) : ""}</span>;
}

interface MenuTitleProps {
  children: ReactNode;
  isOpen?: boolean;
  bold?: boolean;
  label?: string;
  onOpen?: (event: MouseEvent<HTMLButtonElement>) => void;
  onHover?: (event: MouseEvent<HTMLButtonElement>) => void;
}

function MenuTitle({ children, isOpen = false, bold = false, label, onOpen, onHover }: MenuTitleProps) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-expanded={isOpen}
      onPointerDown={onOpen}
      onMouseEnter={onHover}
      className={cn(
        "flex h-[22px] cursor-default items-center continuous [--corner:4px] px-[9px]",
        bold && "font-semibold",
        isOpen ? "bg-white/20" : "active:bg-white/20",
      )}
    >
      {children}
    </button>
  );
}

/**
 * The macOS menu bar for whichever app is frontmost. Menus open instantly on
 * press, follow the pointer across the bar once one is open, and fade out
 * when closed, the way the real one behaves.
 */
export function MenuBar({ app, actions }: { app: FrontApp; actions: DesktopActions }) {
  const [open, setOpen] = useState<OpenMenu | null>(null);
  const barRef = useRef<HTMLElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const show = (id: string, entries: MenuEntry[], alignRight: boolean, event: MouseEvent<HTMLButtonElement>) => {
    const { left, right } = event.currentTarget.getBoundingClientRect();
    setOpen({ id, entries, left, right, alignRight });
  };

  // Press a title to open its menu, press it again to close
  const menu = (id: string, entries: MenuEntry[], alignRight = false) => ({
    isOpen: open?.id === id,
    onOpen: (e: MouseEvent<HTMLButtonElement>) => (open?.id === id ? setOpen(null) : show(id, entries, alignRight, e)),
    onHover: (e: MouseEvent<HTMLButtonElement>) => open && open.id !== id && show(id, entries, alignRight, e),
  });

  useEffect(() => {
    if (!open) return;
    const closeOnOutside = (e: PointerEvent) => {
      const target = e.target as Node;
      if (!barRef.current?.contains(target) && !panelRef.current?.contains(target)) setOpen(null);
    };
    const closeOnEscape = (e: KeyboardEvent) => e.key === "Escape" && setOpen(null);
    document.addEventListener("pointerdown", closeOnOutside);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutside);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  // A menu whose app just lost focus shouldn't linger
  useEffect(() => setOpen(null), [app]);

  return (
    <header
      ref={barRef}
      className="relative z-30 flex h-6 shrink-0 items-center justify-between bg-black/25 px-2 text-[13px] text-white backdrop-blur-2xl select-none [text-shadow:0_0_1px_rgba(0,0,0,0.25)]"
    >
      <nav className="flex items-center">
        <MenuTitle label="Apple menu" {...menu("apple", appleMenu)}>
          <AppleLogo className="h-[17px] w-[17px] -translate-y-px" />
        </MenuTitle>
        {appMenus(app, actions).map(({ title, entries }, i) => (
          <MenuTitle key={title} bold={i === 0} {...menu(title, entries)}>
            {title}
          </MenuTitle>
        ))}
      </nav>

      <div className="flex items-center">
        <MenuTitle label="Battery" {...menu("battery", batteryMenu, true)}>
          <BatteryFullIcon className="h-[22px] w-[26px]" />
        </MenuTitle>
        <MenuTitle label="Wi-Fi" {...menu("wifi", wifiMenu, true)}>
          <WifiIcon className="h-[17px] w-[17px]" />
        </MenuTitle>
        <MenuTitle label="Spotlight">
          <SearchIcon className="h-[15px] w-[15px]" />
        </MenuTitle>
        <MenuTitle label="Control Center">
          <ControlCenterIcon className="h-[15px] w-[15px]" />
        </MenuTitle>
        <MenuTitle>
          <Clock />
        </MenuTitle>
      </div>

      {/* Opens instantly, fades on close; switching menus swaps with no fade */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="menu"
            ref={panelRef}
            initial={false}
            exit={{ opacity: 0, transition: { duration: 0.2, ease: "easeOut" } }}
            className="absolute top-[23px]"
            style={open.alignRight ? { right: window.innerWidth - open.right } : { left: open.left }}
          >
            <MenuPanel
              key={open.id}
              entries={open.entries}
              onChoose={(action) => {
                setOpen(null);
                action?.();
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
