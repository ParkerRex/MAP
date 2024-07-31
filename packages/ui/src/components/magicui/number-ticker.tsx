"use client";

import {
  MotionValue,
  useInView,
  useMotionValue,
  useSpring,
} from "framer-motion";
import { useEffect, useRef } from "react";

import { cn } from "@map/ui/cn";

interface NumberTickerProps {
  value: number;
  direction?: "up" | "down";
  className?: string;
  delay?: number; // delay in seconds
}

export default function NumberTicker({
  value,
  direction = "up",
  delay = 0,
  className,
}: NumberTickerProps) {
  const numberRef = useRef<HTMLSpanElement>(null);
  const initialValue = direction === "down" ? value : 0;
  const targetValue = direction === "down" ? 0 : value;
  const motionValue = useMotionValue(initialValue);
  const springValue = useSpring(motionValue, {
    damping: 60,
    stiffness: 100,
  });
  const isInView = useInView(numberRef, { once: true, margin: "0px" });

  useEffect(() => {
    if (isInView) {
      const timer = setTimeout(() => {
        motionValue.set(targetValue);
      }, delay * 1000);

      return () => clearTimeout(timer);
    }
  }, [isInView, delay, motionValue, targetValue]);

  useEffect(() => {
    const unsubscribe = springValue.on("change", (latest) => {
      if (numberRef.current) {
        const formattedNumber = formatNumber(latest);
        numberRef.current.textContent = formattedNumber;
      }
    });

    return () => unsubscribe();
  }, [springValue]);

  return (
    <span
      className={cn(
        "inline-block tabular-nums text-black dark:text-white tracking-wider",
        className,
      )}
      ref={numberRef}
    />
  );
}

function formatNumber(value: number): string {
  return Intl.NumberFormat("en-US").format(Math.round(value));
}
