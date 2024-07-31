"use client";

import type React from "react";
import { useEffect, useState } from "react";

const GradientSeparator: React.FC = () => {
  const [key, setKey] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setKey((prevKey) => prevKey + 1);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full md:w-[620px] h-[3px] bg-gray-300 relative overflow-hidden">
      <div
        key={key}
        className="absolute inset-0 animate-gradientFill"
        style={{
          background: "linear-gradient(to right, #4ade80, #60a5fa)",
          maskImage: "linear-gradient(to right, transparent, black)",
          WebkitMaskImage: "linear-gradient(to right, transparent, black)",
        }}
      />
    </div>
  );
};

export default GradientSeparator;
