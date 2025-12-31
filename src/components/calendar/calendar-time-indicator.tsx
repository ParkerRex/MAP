"use client";
import { useCalendarStore } from "@/store/calendar";
import { format, getHours, getMinutes } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import { useEffect, useState } from "react";

const CurrentTimeIndicator = () => {
  const userTimeZone = useCalendarStore((s) => s.userTimeZone);
  const [currentTime, setCurrentTime] = useState(() => toZonedTime(new Date(), userTimeZone));

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(toZonedTime(new Date(), userTimeZone));
    }, 1000);

    return () => clearInterval(timer);
  }, [userTimeZone]);

  const topOffset = getHours(currentTime) * 4 + getMinutes(currentTime) / 15 + 0.5;

  return (
    <div
      className="absolute left-0 right-0 z-20 flex items-center"
      style={{ top: `${topOffset}rem` }}
    >
      <div className="w-16 flex-shrink-0 text-right pr-2">
        <span className="text-[10px] text-red-500 font-mono">
          {format(currentTime, "h:mm:ss a")}
        </span>
      </div>
      <div className="flex-grow border-t border-red-500 border-dotted" />
    </div>
  );
};

export default CurrentTimeIndicator;
