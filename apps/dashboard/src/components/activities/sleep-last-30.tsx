"use client";
import { Charts } from "@/components/charts/charts";
import type { SleepData } from "@/types/health";
import { Card, CardContent, CardHeader, CardTitle } from "@map/ui/card";
import React, { useMemo } from "react";

export function SleepPerDay({ sleepData }: { sleepData: SleepData[] }) {
  const chartData = useMemo(() => {
    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);

    const last30DaysSleepData = sleepData.filter((sleep) => {
      const sleepDate = new Date(sleep.start);
      return sleepDate >= thirtyDaysAgo;
    });

    const totalSleepPerDay = last30DaysSleepData.reduce(
      (acc, curr) => {
        const day = new Date(curr.start).toISOString().split("T")[0];
        const sleepDuration =
          new Date(curr.end).getTime() - new Date(curr.start).getTime();
        acc[day] = (acc[day] || 0) + sleepDuration;
        return acc;
      },
      {} as Record<string, number>,
    );

    const sleepTimePerDayInHours = Object.entries(totalSleepPerDay).map(
      ([day, durationMs]) => ({
        date: day,
        "Hours of Sleep": durationMs / (1000 * 60 * 60),
      }),
    );

    return sleepTimePerDayInHours.map((day) => ({
      name: day.date,
      "Hours of Sleep": Number.parseFloat(day["Hours of Sleep"].toFixed(2)),
    }));
  }, [sleepData]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sleep duration</CardTitle>
        <p className="text-base font-thin">Last 30 days</p>
      </CardHeader>
      <CardContent>
        <Charts
          type="line"
          className="h-40 custom-sleep-chart"
          data={chartData}
          index="name"
          categories={["Hours of Sleep"]}
          colors={["#3B82F6"]}
          valueFormatter={(sleepData) => {
            const hours = Math.floor(sleepData);
            const minutes = Math.round((sleepData - hours) * 60);
            return `${hours}h ${minutes}m`;
          }}
          yAxisWidth={62}
          showXAxis={false}
          showLegend={false}
        />
      </CardContent>
    </Card>
  );
}
