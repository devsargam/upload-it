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
}

function quadraticEaseInOut(p: number) {
  return p < 0.5 ? 2 * p * p : -1 + (4 - 2 * p) * p;
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
    const eased = quadraticEaseInOut(t);
    const leftX = leftBottomX + (leftTopX - leftBottomX) * eased;
    const rightX = rightBottomX + (rightTopX - rightBottomX) * eased;

    const y = 100 - t * 100; // clip-path uses percentage from top
    points.push(`${leftX}% ${y}%`);
  }
  for (let i = rows; i >= 0; i -= 1) {
    const t = i / rows;
    const eased = quadraticEaseInOut(t);
    const rightX = rightBottomX + (rightTopX - rightBottomX) * eased;
    const y = 100 - t * 100;
    points.push(`${rightX}% ${y}%`);
  }
  return `polygon(${points.join(",")})`;
}

export function GenieEffect({
  duration = 0.8,
  children,
  expanded,
  rows = 12,
  ...restProps
}: GenieEffectProps) {
  const progress = useMotionValue(expanded ? 1 : 0);

  useEffect(() => {
    const controls = animate(progress, expanded ? 1 : 0, {
      duration,
      ease: [0.4, 0, 0.2, 1],
    });
    return () => {
      controls.stop();
    };
  }, [expanded, duration, progress]);

  const clipPath = useTransform(progress, (v) =>
    buildClipPath(v as number, rows)
  );

  return (
    <motion.div
      {...restProps}
      style={{
        ...((restProps.style as any) ?? {}),
        clipPath,
        WebkitClipPath: clipPath,
      }}
    >
      {children}
    </motion.div>
  );
}
