"use client";

import * as React from "react";

import { Progress } from "@/components/ui/progress";

export function ProgressDemo() {
  const calculateProgress = () => {
    const today = new Date();
    const totalDaysInMonth = new Date(
      today.getFullYear(),
      today.getMonth() + 1,
      0,
    ).getDate();
    const currentDay = today.getDate();
    const daysLeft = totalDaysInMonth - currentDay;
    const progress = ((currentDay / totalDaysInMonth) * 100).toFixed(0); // Calculate progress as a percentage
    return {
      progress: Number(progress),
      daysLeft,
    };
  };

  const [progressData, setProgressData] = React.useState(calculateProgress());

  React.useEffect(() => {
    const timer = setInterval(() => {
      setProgressData(calculateProgress());
    }, 86400000); // Update progress at the start of each new day

    return () => clearInterval(timer);
  }, [calculateProgress]);

  const getUpcomingMonth = () => {
    const today = new Date();
    const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
    return nextMonth.toLocaleString("default", {
      month: "long",
    });
  };

  return (
    <div className="flex items-center">
      <div className="w-[100px]">
        <Progress
          className="bg-slate-200 dark:bg-slate-700"
          value={progressData.progress}
        />
      </div>
      <span className="ml-2 text-xs overflow-hidden text-slate-400 dark:text-slate-200">
        {progressData.daysLeft}d til {getUpcomingMonth()}
      </span>
    </div>
  );
}
