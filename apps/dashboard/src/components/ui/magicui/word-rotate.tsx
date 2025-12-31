"use client";

import { cn } from "@/components/ui/cn";
import { AnimatePresence, type HTMLMotionProps, motion } from "framer-motion";
import { useEffect, useState } from "react";

interface WordRotateProps {
  words: string[];
  gradientWords?: number[];
  duration?: number;
  framerProps?: HTMLMotionProps<"h1">;
  className?: string;
}

export const WORD_ROTATE_DURATION = 5000;

export default function WordRotate({
  words,
  gradientWords = [],
  duration = WORD_ROTATE_DURATION,
  framerProps = {
    initial: { opacity: 0, y: -50 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 50 },
    transition: { duration: 0.25, ease: "easeOut" },
  },
  className,
}: WordRotateProps) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prevIndex) => (prevIndex + 1) % words.length);
    }, duration);

    return () => clearInterval(interval);
  }, [words, duration]);

  const applyGradient = (text: string) => {
    const wordArray = text.split(" ");
    return wordArray.map((word, index) => {
      const uniqueKey = `${word}-${index}-${text}`;
      if (gradientWords.includes(index + 1)) {
        return (
          <span
            key={uniqueKey}
            className="bg-gradient-to-r from-green-400 to-blue-500 text-transparent bg-clip-text"
          >
            {word}{" "}
          </span>
        );
      }
      return <span key={uniqueKey}>{word} </span>;
    });
  };

  const currentWord = words[index];

  return (
    <div className={cn("overflow-hidden py-2", className)}>
      <AnimatePresence mode="wait">
        {currentWord && (
          <motion.h1
            key={currentWord}
            className={cn("gradient-text", className)}
            {...framerProps}
          >
            {applyGradient(currentWord)}
          </motion.h1>
        )}
      </AnimatePresence>
      <style>{`
        .gradient-text {
          background: linear-gradient(90deg, #4CAF50, #2196F3);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          color: transparent;
        }
      `}</style>
    </div>
  );
}
