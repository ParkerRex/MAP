'use client';
import { WhoopWorkout } from '@/lib/integrations/whoop/Workout';
import type { WhoopWorkoutSnapshotIn } from '@/types';
import { Card } from '@tremor/react';
import { BarChart } from '@tremor/react';
import React, { useMemo } from 'react';

export function WorkoutDuration({
  workoutData,
}: {
  workoutData: WhoopWorkoutSnapshotIn[];
}) {
  console.log('workoutData', workoutData);

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
        'Workout duration': durationMs / (1000 * 60 * 60),
      }),
    );

    const chartdata = workoutTimePerDayInHours.map((day) => ({
      name: day.date,
      'Workout duration': Number.parseFloat(day['Workout duration'].toFixed(2)),
    }));
    return chartdata;
  }, [workoutData]);
  console.log(chartData);
  return (
    <Card className="mt-8 rounded-sm">
      <div className="font-bold text-xl mb-2">Workout duration</div>
      <div className="text-base font-thin mb-8">Last 30 days</div>
      <BarChart
        className="h-40"
        data={chartData}
        index="name"
        categories={['Workout duration']}
        colors={['blue']}
        valueFormatter={(value) => {
          const hours = Math.floor(value);
          const minutes = Math.round((value - hours) * 60);
          return `${hours}h ${minutes}m`;
        }}
        yAxisWidth={62}
        showXAxis={false}
        showLegend={false}
      />
    </Card>
  );
}
