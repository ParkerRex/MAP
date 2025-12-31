"use client";

import { useGoals } from "@/hooks/use-goals";
import GoalsComponent from "./GoalsComponent";

const Goals = () => {
  const { data, isLoading } = useGoals();

  if (isLoading) {
    return <div className="animate-pulse">Loading goals...</div>;
  }

  const goals = data?.goals ?? [];

  return (
    <main className="">
      <GoalsComponent goals={goals} />
    </main>
  );
};

export default Goals;
