import {
  formatForDatabase,
  getCurrentTimestamp,
  safeParseDate,
  safeToISOString,
} from "@/app/calendar/utils/dateUtils";
import { AuthManager } from "@/lib/integrations/auth";
import { CalendarClient } from "@/lib/integrations/calendar";
import type { Calendar, CalendarEvent, SyncResult } from "@/types/calendar";
import type { SyncError, SyncJob, SyncJobStatus } from "@/types/jobs";
import { createClient } from "@map/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { DateTime } from "luxon";

export class CalendarSyncService {
  private supabase: SupabaseClient;
  private authManager: AuthManager;

  constructor() {
    this.supabase = createClient();
    this.authManager = new AuthManager();
  }

  async syncCalendar(userId: string, calendarId?: string): Promise<SyncResult> {
    console.log(`Starting calendar sync for user: ${userId}`);
    const jobId = await this.createSyncJob(userId);

    try {
      await this.updateSyncJobStatus(jobId, "in_progress");

      // Check and refresh token if needed before syncing
      await this.checkAndRefreshToken(userId);

      const accessToken = await this.authManager.getAccessToken(
        "GOOGLE",
        userId,
      );
      if (!accessToken) {
        throw new Error("Unable to retrieve access token");
      }

      const calendarClient = new CalendarClient(accessToken, "UTC", userId);

      let calendars: Calendar[];
      if (calendarId) {
        const calendar = await calendarClient.getCalendar(calendarId);
        calendars = calendar ? [calendar] : [];
      } else {
        calendars = await calendarClient.listCalendars();
      }

      const { data: syncResult } = await this.supabase.rpc("sync_calendars", {
        p_user_id: userId,
        p_calendars: JSON.stringify(calendars),
      });

      if (!syncResult) {
        throw new Error("Sync result is null");
      }

      const result: SyncResult = {
        calendars_synced: syncResult.calendars_synced || 0,
        events_synced: syncResult.events_synced || 0,
      };

      await this.updateSyncJobStatus(jobId, "completed", result);

      return result;
    } catch (error) {
      console.error(`Error during sync for user ${userId}:`, error);
      await this.updateSyncJobStatus(jobId, "error", {
        error_message: error instanceof Error ? error.message : "Unknown error",
      });
      throw error;
    }
  }
  private async createSyncJob(userId: string): Promise<string> {
    const { data, error } = await this.supabase
      .from("sync_job")
      .insert({
        user_id: userId,
        status: "pending",
        job_type: "calendar_sync",
        details: null,
        updated_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (error) {
      console.error("Error creating sync job:", error);
      throw new Error("Failed to create sync job");
    }

    return data.id;
  }

  private async updateSyncJobStatus(
    jobId: string,
    status: SyncJobStatus,
    details?: Record<string, unknown> | SyncResult,
  ): Promise<void> {
    const { error } = await this.supabase
      .from("sync_job")
      .update({
        status,
        details: details ? JSON.stringify(details) : null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", jobId);

    if (error) {
      console.error("Error updating sync job status:", error);
    }
  }

  private async checkAndRefreshToken(userId: string): Promise<void> {
    try {
      const tokenData = await this.authManager.retrieveToken("GOOGLE", userId);
      if (!tokenData) {
        console.error("No token found for user:", userId);
        return;
      }

      const expiresAt = safeParseDate(tokenData.expires_at);
      const now = DateTime.now();
      const fiveMinutesFromNow = now.plus({ minutes: 5 });

      if (expiresAt <= fiveMinutesFromNow) {
        console.log("Token is about to expire, refreshing...");
        await this.authManager.refreshToken(
          "GOOGLE",
          tokenData.refresh_token,
          userId,
        );
      }
    } catch (error) {
      console.error("Error checking and refreshing token:", error);
    }
  }

  async syncLocalChangesToGoogle(
    userId: string,
    calendarId: string,
  ): Promise<void> {
    const accessToken = await this.authManager.getAccessToken("GOOGLE", userId);
    if (!accessToken) {
      throw new Error("Unable to retrieve access token");
    }

    const calendarClient = new CalendarClient(accessToken, "UTC", userId);

    const { data: localChanges, error } = await this.supabase
      .from("calendar_event")
      .select("*")
      .eq("calendar_id", calendarId)
      .eq("user_id", userId)
      .eq("needs_sync", true);

    if (error) {
      console.error("Error fetching local changes:", error);
      return;
    }

    for (const change of localChanges) {
      try {
        if (change.is_deleted) {
          if (change.google_event_id) {
            await calendarClient.deleteCalendarEvent(
              calendarId,
              change.google_event_id,
            );
          }
          await this.supabase
            .from("calendar_event")
            .delete()
            .eq("id", change.id);
        } else if (change.google_event_id) {
          await calendarClient.updateCalendarEvent(
            calendarId,
            change.google_event_id,
            {
              summary: change.summary,
              description: change.description,
              start: { dateTime: safeToISOString(change.start_time, "UTC") },
              end: { dateTime: safeToISOString(change.end_time, "UTC") },
            },
          );
          await this.supabase
            .from("calendar_event")
            .update({ needs_sync: false })
            .eq("id", change.id);
        } else {
          const newEvent = await calendarClient.createCalendarEvent(
            calendarId,
            {
              summary: change.summary,
              description: change.description,
              start: { dateTime: safeToISOString(change.start_time, "UTC") },
              end: { dateTime: safeToISOString(change.end_time, "UTC") },
            },
          );

          await this.supabase
            .from("calendar_event")
            .update({ google_event_id: newEvent.id, needs_sync: false })
            .eq("id", change.id);
        }
      } catch (error) {
        console.error("Error syncing event to Google Calendar:", error);
      }
    }
  }

  private async logSyncError(
    userId: string,
    errorMessage: string,
  ): Promise<void> {
    const syncError: SyncError = {
      user_id: userId,
      error_message: errorMessage,
      created_at: getCurrentTimestamp(),
    };

    const { error } = await this.supabase.from("sync_errors").insert(syncError);

    if (error) {
      console.error("Error logging sync error:", error);
    }
  }
}
