"use client";

import { useDeleteGoal, useToggleGoal } from "@/hooks/use-goals";
import type { Goal as TGoal } from "@/types/goals";
import { Checkbox } from "@map/ui/checkbox";
import { Cross1Icon } from "@radix-ui/react-icons";

type GoalProps = TGoal;

const Goal = ({ id, title, completed }: GoalProps) => {
  const toggleGoal = useToggleGoal();
  const deleteGoalMutation = useDeleteGoal();

  const handleKeyPress = (event: React.KeyboardEvent, action: () => void) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      action();
    }
  };

  const toggleGoalCompletion = () => {
    toggleGoal.mutate({ goalId: String(id), completed: !completed });
  };

  const handleDelete = () => {
    deleteGoalMutation.mutate(String(id));
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
          className={toggleGoal.isPending ? "opacity-50" : "text-gold-500"}
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
          onClick={handleDelete}
          onKeyPress={(e) => handleKeyPress(e, handleDelete)}
          className="ml-auto"
          disabled={deleteGoalMutation.isPending}
        >
          <Cross1Icon className="h-3 w-3 mr-4" />
        </button>
      </form>
    </div>
  );
};

export default Goal;
