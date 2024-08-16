import { type calendar_v3, google } from "googleapis";
import { z } from "zod";
import {
  AclSchema,
  CalendarListEntrySchema,
  CalendarSchema,
  ChannelSchema,
  ColorsSchema,
  EventSchema,
  EventsSchema,
  type FreeBusyRequestSchema,
  FreeBusyResponseSchema,
  SettingsSchema,
} from "../../routes/google-calendar/schema";
import type { Bindings } from "../../types";

export class GoogleCalendarProvider {
  private calendar: calendar_v3.Calendar;

  constructor(private c: { env: Bindings }) {
    const auth = new google.auth.OAuth2(
      this.c.env.GOOGLE_CALENDAR_CLIENT_ID,
      this.c.env.GOOGLE_CALENDAR_CLIENT_SECRET,
    );
    this.calendar = google.calendar({ version: "v3", auth });
  }

  async getAcl(calendarId: string) {
    const result = await this.calendar.acl.list({ calendarId });
    return AclSchema.parse(result.data);
  }

  async getEventInstances(
    calendarId: string,
    eventId: string,
    params: Record<string, unknown>,
  ) {
    const result = await this.calendar.events.instances({
      calendarId,
      eventId,
      ...params,
    });
    return EventsSchema.parse(result.data);
  }

  async quickAddEvent(calendarId: string, text: string) {
    const result = await this.calendar.events.quickAdd({
      calendarId,
      text,
    });
    return EventSchema.parse(result.data);
  }

  async watchEvents(calendarId: string, requestBody: Record<string, unknown>) {
    const result = await this.calendar.events.watch({
      calendarId,
      requestBody,
    });
    return ChannelSchema.parse(result.data);
  }

  async watchSettings(requestBody: Record<string, unknown>) {
    const result = await this.calendar.settings.watch({ requestBody });
    return ChannelSchema.parse(result.data);
  }

  async insertAcl(calendarId: string, rule: z.infer<typeof AclSchema>) {
    const result = await this.calendar.acl.insert({
      calendarId,
      requestBody: rule,
    });
    return AclSchema.parse(result.data);
  }

  async updateAcl(
    calendarId: string,
    ruleId: string,
    rule: z.infer<typeof AclSchema>,
  ) {
    const result = await this.calendar.acl.update({
      calendarId,
      ruleId,
      requestBody: rule,
    });
    return AclSchema.parse(result.data);
  }

  async deleteAcl(calendarId: string, ruleId: string) {
    await this.calendar.acl.delete({ calendarId, ruleId });
  }

  async getCalendarList() {
    const result = await this.calendar.calendarList.list();
    return z.array(CalendarListEntrySchema).parse(result.data.items);
  }

  async getCalendarListEntry(calendarId: string) {
    const result = await this.calendar.calendarList.get({ calendarId });
    return CalendarListEntrySchema.parse(result.data);
  }

  async insertCalendarListEntry(
    calendarListEntry: z.infer<typeof CalendarListEntrySchema>,
  ) {
    const result = await this.calendar.calendarList.insert({
      requestBody: calendarListEntry,
    });
    return CalendarListEntrySchema.parse(result.data);
  }

  async updateCalendarListEntry(
    calendarId: string,
    calendarListEntry: z.infer<typeof CalendarListEntrySchema>,
  ) {
    const result = await this.calendar.calendarList.update({
      calendarId,
      requestBody: calendarListEntry,
    });
    return CalendarListEntrySchema.parse(result.data);
  }

  async deleteCalendarListEntry(calendarId: string) {
    await this.calendar.calendarList.delete({ calendarId });
  }

  async getCalendar(calendarId: string) {
    const result = await this.calendar.calendars.get({ calendarId });
    return CalendarSchema.parse(result.data);
  }

  async insertCalendar(calendar: z.infer<typeof CalendarSchema>) {
    const result = await this.calendar.calendars.insert({
      requestBody: calendar,
    });
    return CalendarSchema.parse(result.data);
  }

  async updateCalendar(
    calendarId: string,
    calendar: z.infer<typeof CalendarSchema>,
  ) {
    const result = await this.calendar.calendars.update({
      calendarId,
      requestBody: calendar,
    });
    return CalendarSchema.parse(result.data);
  }

  async deleteCalendar(calendarId: string) {
    await this.calendar.calendars.delete({ calendarId });
  }

  async clearCalendar(calendarId: string) {
    await this.calendar.calendars.clear({ calendarId });
  }

  async stopChannel(channel: z.infer<typeof ChannelSchema>) {
    await this.calendar.channels.stop({ requestBody: channel });
  }

  async getColors() {
    const result = await this.calendar.colors.get();
    return ColorsSchema.parse(result.data);
  }

  async getEvent(calendarId: string, eventId: string) {
    const result = await this.calendar.events.get({ calendarId, eventId });
    return EventSchema.parse(result.data);
  }

  async listEvents(calendarId: string, params: Record<string, unknown>) {
    const result = await this.calendar.events.list({ calendarId, ...params });
    return z.array(EventSchema).parse(result.data.items);
  }

  async insertEvent(calendarId: string, event: z.infer<typeof EventSchema>) {
    const result = await this.calendar.events.insert({
      calendarId,
      requestBody: event,
    });
    return EventSchema.parse(result.data);
  }

  async updateEvent(
    calendarId: string,
    eventId: string,
    event: z.infer<typeof EventSchema>,
  ) {
    const result = await this.calendar.events.update({
      calendarId,
      eventId,
      requestBody: event,
    });
    return EventSchema.parse(result.data);
  }

  async deleteEvent(calendarId: string, eventId: string) {
    await this.calendar.events.delete({ calendarId, eventId });
  }

  async moveEvent(calendarId: string, eventId: string, destination: string) {
    const result = await this.calendar.events.move({
      calendarId,
      eventId,
      destination,
    });
    return EventSchema.parse(result.data);
  }

  async queryFreebusy(request: z.infer<typeof FreeBusyRequestSchema>) {
    const result = await this.calendar.freebusy.query({ requestBody: request });
    return FreeBusyResponseSchema.parse(result.data);
  }

  async getSettings() {
    const result = await this.calendar.settings.list();
    return z.array(SettingsSchema).parse(result.data.items);
  }

  async getSetting(settingId: string) {
    const result = await this.calendar.settings.get({ setting: settingId });
    return SettingsSchema.parse(result.data);
  }

  async refreshToken(refreshToken: string) {
    const auth = new google.auth.OAuth2(
      this.c.env.GOOGLE_CALENDAR_CLIENT_ID,
      this.c.env.GOOGLE_CALENDAR_CLIENT_SECRET,
    );
    auth.setCredentials({ refresh_token: refreshToken });
    const { credentials } = await auth.refreshAccessToken();
    return credentials;
  }

  async watchCalendarList(requestBody: z.infer<typeof ChannelSchema>) {
    const result = await this.calendar.calendarList.watch({
      requestBody,
    });
    return ChannelSchema.parse(result.data);
  }
}
