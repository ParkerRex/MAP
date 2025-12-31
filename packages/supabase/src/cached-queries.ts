import { createClient } from "./client/server";

export async function getUser(userId: string) {
  const supabase = createClient();
  const { data: user, error } = await supabase.from("users").select("*").eq("id", userId).single();

  if (error) {
    console.error("Error fetching user:", error);
    return null;
  }

  return user;
}
