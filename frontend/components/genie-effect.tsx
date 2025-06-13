import { animate } from "motion";
import {
  motion,
  useMotionValue,
  useTransform,
  type HTMLMotionProps,
} from "motion/react";
import { useEffect } from "react";

interface GenieEffectProps extends HTMLMotionProps<"div"> {
  /** Duration of minimise / maximise in seconds */
  duration?: number;
  /** Whether the view is expanded */
  expanded: boolean;
  /** Number of horizontal slices to approximate the bezier */
  rows?: number;
  /**
   * Cubic-bezier easing curve or named easing to control the perceived speed.
   * Keep the same duration but pass a curve that spends more time in the middle
   * part of the animation for a smoother, slower feel.
   * Defaults to a slightly flatter curve than the previous implementation.
   */
  easing?: [number, number, number, number];
}

// Smootherstep easing (Perlin, 3rd-order smoothstep)
// Provides zero slope and curvature at both ends for a more natural feel.
function smoothEaseInOut(p: number) {
  // Clamp to the valid domain to avoid artefacts when the animation slightly
  // overshoots due to floating-point math.
  const t = Math.min(Math.max(p, 0), 1);
  return t * t * t * (t * (t * 6 - 15) + 10);
}

function buildClipPath(progress: number, rows = 12) {
  // progress 0 => fully collapsed at bottom centre, 1 => full rectangle
  const leftTopX = 0;
  const rightTopX = 100;

  const leftBottomX = leftTopX + 50 * (1 - progress); // converge to 50%
  const rightBottomX = rightTopX - 50 * (1 - progress);

  const points: string[] = [];

  // Bottom-to-top vertices (left edge then right edge reverse) to form polygon
  for (let i = 0; i <= rows; i += 1) {
    const t = i / rows; // 0 bottom, 1 top
    const eased = smoothEaseInOut(t);
    const leftX = leftBottomX + (leftTopX - leftBottomX) * eased;
    const rightX = rightBottomX + (rightTopX - rightBottomX) * eased;

    const y = 100 - t * 100; // clip-path uses percentage from top
    points.push(`${leftX}% ${y}%`);
  }
  for (let i = rows; i >= 0; i -= 1) {
    const t = i / rows;
    const eased = smoothEaseInOut(t);
    const rightX = rightBottomX + (rightTopX - rightBottomX) * eased;
    const y = 100 - t * 100;
    points.push(`${rightX}% ${y}%`);
  }
  return `polygon(${points.join(",")})`;
}

// Helper that phases the clip-path animation so that it starts only after a
// specified proportion of the overall progress has elapsed.
function phaseClipProgress(p: number, expanded: boolean, start = 0.6) {
  // Clamp first to stay within the [0,1] domain.
  const t = Math.min(Math.max(p, 0), 1);

  if (expanded) {
    // Expanding: keep the fully-curved shape until `start`, then morph to 1.
    if (t <= start) return 0;
    return (t - start) / (1 - start);
  }
  // Collapsing: keep the rectangle until `t` drops below `start`, then morph.
  if (t >= start) return 1;
  return t / start;
}

export function GenieEffect({
  duration = 0.8,
  children,
  expanded,
  rows = 12,
  easing = [0.2, 0.7, 0.3, 1] as [number, number, number, number],
  ...restProps
}: GenieEffectProps) {
  const progress = useMotionValue(expanded ? 1 : 0);

  useEffect(() => {
    const controls = animate(progress, expanded ? 1 : 0, {
      duration,
      ease: easing,
    });
    return () => {
      controls.stop();
    };
  }, [expanded, duration, progress, easing]);

  // Build the dynamic clip-path that gives the "genie" reveal effect.
  const clipPath = useTransform(progress, (v) =>
    buildClipPath(phaseClipProgress(v as number, expanded), rows)
  );

  // Move the element vertically from the bottom of the viewport when collapsed
  // to its natural position when expanded. 100 % means the component is located
  // right below the viewport, creating the illusion that it slides up on click.
  const translateY = useTransform(progress, (v) => `${(1 - v) * 100}vh`);

  // Gradually scale the element from a smaller size (80%) to its full size (100%)
  // as the animation progresses.
  const scale = useTransform(progress, (v) => 0.8 + 0.2 * v);

  const border = "drop-shadow(0 0 0 2px theme(colors.gray.400))"; // width = 2 px

  return (
    <motion.div
      {...restProps}
      style={{
        ...((restProps.style as any) ?? {}),
        clipPath,
        WebkitClipPath: clipPath,
        y: translateY,
        scale,
        filter: border, // ← fake border
      }}
    >
      {children}
    </motion.div>
  );
}
