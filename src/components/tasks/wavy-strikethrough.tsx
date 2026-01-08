"use client";

import { motion, type Transition } from "framer-motion";

interface WavyStrikethroughProps {
  isChecked: boolean;
  className?: string;
}

const getPathAnimate = (isChecked: boolean) => ({
  pathLength: isChecked ? 1 : 0,
  opacity: isChecked ? 1 : 0,
});

const getPathTransition = (isChecked: boolean): Transition => ({
  pathLength: { duration: 0.8, ease: "easeInOut" },
  opacity: {
    duration: 0.01,
    delay: isChecked ? 0 : 0.8,
  },
});

export function WavyStrikethrough({ isChecked, className }: WavyStrikethroughProps) {
  return (
    <motion.svg
      width="340"
      height="32"
      viewBox="0 0 340 32"
      className={`absolute left-0 top-1/2 -translate-y-1/2 pointer-events-none z-10 w-full h-8 ${className ?? ""}`}
      preserveAspectRatio="none"
    >
      <motion.path
        d="M 10 16.91 s 79.8 -11.36 98.1 -11.34 c 22.2 0.02 -47.82 14.25 -33.39 22.02 c 12.61 6.77 124.18 -27.98 133.31 -17.28 c 7.52 8.38 -26.8 20.02 4.61 22.05 c 24.55 1.93 113.37 -20.36 113.37 -20.36"
        vectorEffect="non-scaling-stroke"
        strokeWidth={2}
        strokeLinecap="round"
        strokeMiterlimit={10}
        fill="none"
        initial={false}
        animate={getPathAnimate(isChecked)}
        transition={getPathTransition(isChecked)}
        className="stroke-primary"
      />
    </motion.svg>
  );
}
