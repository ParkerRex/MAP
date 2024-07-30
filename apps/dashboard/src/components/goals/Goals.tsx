import { createClient } from "@map/supabase/server";
import GoalsComponent from "./GoalsComponent";

const Goals = async () => {
  const supabase = createClient();

  const { data: goalsData, error } = await supabase
    .from("goal")
    .select("id, title, completed, created_at, updated_at, user_id")
    .order("completed", {
      ascending: true,
    })
    .order("created_at", {
      ascending: false,
    });

  if (error) {
    console.error(error);
    // Optionally handle the error more gracefully
  }

  // Ensure goals is always an array
  const goals = goalsData || [];

  return (
    <main className="">
      <GoalsComponent goals={goals} userId={""} />
    </main>
  );
};
export default Goals;
