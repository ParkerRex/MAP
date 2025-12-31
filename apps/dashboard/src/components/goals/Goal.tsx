"use client";

import { useDeleteGoal, useToggleGoal } from "@/hooks/use-goals";
import type { Goal as TGoal } from "@/types/goals";
import { Checkbox } from "@map/ui/checkbox";
import { Cross1Icon } from "@radix-ui/react-icons";
import { useTransition } from "react";

// TODO: update to use reacthook form and allow user to click label to complete

type GoalProps = TGoal & {
  setOptimisticGoals: (
    action: TGoal[] | ((pendingState: TGoal[]) => TGoal[]),
  ) => void;
};

const Goal = ({ id, title, completed, setOptimisticGoals }: GoalProps) => {
  const [isPending, startTransition] = useTransition();
  const toggleGoal = useToggleGoal();
  const deleteGoalMutation = useDeleteGoal();

  const handleKeyPress = (event: React.KeyboardEvent, action: () => void) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      action();
    }
  };

  const toggleGoalCompletion = () => {
    startTransition(() => {
      setOptimisticGoals((prev) => {
        return prev.map((goal) => {
          if (goal.id === id) {
            return {
              ...goal,
              completed: !goal.completed,
            };
          }
          return goal;
        });
      });

      toggleGoal.mutate({ goalId: String(id), completed: !completed });
    });
  };

  return (
    <div className="rounded px-2 py-1">
      <form className="flex items-center gap-2">
        <Checkbox
          checked={completed}
          id={`complete-goal-${id}`}
          name="completed"
          onChange={toggleGoalCompletion}
          onKeyPress={(e) => handleKeyPress(e, toggleGoalCompletion)}
          onClick={toggleGoalCompletion}
          className={` ${isPending ? "opacity-50" : "text-gold-500"}`}
        />
        <label
          htmlFor={`complete-goal-${id}`}
          className={`text-sm ${completed ? "line-through" : ""}`}
          onChange={toggleGoalCompletion}
          onKeyPress={(e) => handleKeyPress(e, toggleGoalCompletion)}
          onClick={toggleGoalCompletion}
        >
          {title}
        </label>
        <button
          type="button"
          onClick={() => {
            startTransition(() => {
              setOptimisticGoals((prev) => {
                return prev.filter((goal) => goal.id !== id);
              });

              deleteGoalMutation.mutate(String(id));
            });
          }}
          onKeyPress={(e) =>
            handleKeyPress(e, () => {
              startTransition(() => {
                setOptimisticGoals((prev) => {
                  return prev.filter((goal) => goal.id !== id);
                });

                deleteGoalMutation.mutate(String(id));
              });
            })
          }
          className="ml-auto"
        >
          <Cross1Icon className="h-3 w-3 mr-4" />
        </button>
      </form>
    </div>
  );
};

export default Goal;
