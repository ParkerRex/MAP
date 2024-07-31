"use server";

import { createClient } from "@map/supabase/server";
import { unstable_noStore as noStore, revalidatePath } from "next/cache";
import { cookies } from "next/headers";

export const addGoal = async (formData: FormData) => {
  const supabase = createClient();
  const goalText = formData.get("goaltext") as string;
  const source = formData.get("source") || undefined;

  if (!goalText) {
    throw new Error("Goal text is required");
  }

  const when = new Date();
  when.setDate(when.getDate() + 30);

  const result = await supabase
    .from("goal")
    .insert({
      title: goalText,
      completed: false,
      source,
      due_at: when,
    })
    .select();

  console.log({
    goal: result,
  });
  revalidatePath("/home"); // Consistent revalidate path
  return JSON.stringify(result);
};

export const checkGoal = async (id: number, completed: boolean) => {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("goal")
    .update({
      completed: completed,
    })
    .eq("id", id);

  if (error) throw error;

  revalidatePath("/home");
  return data;
};

export const deleteGoal = async (id: number) => {
  const supabase = createClient();

  const { data, error } = await supabase.from("goal").delete().eq("id", id);

  if (error) throw error;

  revalidatePath("/home"); // Consistent revalidate path
  return data; // Assuming you might want to return the deleted data or confirmation
};

export const fetchGoalCompletionStats = async () => {
  const supabase = createClient();

  const { data: totalGoals, error: totalError } = await supabase
    .from("goal")
    .select("*");

  if (totalError) throw totalError;

  const { data: completedGoals, error: completedError } = await supabase
    .from("goal")
    .select("*")
    .eq("completed", true);

  if (completedError) throw completedError;

  const total = totalGoals.length;
  const completed = completedGoals.length;
  const completionPercentage = total === 0 ? 0 : (completed / total) * 100;

  return {
    completionPercentage,
  };
};

export const deleteAllGoalsForUser = async () => {
  const supabase = createClient();

  try {
    const { data, error } = await supabase
      .from("goal")
      .delete()
      .eq("source", "user");

    if (error) {
      console.error("Error deleting goals:", JSON.stringify(error, null, 2));
      throw new Error(`Failed to delete goals: ${JSON.stringify(error)}`);
    }

    revalidatePath("/home");
    return data;
  } catch (err: unknown) {
    console.error("Unhandled error in deleteAllGoalsForUser:", err);
    if (err instanceof Error) {
      throw new Error(`Unhandled exception: ${err.message}`);
    }
    throw new Error(`Unhandled exception: ${JSON.stringify(err)}`);
  }
};
