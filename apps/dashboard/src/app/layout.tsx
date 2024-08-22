import "@/styles/globals.css";
import { cn } from "@map/ui/cn";
import "@map/ui/globals.css";
import { Toaster } from "@map/ui/toaster";
import { GeistMono } from "geist/font/mono";
import { GeistSans } from "geist/font/sans";
import type { Metadata } from "next";
import type { ReactElement } from "react";

export const metadata: Metadata = {
  metadataBase: new URL("https://app.mapthemap.com"),
  title: "Map: AI-Powered Health & Productivity Tools | Live Healthier, Work Smarter",
  description:
    "Revolutionize your lifestyle with Map, the cutting-edge AI health-tech company. Our suite of intelligent tools helps you optimize your health and skyrocket your productivity. Experience personalized guidance, smart scheduling, and comprehensive health tracking - all designed to empower you to live healthier and work smarter. Start your journey to peak performance with Map today.",
  openGraph: {
    title: "Map: AI-Powered Health & Productivity Tools | Live Healthier, Work Smarter",
    description:
      "Revolutionize your lifestyle with Map, the cutting-edge AI health-tech company. Our suite of intelligent tools helps you optimize your health and skyrocket your productivity. Experience personalized guidance, smart scheduling, and comprehensive health tracking - all designed to empower you to live healthier and work smarter. Start your journey to peak performance with Map today.",
    url: "https://app.mapthemap.com",
    siteName: "Map: AI-Powered Health & Productivity Tools | Live Healthier, Work Smarter",
    locale: "en_US",
    type: "website",
    images: [
      {
        url: "@opengraph-image.jpg",
        width: 800,
        height: 600,
      },
      {
        url: "@opengraph-image-2.jpg",
        width: 1800,
        height: 1600,
      },
    ],
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: [{ media: "(prefers-color-scheme: light)" }, { media: "(prefers-color-scheme: dark)" }],
};

export const preferredRegion = ["sfo1", "iad1"];
export const maxDuration = 60;

export default function Layout({
  children,
}: {
  children: ReactElement;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn(`${GeistSans.variable} ${GeistMono.variable}`, "whitespace-pre-line overscroll-none")}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
