import { addDays } from "date-fns";
import type { Client } from "../types";
import type { Database } from "../types/db";

type Tables = Database["public"]["Tables"];

// Calendar Events
export async function createCalendarEvent(
  supabase: Client,
  data: Partial<Tables["calendar_events"]["Insert"]>,
) {
  return supabase.from("calendar_events").insert(data).select().single();
}

export async function updateCalendarEvent(
  supabase: Client,
  id: string,
  data: Partial<Tables["calendar_events"]["Update"]>,
) {
  return supabase
    .from("calendar_events")
    .update(data)
    .eq("id", id)
    .select()
    .single();
}

export async function deleteCalendarEvent(supabase: Client, id: string) {
  return supabase
    .from("calendar_events")
    .delete()
    .eq("id", id)
    .select()
    .single();
}

// Calendars
export async function createCalendar(
  supabase: Client,
  data: Partial<Tables["calendars"]["Insert"]>,
) {
  return supabase.from("calendars").insert(data).select().single();
}

export async function updateCalendar(
  supabase: Client,
  id: string,
  data: Partial<Tables["calendars"]["Update"]>,
) {
  return supabase.from("calendars").update(data).eq("id", id).select().single();
}

export async function deleteCalendar(supabase: Client, id: string) {
  return supabase.from("calendars").delete().eq("id", id).select().single();
}

// Folders
export async function createFolder(
  supabase: Client,
  data: Partial<Tables["folder"]["Insert"]>,
) {
  return supabase.from("folder").insert(data).select().single();
}

export async function updateFolder(
  supabase: Client,
  id: string,
  data: Partial<Tables["folder"]["Update"]>,
) {
  return supabase.from("folder").update(data).eq("id", id).select().single();
}

export async function deleteFolder(supabase: Client, id: string) {
  return supabase.from("folder").delete().eq("id", id).select().single();
}

// Goals
export async function createGoal(
  supabase: Client,
  data: Partial<Tables["goals"]["Insert"]>,
) {
  return supabase.from("goals").insert(data).select().single();
}

export async function updateGoal(
  supabase: Client,
  id: string,
  data: Partial<Tables["goals"]["Update"]>,
) {
  return supabase.from("goals").update(data).eq("id", id).select().single();
}

export async function deleteGoal(supabase: Client, id: string) {
  return supabase.from("goals").delete().eq("id", id).select().single();
}

// Notes
export async function createNote(
  supabase: Client,
  data: Partial<Tables["notes"]["Insert"]>,
) {
  return supabase.from("notes").insert(data).select().single();
}

export async function updateNote(
  supabase: Client,
  id: string,
  data: Partial<Tables["notes"]["Update"]>,
) {
  return supabase.from("notes").update(data).eq("id", id).select().single();
}

export async function deleteNote(supabase: Client, id: string) {
  return supabase.from("notes").delete().eq("id", id).select().single();
}

// Tasks
export async function createTask(
  supabase: Client,
  data: Partial<Tables["tasks"]["Insert"]>,
) {
  return supabase.from("tasks").insert(data).select().single();
}

export async function updateTask(
  supabase: Client,
  id: string,
  data: Partial<Tables["tasks"]["Update"]>,
) {
  return supabase.from("tasks").update(data).eq("id", id).select().single();
}

export async function deleteTask(supabase: Client, id: string) {
  return supabase.from("tasks").delete().eq("id", id).select().single();
}

// Users
export async function updateUser(
  supabase: Client,
  id: string,
  data: Partial<Tables["users"]["Update"]>,
) {
  return supabase.from("users").update(data).eq("id", id).select().single();
}

export async function deleteUser(supabase: Client, id: string) {
  return supabase.from("users").delete().eq("id", id).select().single();
}

// Integrations
export async function createIntegration(
  supabase: Client,
  data: Partial<Tables["integrations"]["Insert"]>,
) {
  return supabase.from("integrations").insert(data).select().single();
}

export async function updateIntegration(
  supabase: Client,
  id: string,
  data: Partial<Tables["integrations"]["Update"]>,
) {
  return supabase
    .from("integrations")
    .update(data)
    .eq("id", id)
    .select()
    .single();
}

export async function deleteIntegration(supabase: Client, id: string) {
  return supabase.from("integrations").delete().eq("id", id).select().single();
}
