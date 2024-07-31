import type { Metadata } from "next";
import "@/styles/globals.css";

import NavBar from "@/components/NavBar";
import Footer from "@/components/marketing-footer";
import { cn } from "@map/ui/cn";
import { GeistMono } from "geist/font/mono";
import { GeistSans } from "geist/font/sans";
import { baseUrl } from "./sitemap";

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default:
      "Map: AI-Powered Health & Productivity Tools | Live Healthier, Work Smarter",
    template: "%s | Map",
  },
  description:
    "Revolutionize your lifestyle with Map, the cutting-edge AI health-tech company. Our suite of intelligent tools helps you optimize your health and skyrocket your productivity. Experience personalized guidance, smart scheduling, and comprehensive health tracking - all designed to empower you to live healthier and work smarter. Start your journey to peak performance with Map today.",
  openGraph: {
    title:
      "Map: AI-Powered Health & Productivity Tools | Live Healthier, Work Smarter",
    description:
      "Revolutionize your lifestyle with Map, the cutting-edge AI health-tech company. Our suite of intelligent tools helps you optimize your health and skyrocket your productivity. Experience personalized guidance, smart scheduling, and comprehensive health tracking - all designed to empower you to live healthier and work smarter. Start your journey to peak performance with Map today.",
    url: baseUrl,
    siteName:
      "Map: AI-Powered Health & Productivity Tools | Live Healthier, Work Smarter",
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
  twitter: {
    title:
      "Map: AI-Powered Health & Productivity Tools | Live Healthier, Work Smarter",
    description:
      "Revolutionize your lifestyle with Map, the cutting-edge AI health-tech company. Our suite of intelligent tools helps you optimize your health and skyrocket your productivity. Experience personalized guidance, smart scheduling, and comprehensive health tracking - all designed to empower you to live healthier and work smarter. Start your journey to peak performance with Map today.",
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
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <NavBar tocItems={undefined} />

      <body
        className={cn(
          "font-sans antialiased dark:bg-black",
          GeistSans.variable,
          GeistMono.variable,
        )}
      >
        {children}
      </body>
      <Footer />
    </html>
  );
}
