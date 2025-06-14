"use client";

import { animate } from "motion";
import { motion, useMotionValue, useSpring, useTransform } from "motion/react";
import { useRef } from "react";
import type { ComponentType, SVGProps } from "react";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "~/components/ui/tooltip";
import {
  Globe,
  Mail,
  MessageSquare,
  Image as ImageIcon,
  StickyNote,
  Calendar as CalendarIcon,
  CheckSquare,
  Music as MusicIcon,
} from "lucide-react";

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
  {
    label: "Safari",
    Icon: Globe,
    image: "ghostty.png",
  },
  {
    label: "Mail",
    Icon: Mail,
  },
  {
    label: "Messages",
    Icon: MessageSquare,
  },
  {
    label: "Photos",
    Icon: ImageIcon,
  },
  {
    label: "Notes",
    Icon: StickyNote,
  },
  {
    label: "Calendar",
    Icon: CalendarIcon,
  },
  {
    label: "Reminders",
    Icon: CheckSquare,
  },
  {
    label: "Music",
    Icon: MusicIcon,
  },
] as const;

export function Dock() {
  // Track pointer distance from **left** edge and **right** edge of the Dock
  const mouseLeft = useMotionValue(-Infinity);
  const mouseRight = useMotionValue(-Infinity);

  // The glass-morphism background stretches towards the pointer
  const left = useTransform(mouseLeft, [0, 40], [0, -40]);
  const right = useTransform(mouseRight, [0, 40], [0, -40]);
  const leftSpring = useSpring(left, SPRING);
  const rightSpring = useSpring(right, SPRING);

  return (
    <>
      {/* Desktop Dock */}
      <motion.div
        onMouseMove={(e) => {
          const { left, right } = e.currentTarget.getBoundingClientRect();
          const offsetLeft = e.clientX - left;
          const offsetRight = right - e.clientX;
          mouseLeft.set(offsetLeft);
          mouseRight.set(offsetRight);
        }}
        onMouseLeave={() => {
          mouseLeft.set(-Infinity);
          mouseRight.set(-Infinity);
        }}
        className="relative mx-auto hidden h-20 items-end gap-4 px-4 pb-4 sm:flex"
      >
        {/* Frosted glass background */}
        <motion.div
          className="absolute inset-y-0 -z-10 rounded-2xl border border-white/20 bg-white/10 backdrop-blur-md"
          style={{ left: leftSpring, right: rightSpring }}
        />

        {APPS.map(({ label, Icon, image }) => (
          <AppIcon
            key={label}
            label={label}
            Icon={Icon}
            image={image}
            mouseLeft={mouseLeft}
          />
        ))}
      </motion.div>

      {/* Mobile: simple horizontal list */}
      <div className="sm:hidden">
        <div className="mx-auto flex h-16 max-w-full items-end gap-4 overflow-x-auto rounded-2xl border border-white/20 bg-white/10 px-4 pb-3 backdrop-blur-md">
          {APPS.map(({ label, Icon }) => (
            <button
              key={label}
              className="flex aspect-square w-12 shrink-0 items-center justify-center rounded-xl bg-white/80 text-gray-900 shadow"
            >
              <Icon className="h-6 w-6" />
            </button>
          ))}
        </div>
        <p className="mt-4 text-center text-xs font-medium text-gray-300">
          Use a desktop viewport (≥640px) to interact with the Dock.
        </p>
      </div>
    </>
  );
}

interface AppIconProps {
  label: string;
  Icon?: ComponentType<SVGProps<SVGSVGElement>>;
  mouseLeft: any;
  image?: string;
}

function AppIcon({ label, Icon, mouseLeft, image }: AppIconProps) {
  const ref = useRef<HTMLButtonElement>(null);

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
          style={{ x: xSpring, scale: scaleSpring, y }}
          onClick={() => {
            // Bounce animation on click
            animate(y, [0, -40, 0], {
              repeat: 2,
              ease: [0.42, 0, 0.58, 1],
              duration: 0.7,
            });
          }}
          className="origin-bottom flex items-center justify-center bg-white shadow"
        >
          {/* <Icon className="h-7 w-7 text-gray-900" /> */}
          <img src={image} alt={label} className="h-12 w-12" />
        </motion.button>
      </TooltipTrigger>
      <TooltipContent sideOffset={10}>{label}</TooltipContent>
    </Tooltip>
  );
}
