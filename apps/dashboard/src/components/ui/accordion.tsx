"use client";

import { cn } from "@/components/ui/cn";
import * as AccordionPrimitive from "@radix-ui/react-accordion";
import * as React from "react";
import { CiCircleMinus, CiCirclePlus } from "react-icons/ci";

const Accordion = AccordionPrimitive.Root;

const AccordionItem = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Item>
>(({ className, ...props }, ref) => (
  <AccordionPrimitive.Item
    ref={ref}
    className={cn("border-b border-gray-200", className)}
    {...props}
  />
));
AccordionItem.displayName = "AccordionItem";

const AccordionTrigger = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Trigger> & {
    sectionNumber?: string;
  }
>(({ className, children, sectionNumber, ...props }, ref) => {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <AccordionPrimitive.Header className="flex">
      <AccordionPrimitive.Trigger
        ref={ref}
        className={cn(
          "flex flex-1 items-center justify-between py-6 text-[26px] font-medium transition-all relative group",
          className,
        )}
        onClick={() => setIsOpen((prev) => !prev)}
        {...props}
      >
        <div className="flex items-center relative">
          {sectionNumber && (
            <span className="text-[14px] mr-4 text-black">{sectionNumber}</span>
          )}
          <span className="link link-underline link-underline-black">
            {children}
          </span>
        </div>
        <svg width="0" height="0" aria-hidden="true">
          <linearGradient
            id="blue-green-gradient"
            x1="100%"
            y1="100%"
            x2="0%"
            y2="0%"
          >
            <stop stopColor="#4ade80" offset="0%" />
            <stop stopColor="#60a5fa" offset="100%" />
          </linearGradient>
        </svg>
        {isOpen ? (
          <CiCircleMinus
            className="h-12 w-12 shrink-0 transition-transform duration-200 filter drop-shadow-[0_0_3px_rgba(96,165,250,0.5)] group-hover:blur-[1px]"
            style={{ fill: "url(#blue-green-gradient)" }}
          />
        ) : (
          <CiCirclePlus
            className="h-12 w-12 shrink-0 transition-transform duration-200 filter drop-shadow-[0_0_3px_rgba(74,222,128,0.5)] group-hover:blur-[1px]"
            style={{ fill: "url(#blue-green-gradient)" }}
          />
        )}
      </AccordionPrimitive.Trigger>
    </AccordionPrimitive.Header>
  );
});

AccordionTrigger.displayName = AccordionPrimitive.Trigger.displayName;

const AccordionContent = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <AccordionPrimitive.Content
    ref={ref}
    className="overflow-hidden text-[16px] data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down"
    {...props}
  >
    <div className={cn("pb-6 pt-0", className)}>{children}</div>
  </AccordionPrimitive.Content>
));
AccordionContent.displayName = AccordionPrimitive.Content.displayName;

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent };
