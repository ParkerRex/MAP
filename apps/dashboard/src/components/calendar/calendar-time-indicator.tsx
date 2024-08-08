"use client";
import { useCalendar } from "@/store/calendar-context";
import { DateTime } from "luxon";
import { useEffect, useState } from "react";

const CurrentTimeIndicator = () => {
  const { userTimeZone } = useCalendar();
  const [currentTime, setCurrentTime] = useState(
    DateTime.now().setZone(userTimeZone),
  );

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(DateTime.now().setZone(userTimeZone));
    }, 1000);

    return () => clearInterval(timer);
  }, [userTimeZone]);

  const topOffset = currentTime.hour * 4 + currentTime.minute / 15 + 0.5;

  return (
    <div
      className="absolute left-0 right-0 z-20 flex items-center"
      style={{ top: `${topOffset}rem` }}
    >
      <div className="w-16 flex-shrink-0 text-right pr-2">
        <span className="text-[10px] text-red-500 font-mono">
          {currentTime.toFormat("h:mm:ss a")}
        </span>
      </div>
      <div className="flex-grow border-t border-red-500 border-dotted" />
    </div>
  );
};

export default CurrentTimeIndicator;
