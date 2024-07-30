"use server";
import { AuthManager } from "@/lib/integrations/auth";
import { CalendarClient } from "@/lib/integrations/calendar";
import type { CalendarEvent } from "@/types/calendar";
import { createClient } from "@map/supabase/server";
import type { calendar_v3 } from "googleapis";
import { DateTime } from "luxon";
import { revalidatePath } from "next/cache";
import { unstable_noStore as noStore } from "next/cache";
import {
  formatForDatabase,
  formatForDisplay,
  getCurrentTimestamp,
  safeParseDate,
  safeToISOString,
} from "./utils/dateUtils";

const getCalendarClient = async (userId: string) => {
  const authManager = new AuthManager();
  const accessToken = await authManager.getAccessToken("GOOGLE", userId);
  return new CalendarClient(accessToken || "", "UTC", userId);
};

type CalendarsQueryResult = {
  calendars: calendar_v3.Schema$CalendarListEntry[];
  primaryCalendarId: string | null;
};

export const fetchCalendars = async (
  userId: string,
): Promise<calendar_v3.Schema$CalendarListEntry[]> => {
  noStore();
  const supabase = createClient();
  try {
    const { data: calendars, error } = await supabase
      .from("calendar")
      .select("*")
      .eq("user_id", userId);

    if (error) {
      throw error;
    }

    // Convert Supabase data to Google Calendar API format
    return calendars.map(
      (calendar): calendar_v3.Schema$CalendarListEntry => ({
        id: calendar.google_calendar_id,
        summary: calendar.summary,
        description: calendar.description,
        backgroundColor: calendar.background_color,
        foregroundColor: calendar.foreground_color,
        colorId: calendar.color_id,
        selected: calendar.selected,
        primary: calendar.is_primary,
        // Add other fields as necessary
      }),
    );
  } catch (error) {
    console.error("Failed to fetch calendars:", error);
    throw new Error("Unable to fetch calendars. Please try again later.");
  }
};

type Event = calendar_v3.Schema$Event;

export const fetchCalendarEvents = async (
  userId: string,
  startDate: Date,
  endDate: Date,
  userTimeZone: string,
): Promise<Event[]> => {
  noStore();
  const supabase = createClient();
  console.log("Fetching events from Supabase for user:", userId);
  console.log("Date range:", startDate, endDate);

  try {
    const { data: events, error } = await supabase
      .from("calendar_event")
      .select("*")
      .eq("user_id", userId)
      .gte("start_time", safeToISOString(startDate))
      .lte("end_time", safeToISOString(endDate));

    if (error) {
      console.error("Error fetching events from Supabase:", error);
      throw error;
    }

    console.log("Events fetched from Supabase:", events);

    return events.map((event) => ({
      ...event,
      start: {
        dateTime: DateTime.fromISO(event.start_time)
          .setZone(userTimeZone)
          .toISO(),
        timeZone: userTimeZone,
      },
      end: {
        dateTime: DateTime.fromISO(event.end_time)
          .setZone(userTimeZone)
          .toISO(),
        timeZone: userTimeZone,
      },
    }));
  } catch (error) {
    console.error("Failed to fetch calendar events:", error);
    throw new Error("Unable to fetch calendar events. Please try again later.");
  }
};

const upsertEventToSupabase = async (
  event: CalendarEvent,
  calendarId: string,
) => {
  const supabase = createClient();
  const { error } = await supabase.from("calendar_event").upsert(
    {
      id: event.id,
      google_event_id: event.id,
      calendar_id: calendarId,
      summary: event.summary,
      description: event.description,
      start_time: formatForDatabase(event.start?.dateTime || event.start?.date),
      end_time: formatForDatabase(event.end?.dateTime || event.end?.date),
      all_day: event.start?.date !== undefined,
      recurrence: event.recurrence,
      time_zone: event.start?.timeZone || event.end?.timeZone,
    },
    { onConflict: "google_event_id,user_id" },
  );
  if (error) {
    console.error("Error upserting event:", error);
    throw new Error("Failed to store event in database");
  }
};

