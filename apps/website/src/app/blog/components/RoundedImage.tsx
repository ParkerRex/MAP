"use client";

import { Skeleton } from "@map/ui/skeleton";
import Image from "next/image";
import type { StaticImageData } from "next/image";
import type React from "react";
import { useState } from "react";

interface RoundedImageProps {
  alt: string;
  src: string | StaticImageData;
  width?: number;
  height?: number;
  className?: string;
}

const RoundedImage: React.FC<RoundedImageProps> = (props) => {
  const [isLoading, setIsLoading] = useState(true);

  const handleLoad = () => {
    setIsLoading(false);
  };

  return (
    <div className="relative">
      {isLoading && <Skeleton className="absolute inset-0" />}
      <Image
        className={`rounded-lg ${props.className}`}
        src={props.src}
        alt={props.alt}
        width={props.width}
        height={props.height}
        onLoad={handleLoad} // Replace onLoadingComplete with onLoad
      />
    </div>
  );
};

export default RoundedImage;
