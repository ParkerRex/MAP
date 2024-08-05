'use client';
import { BarChart, Card } from '@tremor/react';
import React, { useMemo } from 'react';
import type { SleepData, SleepStageSummary } from '@/types/health';

export function SleepComposition({
  sleepData,
}: {
  sleepData: SleepData[];
}) {
  const chartData = useMemo(() => {
    const sleepCompositionByDay = sleepData.reduce(
      (acc: Record<string, SleepStageSummary>, curr) => {
        const day = new Date(curr.start).toISOString().split('T')[0];
        if (!acc[day]) {
          acc[day] = {
            total_rem_sleep_time_milli: 0,
            total_light_sleep_time_milli: 0,
            total_slow_wave_sleep_time_milli: 0,
            total_awake_time_milli: 0,
          };
        }
        acc[day].total_rem_sleep_time_milli +=
          curr.score.stage_summary.total_rem_sleep_time_milli;
        acc[day].total_light_sleep_time_milli +=
          curr.score.stage_summary.total_light_sleep_time_milli;
        acc[day].total_slow_wave_sleep_time_milli +=
          curr.score.stage_summary.total_slow_wave_sleep_time_milli;
        acc[day].total_awake_time_milli +=
          curr.score.stage_summary.total_awake_time_milli;
        return acc;
      },
      {},
    );

    return Object.entries(sleepCompositionByDay).map(([date, composition]) => ({
      name: date,
      REM: composition.total_rem_sleep_time_milli,
      Light: composition.total_light_sleep_time_milli,
      Deep: composition.total_slow_wave_sleep_time_milli,
      Awake: composition.total_awake_time_milli,
    }));
  }, [sleepData]);

  return (
    <Card className="p-4 rounded-sm">
      <h2 className="text-lg font-bold mb-2">Sleep Composition by Day</h2>
      <BarChart
        data={chartData}
        index="name"
        categories={['REM', 'Light', 'Deep', 'Awake']}
        colors={['blue', 'teal', 'amber', 'rose']}
        valueFormatter={(value) => `${(value / (1000 * 60 * 60)).toFixed(2)}h`}
        yAxisWidth={48}
      />
    </Card>
  );
}
