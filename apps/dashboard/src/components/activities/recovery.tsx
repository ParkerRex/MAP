"use client";
import { Charts } from "@/components/charts/charts";
import { Card, CardContent, CardHeader, CardTitle } from "@map/ui/card";
import React, { useMemo } from "react";

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
      name: new Date(entry.created_at).toISOString().split("T")[0],
      "Recovery Score": entry.score.recovery_score,
    }));
  }, [recoveryData]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Whoop Recovery Scores</CardTitle>
        <p className="text-base font-thin text-white">Last 30 days</p>
      </CardHeader>
      <CardContent>
        <Charts
          type="line"
          className="h-40 custom-line-chart"
          data={chartData}
          index="name"
          categories={["Recovery Score"]}
          colors={["#3B82F6"]}
          valueFormatter={(value) => `${value}%`}
          yAxisWidth={62}
          showXAxis={true}
          showLegend={false}
        />
      </CardContent>
    </Card>
  );
}
