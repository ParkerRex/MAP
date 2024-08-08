"use client";
import { Charts } from "@/components/charts/charts";
import { WhoopWorkout } from "@/lib/integrations/whoop/Workout";
import type { WhoopWorkoutSnapshotIn } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@map/ui/card";
import React, { useMemo } from "react";

export function WorkoutDuration({
  workoutData,
}: {
  workoutData: WhoopWorkoutSnapshotIn[];
}) {
  const chartData = useMemo(() => {
    // @ts-ignore
    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);

    const last30DaysWorkout = workoutData
      .map((s) => new WhoopWorkout(s))
      .filter((workout) => workout.isAfter(thirtyDaysAgo));

    const totalWorkoutPerDay = last30DaysWorkout.reduce(
      (acc, curr) => {
        const day = curr.startDay;
        acc[day] = (acc[day] || 0) + curr.duration;
        return acc;
      },
      {} as {
        [key: string]: number;
      },
    );

    const workoutTimePerDayInHours = Object.entries(totalWorkoutPerDay).map(
      ([day, durationMs]) => ({
        date: day,
        "Workout duration": durationMs / (1000 * 60 * 60),
      }),
    );

    const chartdata = workoutTimePerDayInHours.map((day) => ({
      name: day.date,
      "Workout duration": Number.parseFloat(day["Workout duration"].toFixed(2)),
    }));
    return chartdata;
  }, [workoutData]);

  return (
    <Card className="mt-8">
      <CardHeader>
        <CardTitle>Workout duration</CardTitle>
        <p className="text-base font-thin">Last 30 days</p>
      </CardHeader>
      <CardContent>
        <Charts
          type="bar"
          className="h-40"
          data={chartData}
          index="name"
          categories={["Workout duration"]}
          colors={["blue"]}
          valueFormatter={(value) => {
            const hours = Math.floor(value);
            const minutes = Math.round((value - hours) * 60);
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
