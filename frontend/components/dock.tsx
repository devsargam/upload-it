import { animate } from "motion";
import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from "motion/react";
import { useRef } from "react";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "~/components/ui/tooltip";
// Maximum scale factor applied to the focussed icon
const SCALE = 1.5;
// Distance (px) before the pointer starts affecting the icon
const DISTANCE = 110;
// Lateral nudge applied to neighbouring icons (px)
const NUDGE = 10;
// Shared spring config for a bit of bounce
const SPRING = {
  mass: 0.1,
  stiffness: 170,
  damping: 12,
};

const APPS = [
  { label: "Finder", image: "/finder.webp" },
  { label: "Terminal", image: "/terminal.webp" },
  { label: "VS Code", image: "/vscode.webp" },
  { label: "Ghostty", image: "/ghostty.webp" },
  { label: "Calendar", image: "/calender.webp" },
  { label: "Music", image: "/music.webp" },
];

interface DockProps {
  onAppClick?: (label: string) => void;
}

export function Dock({ onAppClick }: DockProps) {
  const mouseLeft = useMotionValue(-Infinity);

  return (
    <>
      {/* Desktop Dock */}
      <motion.div
        onMouseMove={(e) => {
          const { left } = e.currentTarget.getBoundingClientRect();
          mouseLeft.set(e.clientX - left);
        }}
        onMouseLeave={() => {
          mouseLeft.set(-Infinity);
        }}
        className="relative mx-auto hidden h-14 items-end gap-3 px-3 pb-2 sm:flex"
      >
        {/* Frosted glass background */}
        <div
          className="absolute inset-0 -z-10 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl"
        />

        {APPS.map(({ label, image }) => (
          <AppIcon
            key={label}
            label={label}
            image={image}
            mouseLeft={mouseLeft}
            onAppClick={onAppClick}
          />
        ))}
      </motion.div>

      {/* Mobile: simple horizontal list */}
      <div className="sm:hidden">
        <div className="mx-auto flex h-16 max-w-full items-end gap-4 overflow-x-auto rounded-2xl border border-white/10 bg-white/5 px-4 pb-3 backdrop-blur-xl">
          {APPS.map(({ label, image }) => (
            <button
              key={label}
              onClick={() => onAppClick?.(label)}
              className="flex aspect-square w-12 shrink-0 items-center justify-center rounded-xl bg-white/80 shadow"
            >
              <img src={image} alt={label} className="h-8 w-8 rounded-lg" />
            </button>
          ))}
        </div>
      </div>
    </>
  );
}

interface AppIconProps {
  label: string;
  mouseLeft: any;
  image: string;
  onAppClick?: (label: string) => void;
}

function AppIcon({ label, mouseLeft, image, onAppClick }: AppIconProps) {
  const ref = useRef<HTMLButtonElement>(null);
  const reduceMotion = useReducedMotion();

  // 1. Measure pointer distance from the icon centre
  const distance = useTransform(() => {
    const bounds = ref.current
      ? { x: ref.current.offsetLeft, width: ref.current.offsetWidth }
      : { x: 0, width: 0 };

    return mouseLeft.get() - bounds.x - bounds.width / 2;
  });

  // 2. Scale from 1 → SCALE depending on distance
  const scale = useTransform(distance, [-DISTANCE, 0, DISTANCE], [1, SCALE, 1]);

  // 3. Nudge neighbouring icons away
  const x = useTransform(() => {
    const d = distance.get();
    if (d === -Infinity) return 0;
    if (Math.abs(d) > DISTANCE) return Math.sign(d) * -NUDGE;
    return (-d / DISTANCE) * NUDGE * scale.get();
  });

  const scaleSpring = useSpring(scale, SPRING);
  const xSpring = useSpring(x, SPRING);
  const y = useMotionValue(0);

  return (
    <Tooltip delayDuration={0}>
      <TooltipTrigger asChild>
        <motion.button
          ref={ref}
          // Reduced motion: no magnification or bounce, the icons stay put
          style={reduceMotion ? undefined : { x: xSpring, scale: scaleSpring, y }}
          onClick={() => {
            if (!reduceMotion) {
              // Bounce animation on click — natural deceleration
              animate(y, [0, -30, 0, -10, 0], {
                ease: [0.33, 0, 0.2, 1],
                duration: 0.8,
              });
            }
            onAppClick?.(label);
          }}
          className="origin-bottom flex items-center justify-center rounded-xl"
        >
          <img src={image} alt={label} className="h-12 w-12 rounded-xl" />
        </motion.button>
      </TooltipTrigger>
      <TooltipContent sideOffset={10}>{label}</TooltipContent>
    </Tooltip>
  );
}
