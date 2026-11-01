import { animate } from "motion";
import { useMotionValue } from "motion/react";
import type { PointerEvent, RefObject } from "react";

const RESET_EASE = [0.645, 0.045, 0.355, 1] as const;

/**
 * Drags a window by its title bar, keeping it inside the desktop the way
 * macOS keeps windows below the menu bar and on screen.
 */
export function useWindowDrag(
  windowRef: RefObject<HTMLElement | null>,
  desktopRef: RefObject<HTMLElement | null>,
) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const startDrag = (event: PointerEvent) => {
    const win = windowRef.current?.getBoundingClientRect();
    const desktop = desktopRef.current?.getBoundingClientRect();
    if (!win || !desktop || event.button !== 0) return;

    const start = { pointerX: event.clientX, pointerY: event.clientY, x: x.get(), y: y.get() };
    // How far the window can move each way before it leaves the desktop
    const bounds = {
      left: desktop.left - win.left,
      right: desktop.right - win.right,
      top: desktop.top - win.top,
      bottom: desktop.bottom - win.bottom,
    };
    const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

    const onMove = (e: globalThis.PointerEvent) => {
      x.set(start.x + clamp(e.clientX - start.pointerX, bounds.left, bounds.right));
      y.set(start.y + clamp(e.clientY - start.pointerY, bounds.top, bounds.bottom));
    };
    const onUp = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  };

  /** Slides the window back to its home position, e.g. when it zooms. */
  const reset = () => {
    animate(x, 0, { duration: 0.3, ease: RESET_EASE });
    animate(y, 0, { duration: 0.3, ease: RESET_EASE });
  };

  return { x, y, startDrag, reset };
}