export const createCalendarEvent = async (
  userId: string,
  formData: FormData,
): Promise<Event> => {
  noStore();
  const calendarClient = await getCalendarClient(userId);
  const event: calendar_v3.Schema$Event = {
    summary: formData.get("summary") as string,
    description: formData.get("description") as string,
    start: {
      dateTime: formData.get("start_time") as string,
      timeZone: formData.get("timeZone") as string,
    },
    end: {
      dateTime: formData.get("end_time") as string,
      timeZone: formData.get("timeZone") as string,
    },
  };
  const calendarId = formData.get("calendarId") as string;
  try {
    const createdEvent = await calendarClient.createCalendarEvent(
      calendarId,
      event,
    );
    if (createdEvent) {
      const supabase = createClient();
      await supabase.from("calendar_event").insert({
        google_event_id: createdEvent.id,
        google_calendar_id: calendarId,
        user_id: userId,
        summary: event.summary,
        description: event.description,
        start_time: formatForDatabase(event.start?.dateTime),
        end_time: formatForDatabase(event.end?.dateTime),
        all_day: false,
      });
      revalidatePath("/calendar");
    }
    return createdEvent;
  } catch (error) {
    console.error("Failed to create event:", error);
    throw new Error("Unable to create event. Please try again later.");
  }
};

export const updateCalendarEvent = async (
  userId: string,
  id: string,
  formData: FormData,
): Promise<Event> => {
  noStore();
  const calendarClient = await getCalendarClient(userId);
  const event: Partial<calendar_v3.Schema$Event> = {
    summary: formData.get("summary") as string,
    description: formData.get("description") as string,
    start: {
      dateTime: formData.get("start_time") as string,
      timeZone: formData.get("timeZone") as string,
    },
    end: {
      dateTime: formData.get("end_time") as string,
      timeZone: formData.get("timeZone") as string,
    },
  };
  const calendarId = formData.get("calendarId") as string;
  try {
    const updatedEvent = await calendarClient.updateCalendarEvent(
      calendarId,
      id,
      event,
    );

    if (updatedEvent) {
      const supabase = createClient();
      await supabase
        .from("calendar_event")
        .update({
          summary: updatedEvent.summary,
          description: updatedEvent.description,
          start_time: formatForDatabase(
            updatedEvent.start?.dateTime || updatedEvent.start?.date,
          ),
          end_time: formatForDatabase(
            updatedEvent.end?.dateTime || updatedEvent.end?.date,
          ),
          all_day: !!updatedEvent.start?.date,
        })
        .eq("google_event_id", id);
      revalidatePath("/calendar");
    }
    return updatedEvent;
  } catch (error) {
    console.error("Failed to update event:", error);
    throw new Error("Unable to update event. Please try again later.");
  }
};

export const deleteCalendarEvent = async (
  userId: string,
  id: string,
  calendarId: string,
): Promise<boolean> => {
  noStore();
  const calendarClient = await getCalendarClient(userId);
  try {
    await calendarClient.deleteCalendarEvent(calendarId, id);
    const supabase = createClient();
    await supabase.from("calendar_event").delete().eq("google_event_id", id);
    revalidatePath("/calendar");
    return true;
  } catch (error) {
    console.error("Failed to delete event:", error);
    throw new Error("Unable to delete event. Please try again later.");
  }
};

export const getNextWeekEvents = async (
  userId: string,
  currentWeekStartDate: Date,
  userTimeZone: string,
): Promise<Event[]> => {
  try {
    const nextWeek = DateTime.fromJSDate(currentWeekStartDate).plus({
      weeks: 1,
    });
    const startOfNextWeek = nextWeek.startOf("week");
    const endOfNextWeek = nextWeek.endOf("week");

    return await fetchCalendarEvents(
      userId,
      startOfNextWeek.toJSDate(),
      endOfNextWeek.toJSDate(),
      userTimeZone,
    );
  } catch (error) {
    console.error("Failed to fetch next week events:", error);
    throw new Error(
      "Unable to fetch next week events. Please try again later.",
    );
  }
};

export const getPreviousWeekEvents = async (
  userId: string,
  currentWeekStartDate: Date,
  userTimeZone: string,
): Promise<Event[]> => {
  try {
    const previousWeek = DateTime.fromJSDate(currentWeekStartDate).minus({
      weeks: 1,
    });
    const startOfPreviousWeek = previousWeek.startOf("week");
    const endOfPreviousWeek = previousWeek.endOf("week");

    return await fetchCalendarEvents(
      userId,
      startOfPreviousWeek.toJSDate(),
      endOfPreviousWeek.toJSDate(),
      userTimeZone,
    );
  } catch (error) {
    console.error("Failed to fetch previous week events:", error);
    throw new Error(
      "Unable to fetch previous week events. Please try again later.",
    );
  }
};
