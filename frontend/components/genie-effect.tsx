import { animate } from "motion";
import {
  motion,
  useMotionValue,
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
  ...restProps
}: GenieEffectProps) {
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

  useEffect(() => {
    const controls = animate(progress, expanded ? 1 : 0, {
      duration,
      ease: easing,
    });
    return () => controls.stop();
  }, [expanded, duration, progress, easing]);

  // ── Derived motion values ──

  // Y translation: collapsed → travel down to dock, expanded → 0
  const y = useTransform(progress, (p) => {
    return (1 - p) * travelDistance.current;
  });

  // Clip-path morph — delayed so the slide leads
  const clipPath = useTransform(progress, (v) => {
    const t = Math.min(Math.max(v, 0), 1);
    const clipP = expanded
      ? t < 0.2 ? 0 : (t - 0.2) / 0.8
      : t > 0.8 ? 1 : t / 0.8;
    return buildClipPath(clipP, rows);
  });

  // Scale: small at the dock, full size when expanded
  const scale = useTransform(progress, [0, 1], [0.3, 1]);

  // Opacity: quick fade to avoid the invisible-but-present element
  const opacity = useTransform(progress, [0, 0.08], [0, 1]);

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
      }}
    >
      {children}
    </motion.div>
  );
}
