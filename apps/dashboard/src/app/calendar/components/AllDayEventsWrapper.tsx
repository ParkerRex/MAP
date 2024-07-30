"use client";

import { Button } from "@map/ui/button";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import type { ExtendedEvent } from "@/types/calendar";
import { safeParseDate } from "../utils/dateUtils";
import AllDayEventsContent from "./AllDayEventsContent";

interface AllDayEventsWrapperProps {
  events: ExtendedEvent[];
  daysOfWeek: Date[];
}

const AllDayEventsWrapper: React.FC<AllDayEventsWrapperProps> = ({
  events,
  daysOfWeek,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleExpand = () => setIsExpanded(!isExpanded);

  const allDayEvents = events.filter((event) => {
    if (event.all_day === true) return true;
    const startDate = safeParseDate(event.start?.dateTime || event.start?.date);
    const endDate = safeParseDate(event.end?.dateTime || event.end?.date);
    if (!startDate || !endDate) return false;
    return endDate.diff(startDate, "hours").hours >= 24;
  });

  console.log("All-day events:", allDayEvents);
  const visibleEvents = isExpanded ? allDayEvents : allDayEvents.slice(0, 2);
  const hiddenEventsCount = allDayEvents.length - visibleEvents.length;

  return (
    <div className="border-b border-gray-200">
      <div className="flex justify-between items-center px-4 py-2">
        <span className="text-sm font-medium">All-Day Events</span>
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleExpand}
          aria-expanded={isExpanded}
          aria-label={
            isExpanded ? "Collapse all-day events" : "Expand all-day events"
          }
        >
          {isExpanded ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </Button>
      </div>
      <div
        className={`transition-all duration-300 ease-in-out ${
          isExpanded ? "max-h-[1000px]" : "max-h-24"
        } overflow-hidden`}
      >
        <AllDayEventsContent events={allDayEvents} daysOfWeek={daysOfWeek} />
      </div>
      {!isExpanded && hiddenEventsCount > 0 && (
        <div className="text-sm text-gray-500 px-4 py-2">
          +{hiddenEventsCount} more event{hiddenEventsCount > 1 ? "s" : ""}
        </div>
      )}
    </div>
  );
};

export default AllDayEventsWrapper;
