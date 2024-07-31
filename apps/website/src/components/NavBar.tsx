"use client";

import useScrollTop from "@/lib/hooks/use-scroll-top";
import { Button } from "@map/ui/button";
import { Icons } from "@map/ui/icons";
import { Separator } from "@map/ui/separator";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import React from "react";
import { type TOCItem, TableOfContents } from "./TableOfContents";

const DesktopNavBar = ({ isLocalhost, scrolled, pathname, navItems }) => (
  <nav className="fixed top-16 left-10 flex items-center transition-all duration-300 z-50">
    <div className="flex items-center">
      <Link href="/">
        <Button
          variant="secondary"
          className={`transition-all duration-300 px-4 h-10 flex items-center ${
            scrolled
              ? "opacity-100 translate-x-0 mr-6"
              : "opacity-0 -translate-x-full mr-0"
          }`}
        >
          <Icons.Logo className="size-18" />
        </Button>
      </Link>
      <div
        className={`flex transition-all duration-300 ${
          scrolled ? "translate-x-0" : "-translate-x-[69px]"
        }`}
      >
        {navItems.map((item, index) => (
          <Link key={item.href} href={item.href}>
            <div className="relative">
              <Button
                variant="secondary"
                className={`relative z-10 ${index > 0 ? "ml-6" : ""}`}
              >
                {item.label}
              </Button>
              {pathname === item.href && (
                <div
                  className="absolute rounded-md border-gradient-to-r from-green-400 to-blue-500 -z-10"
                  style={{ padding: "2px" }}
                >
                  <div className="w-full h-full bg-secondary rounded-md" />
                </div>
              )}
            </div>
          </Link>
        ))}
        {isLocalhost && (
          <Link href="/login">
            <Button variant="secondary" className="ml-6">
              Login
            </Button>
          </Link>
        )}
      </div>
    </div>
  </nav>
);

const MobileNavBar = ({
  isLocalhost,
  navItems,
  handleNavigation,
  isMobileMenuOpen,
  setIsMobileMenuOpen,
  scrolled,
  tocItems,
}) => (
  <>
    <nav className="fixed top-0 left-0 right-0 flex items-center justify-between px-4 py-2 z-50">
      <Button
        variant="ghost"
        className={`px-2 rounded-full shadow-md hover:shadow-lg transition-all duration-300 bg-white ${
          scrolled ? "opacity-100" : "opacity-0"
        }`}
        onClick={() => handleNavigation("/")}
      >
        <Image src="/logo-light.svg" alt="Logo" width={63} height={18} />
      </Button>
      <Button
        variant="ghost"
        className="rounded-full shadow-md hover:shadow-lg transition-shadow bg-white"
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
      >
        {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
      </Button>
    </nav>

    {!isMobileMenuOpen && tocItems && tocItems.length > 0 && (
      <TableOfContents items={tocItems} title={tocItems[0].title} />
    )}

    <AnimatePresence>
      {isMobileMenuOpen && (
        <motion.div
          className="fixed inset-0 bg-background z-40 pt-16"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex flex-col items-start space-y-6 mt-8 px-4">
            {navItems.map((item, index) => (
              <React.Fragment key={item.href}>
                {index > 0 && <Separator className="w-full my-2" />}
                <Button
                  variant="ghost"
                  className="w-full px-0 text-left flex items-center justify-start"
                  onClick={() => handleNavigation(item.href)}
                >
                  <span className="text-xl mr-4">{`0${index + 1}`}</span>
                  <span className="text-5xl">{item.label}</span>
                </Button>
              </React.Fragment>
            ))}
            {isLocalhost && (
              <>
                <Separator className="w-full my-2" />
                <Button
                  variant="secondary"
                  className="w-full mt-4 text-3xl flex items-center"
                  onClick={() => handleNavigation("/login")}
                >
                  Login
                </Button>
              </>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  </>
);

export default function NavBar({ tocItems }) {
  const [isLocalhost, setIsLocalhost] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const scrolled = useScrollTop(750);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const host = window.location.hostname;
    setIsLocalhost(host.includes("localhost") || host.includes("127.0.0.1"));

    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const navItems = [
    { href: "/about-us", label: "About Us" },
    { href: "/master-plan", label: "Master Plan" },
    { href: "/culture", label: "Culture" },
    // { href: "/careers", label: "Careers" },
  ];

  const handleNavigation = (href: string) => {
    setIsMobileMenuOpen(false);
    router.push(href);
  };

  return isMobile ? (
    <MobileNavBar
      isLocalhost={isLocalhost}
      navItems={navItems}
      handleNavigation={handleNavigation}
      isMobileMenuOpen={isMobileMenuOpen}
      setIsMobileMenuOpen={setIsMobileMenuOpen}
      scrolled={scrolled}
      tocItems={tocItems}
    />
  ) : (
    <DesktopNavBar
      isLocalhost={isLocalhost}
      scrolled={scrolled}
      pathname={pathname}
      navItems={navItems}
    />
  );
}
