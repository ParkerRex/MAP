import { GeistMono } from "geist/font/mono";
import { GeistSans } from "geist/font/sans";
import { Header } from "@/components/header";
import { Sidebar } from "@/components/sidebar";
import { cn } from "@/components/ui/cn";
import { Providers } from "./providers";
import "@/styles/globals.css";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn(
          "font-sans antialiased min-h-screen bg-background",
          GeistSans.variable,
          GeistMono.variable,
        )}
      >
        <Providers>
          <div className="relative">
            <Sidebar />
            <div className="mx-4 md:ml-[95px] md:mr-10 pb-8">
              <Header />
              {children}
            </div>
          </div>
        </Providers>
      </body>
    </html>
  );
}
