"use server";

import { AuthManager } from "@/lib/integrations/auth";

import { createClient } from "@map/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { calendar_v3 } from "googleapis";

export async function checkGoogleIntegration(userId: string) {
  const authManager = new AuthManager();
  return authManager.hasIntegration("GOOGLE", userId);
}

export async function syncCalendar(userId: string) {
  // TODO: Implement calendar sync logic without CalendarSyncService
  throw new Error("Calendar sync not implemented");
}

async function upsertCalendars(
  supabase: SupabaseClient,
  userId: string,
  calendars: calendar_v3.Schema$CalendarListEntry[],
): Promise<{ calendars_synced: number }> {
  const formattedCalendars = calendars.map((calendar) => ({
    google_calendar_id: calendar.id,
    user_id: userId,
    summary: calendar.summary,
    description: calendar.description,
    time_zone: calendar.timeZone,
    background_color: calendar.backgroundColor,
    foreground_color: calendar.foregroundColor,
    selected: calendar.selected,
    is_primary: calendar.primary,
  }));

  const { error } = await supabase
    .from("calendar")
    .upsert(formattedCalendars, { onConflict: "google_calendar_id,user_id" });

  if (error) {
    console.error("Error upserting calendars:", error);
    throw error;
  }

  return { calendars_synced: formattedCalendars.length };
}

export async function getUserId() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id;
}

export async function initiateGoogleAuth() {
  // This function will return the URL for Google Auth
  // You might need to adjust this based on your actual auth flow
  return "/api/auth/google";
}

export async function refreshCalendarData(userId: string) {
  // TODO: Implement calendar refresh logic without CalendarSyncService
  throw new Error("Calendar refresh not implemented");
}

export async function refreshAllCalendarData() {
  const supabase = createClient();
  const { data: users, error } = await supabase.from("users").select("id");
  if (error) {
    console.error("Error fetching users:", error);
    throw error;
  }
  const totalChanges = 0;
  for (const user of users) {
    try {
      // TODO: Implement calendar sync logic without CalendarSyncService
      // For now, we'll just log a message
      console.log(`Refreshing calendar data for user ${user.id}`);
      // Placeholder for actual sync logic
      // const result = await someFunction(user.id);
      // totalChanges += result.events_synced;
    } catch (error) {
      console.error(
        `Error refreshing calendar data for user ${user.id}:`,
        error,
      );
    }
  }
  return totalChanges;
}
