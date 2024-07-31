import type { Metadata } from "next";
import "./globals.css";

import { cn } from "@map/ui/cn";
import { GeistMono } from "geist/font/mono";
import { GeistSans } from "geist/font/sans";

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: "Midday | Run your business smarter",
    template: "%s | Midday",
  },
  description:
    "Midday provides you with greater insight into your business and automates the boring tasks, allowing you to focus on what you love to do instead.",
  openGraph: {
    title: "Midday | Run your business smarter",
    description: "This is my portfolio.",
    url: baseUrl,
    siteName:
      "Midday provides you with greater insight into your business and automates the boring tasks, allowing you to focus on what you love to do instead.",
    locale: "en_US",
    type: "website",
    images: [
      {
        url: "https://cdn.midday.ai/opengraph-image.jpg",
        width: 800,
        height: 600,
      },
      {
        url: "https://cdn.midday.ai/opengraph-image.jpg",
        width: 1800,
        height: 1600,
      },
    ],
  },
  twitter: {
    title: "Midday | Run your business smarter",
    description: "This is my portfolio.",
    images: [
      {
        url: "https://cdn.midday.ai/opengraph-image.jpg",
        width: 800,
        height: 600,
      },
      {
        url: "https://cdn.midday.ai/opengraph-image.jpg",
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
    <html lang="en">
      <body
        className={cn(
          "font-sans antialiased dark:bg-black",
          GeistSans.variable,
          GeistMono.variable,
        )}
      >
        {children}
      </body>
    </html>
  );
}
