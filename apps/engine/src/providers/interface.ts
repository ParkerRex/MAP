import type { EventInstancesSchema } from "@/routes/google-calendar/event-instances/schema";
import type { calendar_v3 } from "googleapis";
import type { z } from "zod";
import type { AclSchema } from "../routes/google-calendar/acl/schema";
import {
  CalendarListEntrySchema,
  type CalendarListSchema,
} from "../routes/google-calendar/calendar-list/schema";
import type { CalendarSchema } from "../routes/google-calendar/calendars/schema";
import type { ChannelSchema } from "../routes/google-calendar/channels/schema";
import type { ColorsSchema } from "../routes/google-calendar/colors/schema";
import {
  type EventSchema,
  EventsSchema,
} from "../routes/google-calendar/events/schema";
import type {
  FreeBusyRequestSchema,
  FreeBusyResponseSchema,
} from "../routes/google-calendar/freebusy/schema";
import type { SettingsSchema } from "../routes/google-calendar/settings/schema";
import type { ActivitySchema } from "../routes/whoop/activities/schema";
import type { BodyMeasurementSchema } from "../routes/whoop/body-measurements/schema";
import type { CycleSchema } from "../routes/whoop/cycles/schema";
import type { ProfileSchema } from "../routes/whoop/profile/schema";
import type { RecoverySchema } from "../routes/whoop/recoveries/schema";
import type { SleepSchema } from "../routes/whoop/sleeps/schema";
import type {
  TeamMemberSchema,
  TeamSchema,
} from "../routes/whoop/teams/schema";
import type { WorkoutSchema } from "../routes/whoop/workouts/schema";

export interface Provider {
  // Google Calendar methods
  getAcl: (calendarId: string) => Promise<z.infer<typeof AclSchema>>;
  getCalendarList: (
    params?: calendar_v3.Params$Resource$Calendarlist$List,
  ) => Promise<z.infer<typeof CalendarListSchema>>;
  getCalendarListEntry: (
    calendarId: string,
  ) => Promise<z.infer<typeof CalendarListSchema>>;
  insertCalendarListEntry: (
    requestBody: calendar_v3.Schema$CalendarListEntry,
  ) => Promise<z.infer<typeof CalendarListSchema>>;
  updateCalendarListEntry: (
    calendarId: string,
    requestBody: calendar_v3.Schema$CalendarListEntry,
  ) => Promise<z.infer<typeof CalendarListSchema>>;
  deleteCalendarListEntry: (calendarId: string) => Promise<void>;
  getCalendar: (calendarId: string) => Promise<z.infer<typeof CalendarSchema>>;
  insertCalendar: (
    requestBody: calendar_v3.Schema$Calendar,
  ) => Promise<z.infer<typeof CalendarSchema>>;
  updateCalendar: (
    calendarId: string,
    requestBody: calendar_v3.Schema$Calendar,
  ) => Promise<z.infer<typeof CalendarSchema>>;
  deleteCalendar: (calendarId: string) => Promise<void>;
  clearCalendar: (calendarId: string) => Promise<void>;
  listEvents: (
    calendarId: string,
    params?: calendar_v3.Params$Resource$Events$List,
  ) => Promise<z.infer<typeof EventSchema>[]>;
  getEvent: (
    calendarId: string,
    eventId: string,
  ) => Promise<z.infer<typeof EventSchema>>;
  insertEvent: (
    calendarId: string,
    requestBody: calendar_v3.Schema$Event,
  ) => Promise<z.infer<typeof EventSchema>>;
  updateEvent: (
    calendarId: string,
    eventId: string,
    requestBody: calendar_v3.Schema$Event,
  ) => Promise<z.infer<typeof EventSchema>>;
  deleteEvent: (calendarId: string, eventId: string) => Promise<void>;
  moveEvent: (
    calendarId: string,
    eventId: string,
    destination: string,
  ) => Promise<z.infer<typeof EventSchema>>;
  getSettings: () => Promise<z.infer<typeof SettingsSchema>[]>;
  getSetting: (setting: string) => Promise<z.infer<typeof SettingsSchema>>;
  watchCalendarList: (
    requestBody: calendar_v3.Schema$Channel,
  ) => Promise<z.infer<typeof ChannelSchema>>;
  watchEvents: (
    calendarId: string,
    requestBody: calendar_v3.Schema$Channel,
  ) => Promise<z.infer<typeof ChannelSchema>>;
  stopChannel: (requestBody: calendar_v3.Schema$Channel) => Promise<void>;
  getColors: () => Promise<z.infer<typeof ColorsSchema>>;
  queryFreebusy: (
    requestBody: z.infer<typeof FreeBusyRequestSchema>,
  ) => Promise<z.infer<typeof FreeBusyResponseSchema>>;
  getEventInstances: (
    calendarId: string,
    eventId: string,
    params: any,
  ) => Promise<z.infer<typeof EventInstancesSchema>>;
  quickAddEvent: (
    calendarId: string,
    text: string,
  ) => Promise<z.infer<typeof EventSchema>>;
  watchSettings: (requestBody: any) => Promise<z.infer<typeof ChannelSchema>>;

  // WHOOP methods
  getProfile: (accessToken: string) => Promise<z.infer<typeof ProfileSchema>>;
  getCycles: (
    accessToken: string,
    start: string,
    end: string,
  ) => Promise<z.infer<typeof CycleSchema>[]>;
  getWorkouts: (
    accessToken: string,
    start: string,
    end: string,
  ) => Promise<z.infer<typeof WorkoutSchema>[]>;
  getRecoveries: (
    accessToken: string,
    start: string,
    end: string,
  ) => Promise<z.infer<typeof RecoverySchema>[]>;
  getSleeps: (
    accessToken: string,
    start: string,
    end: string,
  ) => Promise<z.infer<typeof SleepSchema>[]>;
  getBodyMeasurements: (
    accessToken: string,
  ) => Promise<z.infer<typeof BodyMeasurementSchema>[]>;
  createBodyMeasurement: (
    accessToken: string,
    measurement: z.infer<typeof BodyMeasurementSchema>,
  ) => Promise<z.infer<typeof BodyMeasurementSchema>>;
  getActivities: (
    accessToken: string,
    start: string,
    end: string,
  ) => Promise<z.infer<typeof ActivitySchema>[]>;
  getTeams: (accessToken: string) => Promise<z.infer<typeof TeamSchema>[]>;
  getTeamMembers: (
    accessToken: string,
    teamId: string,
  ) => Promise<z.infer<typeof TeamMemberSchema>[]>;

  // Common method
  refreshToken: (refreshToken: string) => Promise<any>;
}
