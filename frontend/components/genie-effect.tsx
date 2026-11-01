import { animate } from "motion";
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useTransform,
  type HTMLMotionProps,
} from "motion/react";
import { useEffect, useLayoutEffect, useMemo, useRef, type RefObject } from "react";

interface GenieEffectProps extends HTMLMotionProps<"div"> {
  duration?: number;
  expanded: boolean;
  rows?: number;
  /** Ref to the dock element — the window animates to/from its centre */
  dockRef?: RefObject<HTMLElement | null>;
  /** Called each time the window finishes opening */
  onExpandComplete?: () => void;
}

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

export function GenieEffect({
  duration = 0.65,
  children,
  expanded,
  rows = 20,
  dockRef,
  onExpandComplete,
  ...restProps
}: GenieEffectProps) {
  const reduceMotion = useReducedMotion();
  const selfRef = useRef<HTMLDivElement>(null);
  const progress = useMotionValue(expanded ? 1 : 0);

  // Store the pixel offset the terminal must travel to reach the dock.
  // Positive = downward.
  const travelDistance = useRef(0);

  // Measure on mount + resize using the element's CSS-layout position
  // (ignoring any transforms motion has applied).
  useLayoutEffect(() => {
    function measure() {
      const el = selfRef.current;
      const dock = dockRef?.current;
      if (!el || !dock) {
        // No dock ref — fall back: travel to the very bottom of the viewport
        if (el) {
          travelDistance.current =
            window.innerHeight - el.offsetTop - el.offsetHeight;
        }
        return;
      }

      // offsetTop gives the position in the containing block, unaffected by
      // CSS transforms, so we get the "natural" layout position every time.
      // Both elements share the same offset-parent (<main>), so we can
      // compare directly.
      const elBottom = el.offsetTop + el.offsetHeight;
      const dockCenterY = dock.offsetTop + dock.offsetHeight / 2;
      travelDistance.current = dockCenterY - elBottom;
    }

    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [dockRef]);

  const easing = useMemo(
    () => [0.4, 0, 0.15, 1] as [number, number, number, number],
    [],
  );

  // Keep the latest callback without restarting the animation when it changes
  const onExpandCompleteRef = useRef(onExpandComplete);
  onExpandCompleteRef.current = onExpandComplete;

  useEffect(() => {
    const controls = animate(progress, expanded ? 1 : 0, {
      duration,
      ease: easing,
    });
    if (expanded) {
      controls.then(() => onExpandCompleteRef.current?.());
    }
    return () => controls.stop();
  }, [expanded, duration, progress, easing]);

  // ── Derived motion values ──
  // Under reduced motion nothing moves or morphs; the window just fades.
  // The style keys stay the same either way, because hydration won't remove
  // server-rendered styles that the client stops setting.

  // Y translation: collapsed → travel down to dock, expanded → 0
  const y = useTransform(progress, (p) => {
    return reduceMotion ? 0 : (1 - p) * travelDistance.current;
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

  // Scale: small at the dock, full size when expanded
  const scale = useTransform(progress, (p) => (reduceMotion ? 1 : 0.3 + 0.7 * p));

  // Opacity: quick fade to avoid the invisible-but-present element
  const opacity = useTransform(progress, (p) => (reduceMotion ? p : Math.min(p / 0.08, 1)));

  return (
    <motion.div
      ref={selfRef}
      {...restProps}
      style={{
        ...((restProps.style as any) ?? {}),
        clipPath,
        WebkitClipPath: clipPath,
        y,
        scale,
        opacity,
        transformOrigin: "bottom center",
        // A hidden window shouldn't swallow clicks meant for what's underneath
        pointerEvents: expanded ? "auto" : "none",
      }}
    >
      {children}
    </motion.div>
  );
}
