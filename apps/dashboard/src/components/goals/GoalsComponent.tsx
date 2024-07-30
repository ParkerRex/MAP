"use client";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@map/ui/card";

import type { Goal } from "@/types/goals";
import { Progress } from "@map/ui/progress";
import { Tooltip, TooltipContent, TooltipTrigger } from "@map/ui/tooltip";
import { useEffect, useOptimistic, useState } from "react";
import { GiMagicBroom } from "react-icons/gi";
import {
  deleteAllGoalsForUser,
  fetchGoalCompletionStats,
} from "../../actions/goalActions";
import AddGoalForm from "./AddGoalForm";
import ScrollArea from "./ui/ScrollArea";

type GoalsComponentProps = {
  goals: Goal[];
  userId: string; // Corrected to string
};

const getCurrentQuarter = () => {
  const today = new Date();
  const quarter = Math.floor(today.getMonth() / 3) + 1;
  return quarter;
};

const getNextQuarterStartDate = () => {
  const today = new Date();
  const quarter = Math.floor(today.getMonth() / 3);
  const nextQuarterStartMonth = (quarter * 3 + 3) % 12;
  const nextQuarterStartDate = new Date(
    today.getFullYear(),
    nextQuarterStartMonth,
    1,
  );
  if (nextQuarterStartDate <= today) {
    nextQuarterStartDate.setFullYear(nextQuarterStartDate.getFullYear() + 1);
  }
  return nextQuarterStartDate;
};

const formatDateDifference = (endDate: Date) => {
  const now = new Date();
  const difference = endDate.getTime() - now.getTime();
  const daysLeft = Math.floor(difference / (1000 * 60 * 60 * 24));
  return `${daysLeft} days left`;
};

const GoalsComponent = ({
  goals,
  className,
  userId,
}: GoalsComponentProps & {
  className?: string;
}) => {
  const [optimisticGoals, setOptimisticGoals] = useOptimistic(goals);
  const [countdown, setCountdown] = useState("");
  const currentQuarter = getCurrentQuarter();
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const updateProgress = async () => {
      const { completionPercentage } = await fetchGoalCompletionStats();
      setProgress(completionPercentage);
    };

    updateProgress();
  }, [goals]);

  useEffect(() => {
    const nextQuarterStartDate = getNextQuarterStartDate();
    setCountdown(formatDateDifference(nextQuarterStartDate));

    const intervalId = setInterval(
      () => {
        setCountdown(formatDateDifference(nextQuarterStartDate));
      },
      1000 * 60 * 60 * 24,
    );

    return () => clearInterval(intervalId);
  }, []);

  const handleClearGoals = async () => {
    await deleteAllGoalsForUser();
    setOptimisticGoals([]); // Clear local state after deleting
  };

  return (
    <Card className={`max-w-[350px] ${className}`}>
      <CardHeader>
        <CardTitle className="flex flex-row items-center gap-2 justify-between">
          <div className="flex flex-row items-center gap-2">
            {`Q${currentQuarter} Goals`}
          </div>
          <div className="flex items-center gap-2">
            <p className="text-xs">{countdown}</p>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={handleClearGoals}
                  className="p-2 rounded-full hover:bg-gray-700"
                >
                  <GiMagicBroom size={20} />
                </button>
              </TooltipTrigger>
              <TooltipContent side="top">Clear all goals</TooltipContent>
            </Tooltip>
          </div>
        </CardTitle>
        <Progress value={progress} className="w-full" />
      </CardHeader>

      <CardContent>
        <ScrollArea
          goals={optimisticGoals}
          setOptimisticGoals={setOptimisticGoals}
        />
      </CardContent>
      <CardFooter>
        <AddGoalForm setOptimisticGoals={setOptimisticGoals} />
      </CardFooter>
    </Card>
  );
};

export default GoalsComponent;
