"use client";

import React, { useEffect, useState } from "react";
import CloudScene from "./3d";

export default function ClientCloudScene() {
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    function handleResize() {
      const width = window.innerWidth;
      const height = window.innerHeight;
      setDimensions({ width, height });
      setIsMobile(width < 768); // Adjust this breakpoint as needed
    }

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <CloudScene
      width={dimensions.width}
      height={dimensions.height}
      animationSpeed={0.5}
      isMobile={isMobile}
    />
  );
}
