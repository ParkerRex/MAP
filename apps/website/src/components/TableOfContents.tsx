"use client";
import { Button } from "@map/ui/button";
import { ChevronDown, ChevronUp } from "lucide-react";
import type React from "react";
import { useEffect, useState } from "react";

export interface TOCItem {
  id: string;
  title: string;
  level: number;
}

interface TableOfContentsProps {
  items: TOCItem[];
  title?: string;
}

export const TableOfContents: React.FC<TableOfContentsProps> = ({
  items = [],
  title,
}) => {
  if (items.length === 0) return null;

  const [activeId, setActiveId] = useState<string>("");
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const observers: IntersectionObserver[] = [];
    const handleIntersect = (entries: IntersectionObserverEntry[]) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          setActiveId(entry.target.id);
        }
      }
    };

    const observerOptions = {
      rootMargin: "-10% 0px -85% 0px",
      threshold: 0,
    };

    for (const item of items) {
      const element = document.getElementById(item.id);
      if (element) {
        const observer = new IntersectionObserver(
          handleIntersect,
          observerOptions,
        );
        observer.observe(element);
        observers.push(observer);
      }
    }

    return () => {
      for (const observer of observers) {
        observer.disconnect();
      }
    };
  }, [items]);

  const toggleOpen = () => setIsOpen(!isOpen);

  const currentTitle =
    items.find((item) => item.id === activeId)?.title || title || "Contents";

  return (
    <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50">
      <div className="w-[220px]">
        <Button
          variant="secondary"
          className="w-full flex items-center justify-between"
          onClick={toggleOpen}
        >
          <span className="truncate">{currentTitle}</span>
          {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </Button>
        {isOpen && (
          <nav className="mt-2 bg-white rounded-md shadow-lg max-h-[60vh] overflow-y-auto">
            <ul className="p-2 space-y-2">
              {items.map((item, index) => (
                <li key={item.id}>
                  <a
                    href={`#${item.id}`}
                    className={`block py-1 px-2 rounded ${
                      activeId === item.id
                        ? "bg-gray-100 font-semibold"
                        : "text-gray-600"
                    }`}
                    onClick={() => setIsOpen(false)}
                  >
                    {`${index + 1}. ${item.title}`}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        )}
      </div>
    </div>
  );
};
