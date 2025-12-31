"use client";

import { useCreateGoal } from "@/hooks/use-goals";
import { CheckCircleIcon } from "lucide-react";
import type React from "react";
import { useRef } from "react";

const AddGoalForm = () => {
  const formRef = useRef<HTMLFormElement>(null);
  const createGoal = useCreateGoal();

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!formRef.current) return;
    const formData = new FormData(formRef.current);
    const title = formData.get("goaltext") as string;

    if (!title.trim()) return;

    createGoal.mutate({ title });
    formRef.current?.reset();
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="hover:bg-slate-100 hover:dark:bg-slate-800 group flex items-center gap-2 rounded-full duration-200 focus-within:ring-2 w-full px-4 py-4"
      ref={formRef}
    >
      <button
        type="submit"
        className="ml-auto"
        disabled={createGoal.isPending}
      >
        {createGoal.isPending ? (
          <div className="h-5 w-5 animate-spin rounded-full border-t-2" />
        ) : (
          <CheckCircleIcon className="h-5 w-5" />
        )}
      </button>
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

export default AddGoalForm;
