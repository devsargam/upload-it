import { animate } from "motion";
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useTransform,
  type HTMLMotionProps,
} from "motion/react";
import { useEffect, useLayoutEffect, useRef, type RefObject } from "react";

interface GenieEffectProps extends HTMLMotionProps<"div"> {
  duration?: number;
  expanded: boolean;
  rows?: number;
  /** The dock icon the window is sucked into, as with "Minimize windows into application icon" */
  targetRef: RefObject<HTMLElement | null>;
  /** Called each time the window finishes opening */
  onExpandComplete?: () => void;
}

/** Where the window has to go to land in its dock icon. */
type Travel = { x: number; y: number; scale: number };

// The window's curve toward the dock, macOS-like: slow start, quick finish
const EASE = [0.4, 0, 0.15, 1] as const;

// Smootherstep — zero velocity & acceleration at both ends
function smootherstep(t: number) {
  const c = Math.min(Math.max(t, 0), 1);
  return c * c * c * (c * (c * 6 - 15) + 10);
}

function buildClipPath(progress: number, rows = 20) {
  const squeeze = 1 - progress;
  const leftBottomX = 50 * squeeze;
  const rightBottomX = 100 - 50 * squeeze;

  const points: string[] = [];

  for (let i = 0; i <= rows; i++) {
    const t = i / rows;
    const eased = smootherstep(t);
    const x = leftBottomX + (0 - leftBottomX) * eased;
    const y = 100 - t * 100;
    points.push(`${x}% ${y}%`);
  }

  for (let i = rows; i >= 0; i--) {
    const t = i / rows;
    const eased = smootherstep(t);
    const x = rightBottomX + (100 - rightBottomX) * eased;
    const y = 100 - t * 100;
    points.push(`${x}% ${y}%`);
  }

  return `polygon(${points.join(",")})`;
}

/**
 * The outer box carries layout, size and any drag offset; the inner one does
 * the genie. Measuring the outer box therefore gives where the window really
 * is on screen, unaffected by the genie's own transform.
 */
function measureTravel(box: HTMLElement, target: HTMLElement): Travel {
  const from = box.getBoundingClientRect();
  const to = target.getBoundingClientRect();
  const scale = Math.min(1, to.width / from.width);

  return {
    x: to.left + to.width / 2 - (from.left + from.width / 2),
    // The shrunken window's centre lands on the icon's centre
    y: to.top + to.height / 2 - from.bottom + (from.height * scale) / 2,
    scale,
  };
}

export function GenieEffect({
  duration = 0.55,
  children,
  expanded,
  rows = 20,
  targetRef,
  onExpandComplete,
  style,
  ...restProps
}: GenieEffectProps) {
  const reduceMotion = useReducedMotion();
  const boxRef = useRef<HTMLDivElement>(null);
  const progress = useMotionValue(expanded ? 1 : 0);
  const travel = useRef<Travel>({ x: 0, y: 0, scale: 0.1 });

  const measure = () => {
    if (boxRef.current && targetRef.current) {
      travel.current = measureTravel(boxRef.current, targetRef.current);
    }
  };

  useLayoutEffect(() => {
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  // Keep the latest callback without restarting the animation when it changes
  const onExpandCompleteRef = useRef(onExpandComplete);
  onExpandCompleteRef.current = onExpandComplete;

  useEffect(() => {
    // The window may have been dragged or zoomed since the last measurement
    if (!expanded) measure();

    const controls = animate(progress, expanded ? 1 : 0, { duration, ease: EASE });
    if (expanded) {
      controls.then(() => onExpandCompleteRef.current?.());
    }
    return () => controls.stop();
  }, [expanded, duration, progress]);

  // ── Derived motion values ──
  // Under reduced motion nothing moves or morphs; the window just fades.
  // The style keys stay the same either way, because hydration won't remove
  // server-rendered styles that the client stops setting.

  const x = useTransform(progress, (p) => (reduceMotion ? 0 : (1 - p) * travel.current.x));
  const y = useTransform(progress, (p) => (reduceMotion ? 0 : (1 - p) * travel.current.y));

  const scale = useTransform(progress, (p) => {
    if (reduceMotion) return 1;
    const min = travel.current.scale;
    return min + (1 - min) * p;
  });

  // Clip-path morph — delayed so the slide leads
  const clipPath = useTransform(progress, (v) => {
    if (reduceMotion) return "none";
    const t = Math.min(Math.max(v, 0), 1);
    const clipP = expanded
      ? t < 0.2 ? 0 : (t - 0.2) / 0.8
      : t > 0.8 ? 1 : t / 0.8;
    return buildClipPath(clipP, rows);
  });

  // Fades only in the last moment, as it disappears into the icon
  const opacity = useTransform(progress, (p) => (reduceMotion ? p : Math.min(p / 0.1, 1)));

  return (
    <motion.div
      ref={boxRef}
      {...restProps}
      style={{
        ...style,
        // A hidden window shouldn't swallow clicks meant for what's underneath
        pointerEvents: expanded ? "auto" : "none",
      }}
    >
      <motion.div
        className="h-full w-full"
        style={{
          clipPath,
          WebkitClipPath: clipPath,
          x,
          y,
          scale,
          opacity,
          transformOrigin: "bottom center",
        }}
      >
        {children}
      </motion.div>
    </motion.div>
  );
}
