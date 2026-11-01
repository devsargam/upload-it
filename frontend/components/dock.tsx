import { animate } from "motion";
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
  type MotionValue,
} from "motion/react";
import { useRef, type RefObject } from "react";

// Base icon size (px), the default macOS dock size
const ICON = 48;
// Size of the icon right under the pointer
const MAGNIFIED = 54;
// Distance (px) before the pointer starts affecting the icon
const DISTANCE = 120;
// Shared spring config: quick, with no visible overshoot
const SPRING = {
  mass: 0.1,
  stiffness: 170,
  damping: 12,
};

export const APPS = [
  { label: "Finder", image: "/finder.webp" },
  { label: "Terminal", image: "/terminal.webp" },
  { label: "VS Code", image: "/vscode.webp" },
  { label: "Ghostty", image: "/ghostty.webp" },
  { label: "Calendar", image: "/calender.webp" },
  { label: "Music", image: "/music.webp" },
];

interface DockProps {
  /** Apps that show the little "running" dot */
  running: string[];
  onAppClick?: (label: string) => void;
  /** Which icon gets `targetRef`, so a window can minimize into it */
  targetLabel?: string;
  targetRef?: RefObject<HTMLImageElement | null>;
}

/**
 * The macOS Dock: frosted glass, magnification, labels and running dots.
 */
export function Dock({ running, onAppClick, targetLabel, targetRef }: DockProps) {
  const mouseLeft = useMotionValue(-Infinity);

  return (
    <nav
      onMouseMove={(e) => {
        const { left } = e.currentTarget.getBoundingClientRect();
        mouseLeft.set(e.clientX - left);
      }}
      onMouseLeave={() => mouseLeft.set(-Infinity)}
      className="relative flex items-end gap-1 continuous [--corner:20px] px-[5px] pt-[5px] pb-[7px]"
    >
      {/* Dark-mode Dock glass: nearly opaque, with a faint lit top edge */}
      <div className="absolute inset-0 -z-10 continuous [--corner:20px] bg-[rgba(16,10,16,0.72)] shadow-[inset_0_0.5px_0_rgba(255,255,255,0.18),inset_0_0_0_0.5px_rgba(255,255,255,0.08),0_0_0_0.5px_rgba(0,0,0,0.35)] backdrop-blur-2xl backdrop-saturate-150" />

      {APPS.map(({ label, image }) => (
        <AppIcon
          key={label}
          label={label}
          image={image}
          mouseLeft={mouseLeft}
          isRunning={running.includes(label)}
          imageRef={label === targetLabel ? targetRef : undefined}
          onAppClick={onAppClick}
        />
      ))}
    </nav>
  );
}

interface AppIconProps {
  label: string;
  image: string;
  mouseLeft: MotionValue<number>;
  isRunning: boolean;
  imageRef?: RefObject<HTMLImageElement | null>;
  onAppClick?: (label: string) => void;
}

function AppIcon({ label, image, mouseLeft, isRunning, imageRef, onAppClick }: AppIconProps) {
  const ref = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();

  // Pointer distance from this icon's centre
  const distance = useTransform(() => {
    const bounds = ref.current
      ? { x: ref.current.offsetLeft, width: ref.current.offsetWidth }
      : { x: 0, width: 0 };

    return mouseLeft.get() - bounds.x - bounds.width / 2;
  });

  // Icons really grow, like macOS: neighbours get pushed aside and the Dock widens
  const size = useTransform(distance, [-DISTANCE, 0, DISTANCE], [ICON, MAGNIFIED, ICON]);
  const sizeSpring = useSpring(size, SPRING);
  const y = useMotionValue(0);
  // The label rides on top of the magnified icon
  const labelY = useTransform(sizeSpring, (s) => ICON - s);

  const handleClick = () => {
    // Only a launch bounces; clicking an app that's already open just activates it
    if (!isRunning && !reduceMotion) {
      // Each hop decelerates up and falls back under gravity, like the real launch bounce
      animate(y, [0, -26, 0, -26, 0], {
        duration: 0.9,
        times: [0, 0.25, 0.5, 0.75, 1],
        ease: ["easeOut", "easeIn", "easeOut", "easeIn"],
      });
    }
    onAppClick?.(label);
  };

  return (
    <motion.div
      ref={ref}
      className="group relative h-12"
      style={{ width: reduceMotion ? ICON : sizeSpring }}
    >
      {/* Dock label: a bubble whose tail points at the icon, shown instantly on hover */}
      <motion.span
        style={reduceMotion ? undefined : { y: labelY }}
        className="pointer-events-none absolute bottom-full left-1/2 mb-3.5 hidden -translate-x-1/2 group-hover:block"
      >
        <span className="relative block continuous [--corner:10px] border border-white/25 bg-[rgb(28,22,30)]/90 px-3 py-[3px] text-[13px] whitespace-nowrap text-white shadow-[0_4px_14px_rgba(0,0,0,0.35)] backdrop-blur-xl">
          {label}
          {/* The tail: a turned square whose two lower edges carry on the bubble's border */}
          <span className="absolute -bottom-[4.5px] left-1/2 h-2 w-2 -translate-x-1/2 rotate-45 border-r border-b border-white/25 bg-[rgb(28,22,30)]" />
        </span>
      </motion.span>

      {/* Anchored to the bottom, so a magnified icon grows up out of the Dock */}
      <motion.button
        type="button"
        aria-label={label}
        onClick={handleClick}
        style={{ y }}
        className="absolute bottom-0 left-0 w-full"
      >
        <img ref={imageRef} src={image} alt="" draggable={false} className="aspect-square w-full" />
      </motion.button>

      {isRunning && (
        <span className="absolute -bottom-[5px] left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-white/75" />
      )}
    </motion.div>
  );
}
