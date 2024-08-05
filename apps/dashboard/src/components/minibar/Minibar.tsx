import React from "react";
import { ProgressDemo } from "./Progress";
import WeatherMiniBar from "./Weather";

export default function Minibar() {
  return (
    <div className="hidden sm:flex select-none h-[24px] w-full items-center justify-between dark:text-white text-slate-400 bg-white dark:bg-black border-t border-slate-100 dark:border-slate-800 overflow-x-hidden">
      <div className="hidden md:flex">
        <WeatherMiniBar />
      </div>
      <div className="hidden md:flex pr-2">
        <ProgressDemo />
      </div>
    </div>
  );
}
