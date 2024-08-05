'use client';
import { Card, LineChart } from '@tremor/react';
import React, { useMemo } from 'react';

interface RecoveryEntry {
  created_at: string;
  score: {
    recovery_score: number;
  };
}

interface RecoveryScoreProps {
  recoveryData: RecoveryEntry[];
}

export function RecoveryScore({ recoveryData }: RecoveryScoreProps) {
  const chartData = useMemo(() => {
    return recoveryData.map((entry) => ({
      name: new Date(entry.created_at).toISOString().split('T')[0],
      'Recovery Score': entry.score.recovery_score,
    }));
  }, [recoveryData]);

  return (
    <Card className="rounded-sm">
      <div className="font-bold text-xl mb-2">Whoop Recovery Scores</div>
      <div className="text-base font-thin text-white mb-8">Last 30 days</div>
      <LineChart
        className="h-40 custom-line-chart"
        data={chartData}
        index="name"
        categories={['Recovery Score']}
        colors={['#3B82F6']}
        valueFormatter={(value) => `${value}%`}
        yAxisWidth={62}
        showXAxis={true}
        showLegend={false}
      />
    </Card>
  );
}
