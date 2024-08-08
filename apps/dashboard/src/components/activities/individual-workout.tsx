"use client";
import { Charts } from "@/components/charts/charts";
import { WhoopWorkout } from "@/lib/integrations/whoop/Workout";
import type { WhoopWorkoutSnapshotIn } from "@/types";
import { Card, CardContent } from "@map/ui/card";
import { Separator } from "@map/ui/separator";
import React from "react";

interface IndividualWorkoutsProps {
  workouts: WhoopWorkoutSnapshotIn[];
}

export function IndividualWorkouts({ workouts }: IndividualWorkoutsProps) {
  return (
    <>
      {workouts
        .map((snapshot) => new WhoopWorkout(snapshot))
        .map((workout) => (
          <Card key={workout.id} className="mb-4">
            <CardContent className="flex flex-col p-4 h-[140px]">
              <div className="flex flex-col">
                <div className="text-lg font-bold mb-4">
                  {" "}
                  {workout.activityName}
                </div>
                <div className="text-sm text-gray-500">{workout.startTime}</div>
              </div>
              <div className="flex justify-between items-center pt-2">
                <div className="flex flex-col">
                  <div className="text-xs">Max HR: </div>
                  <div className="">{workout.maxHeartRate} bpm</div>
                </div>
                <Separator orientation="vertical" />

                <div className="flex flex-col">
                  <div className="text-xs">Calories:</div>
                  <div className="">{Math.round(workout.calories)}</div>
                </div>
                <Separator orientation="vertical" />
                <div className="flex flex-col">
                  <div className="text-blue-500 text-xs">{workout.strain}</div>
                  <Charts
                    type="progress"
                    value={workout.strainPercentage}
                    radius={21}
                    tooltip={`Strain: ${workout.strainPercentage}%`}
                    size="xs"
                    className="size-6"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
    </>
  );
}
