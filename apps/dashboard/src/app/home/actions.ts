"use server";

import {
  formatForDatabase,
  formatForDisplay,
  getCurrentTimestamp,
  safeParseDate,
  safeToISOString,
} from "@/app/calendar/utils/dateUtils";
import { AuthManager } from "@/lib/integrations/auth";
import { CalendarClient } from "@/lib/integrations/calendar";
import { CalendarSyncService } from "@/services/CalendarSyncService";
import type { Calendar } from "@/types/calendar";
import { createClient } from "@map/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { calendar_v3 } from "googleapis";
import { DateTime } from "luxon";

export async function checkGoogleIntegration(userId: string) {
  const authManager = new AuthManager();
  return authManager.hasIntegration("GOOGLE", userId);
}

export async function syncCalendar(userId: string) {
  const calendarSyncService = new CalendarSyncService();
  return await calendarSyncService.syncCalendar(userId);
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
  const calendarSyncService = new CalendarSyncService();
  return await calendarSyncService.syncCalendar(userId);
}

export async function refreshAllCalendarData() {
  const supabase = createClient();
  const { data: users, error } = await supabase.from("users").select("id");
  if (error) {
    console.error("Error fetching users:", error);
    throw error;
  }
  const calendarSyncService = new CalendarSyncService();
  let totalChanges = 0;
  for (const user of users) {
    try {
      const result = await calendarSyncService.syncCalendar(user.id);
      totalChanges += result.events_synced;
    } catch (error) {
      console.error(
        `Error refreshing calendar data for user ${user.id}:`,
        error,
      );
    }
  }
  return totalChanges;
}

export async function getSyncStatus(userId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("sync_job")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (error) {
    console.error("Error fetching sync status:", error);
    return { status: "error" };
  }

  return data;
}
