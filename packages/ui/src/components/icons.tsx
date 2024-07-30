"use client";

import { cn } from "@map/ui/cn";

function IconLogo({ className, ...props }: React.ComponentProps<"svg">) {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 17 17"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      role="img"
      className={cn("inline-block", className)}
      {...props}
    >
      <title>Map Logo</title>
      <path
        d="M16.7349 16.3187C16.8624 16.6465 16.6206 17 16.2689 17H0.729964C0.378526 17 0.136753 16.647 0.263756 16.3193L6.46494 0.31931C6.53953 0.126844 6.72473 0 6.93115 0H10.0441C10.2502 0 10.4353 0.12656 10.51 0.31871L16.7349 16.3187ZM11.2937 14.2119C11.6373 14.2119 11.8785 13.8734 11.7663 13.5486L8.94738 5.3896C8.79226 4.94064 8.15732 4.94064 8.0022 5.3896L5.18324 13.5486C5.07105 13.8734 5.31226 14.2119 5.65583 14.2119H11.2937Z"
        fill="url(#paint0_linear_487_4911)"
      />
      <defs>
        <linearGradient
          id="paint0_linear_487_4911"
          x1="8.49994"
          y1="0"
          x2="8.49994"
          y2="17"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#4A4A4A" />
          <stop offset="1" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export { IconLogo };
