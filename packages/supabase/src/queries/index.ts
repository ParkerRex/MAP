import type { Client } from "../types";

export async function getUserQuery(supabase: Client, userId: string) {
  return supabase.from("users").select("*").eq("id", userId).throwOnError();
}

export async function getGoalsQuery(supabase: Client, userId: string) {
  return supabase
    .from("goals")
    .select("*")
    .eq("user_id", userId)
    .order("due_at", { ascending: true })
    .throwOnError();
}

export async function getTasksQuery(supabase: Client, userId: string) {
  return supabase
    .from("tasks")
    .select(`
      *,
      project:project_id(*),
      header:header_id(*),
      assigned:assigned_to(*)
    `)
    .eq("created_by", userId)
    .order("due_at", { ascending: true })
    .throwOnError();
}

export async function getProjectsQuery(supabase: Client, userId: string) {
  return supabase
    .from("projects")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .throwOnError();
}
