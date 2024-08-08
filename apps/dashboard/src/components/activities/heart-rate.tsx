"use client";
import { Charts } from "@/components/charts/charts";
import { WhoopWorkout } from "@/lib/integrations/whoop/Workout";
import type { WhoopWorkoutSnapshotIn } from "@/types";
import type { HeartRateData } from "@/types/health";
import { Card, CardContent, CardHeader, CardTitle } from "@map/ui/card";
import React, { useMemo } from "react";

export function HeartRate({
  heartData,
  workoutData,
}: {
  heartData: HeartRateData[];
  workoutData: WhoopWorkoutSnapshotIn[];
}) {
  const chartData = useMemo(() => {
    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);

    const last30DaysWorkoutData = workoutData
      .map((snapshot) => new WhoopWorkout(snapshot))
      .filter((workout) => workout.isAfter(thirtyDaysAgo));

    const heartRateData = last30DaysWorkoutData.reduce(
      (acc, curr) => {
        const day = curr.startDay;
        if (!acc[day]) {
          acc[day] = {
            totalHeartRate: curr.avgHeartRate,
            count: 1,
          };
        } else {
          acc[day].totalHeartRate += curr.avgHeartRate;
          acc[day].count += 1;
        }
        return acc;
      },
      {} as Record<string, { totalHeartRate: number; count: number }>,
    );

    const dailyAverageHeartRate = Object.entries(heartRateData).map(
      ([day, data]) => ({
        date: day,
        averageHeartRate: data.totalHeartRate / data.count,
      }),
    );

    return dailyAverageHeartRate.map((day) => ({
      name: day.date,
      "Average Heart Rate": Math.round(day.averageHeartRate),
    }));
  }, [workoutData]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Avg HR During Workout</CardTitle>
        <p className="text-base font-thin">
          During workouts in the last 30 days
        </p>
      </CardHeader>
      <CardContent>
        <Charts
          type="area"
          className="h-40"
          data={chartData}
          index="name"
          categories={["Average Heart Rate"]}
          colors={["blue"]}
          valueFormatter={(value) => `${value} bpm`}
          yAxisWidth={68}
          showXAxis={false}
          showLegend={false}
        />
      </CardContent>
    </Card>
  );
}
