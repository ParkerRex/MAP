"use client";
import { Card, CardContent } from "@map/ui/card";
import { Separator } from "@map/ui/separator";
import React, { useMemo } from "react";

interface SleepData {
  id: number;
  start: string;
  end: string;
  score: {
    stage_summary: {
      total_in_bed_time_milli: number;
      total_light_sleep_time_milli: number;
      total_rem_sleep_time_milli: number;
      total_slow_wave_sleep_time_milli: number;
    };
    recovery_score: number;
  };
}

interface IndividualSleepProps {
  sleepData: SleepData[];
}

export function IndividualSleeps({ sleepData }: IndividualSleepProps) {
  const sleepDetails = useMemo(
    () =>
      sleepData.map((sleep) => {
        const startDate = new Date(sleep.start);
        const endDate = new Date(sleep.end);
        const formattedStart = `${startDate.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        })} ${startDate
          .toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
          })
          .toLowerCase()}`;
        const formattedEnd = endDate
          .toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
          })
          .toLowerCase();
        return {
          id: sleep.id,
          totalHours:
            sleep.score.stage_summary.total_in_bed_time_milli /
            (1000 * 60 * 60),
          lightSleep:
            sleep.score.stage_summary.total_light_sleep_time_milli /
            (1000 * 60 * 60),
          remSleep:
            sleep.score.stage_summary.total_rem_sleep_time_milli /
            (1000 * 60 * 60),
          deepSleep:
            sleep.score.stage_summary.total_slow_wave_sleep_time_milli /
            (1000 * 60 * 60),
          recoveryScore: sleep.score.recovery_score,
          start: formattedStart,
          end: formattedEnd,
        };
      }),
    [sleepData],
  );

  return (
    <>
      {sleepDetails.map((detail) => (
        <Card key={detail.id} className="mb-4">
          <CardContent className="flex flex-col h-[140px] p-4">
            <div className="flex flex-col">
              <div className="text-lg font-bold">
                {detail.start}-{detail.end}
              </div>
              <div className="text-sm text-gray-500">
                Total Hours: {detail.totalHours.toFixed(2)}
              </div>
            </div>
            <div className="flex justify-between items-center pt-2">
              <div className="flex flex-col">
                <div className="text-xs">Light:</div>
                <div>{detail.lightSleep.toFixed(2)} hrs</div>
              </div>
              <Separator orientation="vertical" />
              <div className="flex flex-col">
                <div className="text-xs">REM:</div>
                <div>{detail.remSleep.toFixed(2)} hrs</div>
              </div>
              <Separator orientation="vertical" />
              <div className="flex flex-col">
                <div className="text-xs">Deep:</div>
                <div>{detail.deepSleep.toFixed(2)} hrs</div>
              </div>
              <Separator orientation="vertical" />
              <div className="flex flex-col">
                <div className="text-blue-500 text-xs">Recovery:</div>
                <div className="text-sm font-semibold">
                  {detail.recoveryScore}%
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </>
  );
}
