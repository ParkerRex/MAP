import type { Client } from "../types";

// Existing queries
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

// New query stubs

export async function getCalendarEventsQuery(supabase: Client, userId: string) {
  return supabase
    .from("calendar_events")
    .select("*")
    .eq("user_id", userId)
    .order("start_time", { ascending: true })
    .throwOnError();
}

export async function getCalendarsQuery(supabase: Client, userId: string) {
  return supabase
    .from("calendars")
    .select("*")
    .eq("user_id", userId)
    .throwOnError();
}

export async function getFoldersQuery(supabase: Client, userId: string) {
  return supabase
    .from("folder")
    .select("*")
    .eq("user_id", userId)
    .throwOnError();
}

export async function getHeadersQuery(supabase: Client, userId: string) {
  return supabase
    .from("headers")
    .select("*")
    .eq("user_id", userId)
    .is("deleted_at", null)
    .throwOnError();
}

export async function getIntegrationsQuery(supabase: Client, userId: string) {
  return supabase
    .from("integrations")
    .select("*")
    .eq("user_id", userId)
    .throwOnError();
}

export async function getNotesQuery(supabase: Client, userId: string) {
  return supabase
    .from("notes")
    .select("*")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false })
    .throwOnError();
}

export async function getTagsQuery(supabase: Client, userId: string) {
  return supabase.from("tags").select("*").eq("user_id", userId).throwOnError();
}

export async function getTagTasksQuery(supabase: Client, taskId: string) {
  return supabase
    .from("tag_tasks")
    .select("*")
    .eq("task_id", taskId)
    .throwOnError();
}
