"use client";

import type { Goal } from "@/types/goals";
import type React from "react";
import { startTransition, useRef } from "react";
import { useFormStatus } from "react-dom";
import { addGoal } from "../../actions/goalActions";

import { CheckCircleIcon } from "lucide-react";

type AddGoalFormProps = {
  setOptimisticGoals: (
    action: Goal[] | ((pendingState: Goal[]) => Goal[]),
  ) => void;
};

const AddGoalForm = ({ setOptimisticGoals }: AddGoalFormProps) => {
  const formRef = useRef<HTMLFormElement>(null);
  const { pending } = useFormStatus(); // This hook is used to manage form submission state

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!formRef.current) return; // Add null check here
    const formData = new FormData(formRef.current);

    // Create an optimistic goal to update the UI immediately
    const optimisticGoal: Goal = {
      id: Date.now(), // Temporary ID for optimistic update
      title: formData.get("goaltext") as string,
      completed: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      user_id: "temp", // Placeholder, adjust as needed
    };

    // Wrap the optimistic update in startTransition
    startTransition(() => {
      setOptimisticGoals((prev) => [optimisticGoal, ...prev]);
    });

    // Attempt to add the goal to the database
    await addGoal(formData);

    // Reset the form after submission
    formRef.current?.reset();
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="hover:bg-slate-100 hover:dark:bg-slate-800 group flex items-center gap-2 rounded-full duration-200 focus-within:ring-2 w-full px-4 py-4"
      ref={formRef}
    >
      <SubmitButton pending={false} />
      <input
        type="text"
        name="goaltext"
        className="w-full border-none bg-transparent outline-none focus:ring-0 focus:ring-offset-0"
        placeholder="Add goal"
        required
        onInvalid={(e) => e.preventDefault()}
        autoComplete="off"
      />
    </form>
  );
};

type SubmitButtonProps = {
  pending: boolean;
};

const SubmitButton = ({ pending }: SubmitButtonProps) => {
  const { pending: formPending } = useFormStatus();

  return (
    <button type="submit" className="ml-auto" disabled={formPending}>
      {formPending ? (
        <div className="h-5 w-5 animate-spin rounded-full border-t-2" />
      ) : (
        <CheckCircleIcon className="h-5 w-5" />
      )}
    </button>
  );
};

export default AddGoalForm;
