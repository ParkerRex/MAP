import { z } from "zod";

const DefaultReminderSchema = z.object({
  method: z.string().openapi({ example: "email" }),
  minutes: z.number().openapi({ example: 30 }),
});

const NotificationSchema = z.object({
  type: z.string().openapi({ example: "eventCreation" }),
  method: z.string().openapi({ example: "email" }),
});

export const CalendarListEntrySchema = z
  .object({
    kind: z.string().openapi({ example: "calendar#calendarListEntry" }),
    etag: z.string().openapi({ example: '"00000000000000000"' }),
    id: z.string().openapi({ example: "calendarId@group.calendar.google.com" }),
    summary: z.string().openapi({ example: "My Calendar" }),
    description: z
      .string()
      .optional()
      .openapi({ example: "A description of my calendar" }),
    location: z.string().optional().openapi({ example: "Mountain View, CA" }),
    timeZone: z.string().openapi({ example: "America/Los_Angeles" }),
    summaryOverride: z
      .string()
      .optional()
      .openapi({ example: "Override Summary" }),
    colorId: z.string().optional().openapi({ example: "1" }),
    backgroundColor: z.string().openapi({ example: "#9fc6e7" }),
    foregroundColor: z.string().openapi({ example: "#000000" }),
    hidden: z.boolean().optional().openapi({ example: false }),
    selected: z.boolean().optional().openapi({ example: true }),
    accessRole: z.string().openapi({ example: "owner" }),
    defaultReminders: z.array(DefaultReminderSchema).optional(),
    notificationSettings: z
      .object({
        notifications: z.array(NotificationSchema),
      })
      .optional(),
    primary: z.boolean().optional().openapi({ example: false }),
    deleted: z.boolean().optional().openapi({ example: false }),
    conferenceProperties: z
      .object({
        allowedConferenceSolutionTypes: z
          .array(z.string())
          .openapi({ example: ["hangoutsMeet"] }),
      })
      .optional(),
  })
  .openapi("CalendarListEntrySchema");

export const CalendarListSchema = z
  .object({
    data: z.object({
      kind: z.string().openapi({ example: "calendar#calendarList" }),
      etag: z.string().openapi({ example: '"00000000000000000"' }),
      nextPageToken: z
        .string()
        .optional()
        .openapi({ example: "nextPageToken" }),
      nextSyncToken: z
        .string()
        .optional()
        .openapi({ example: "nextSyncToken" }),
      items: z.array(CalendarListEntrySchema),
    }),
  })
  .openapi("CalendarListSchema");

export const ChannelSchema = z
  .object({
    kind: z.string().openapi({ example: "api#channel" }),
    id: z.string().openapi({ example: "channelId" }),
    resourceId: z.string().openapi({ example: "resourceId" }),
    resourceUri: z
      .string()
      .openapi({
        example:
          "https://www.googleapis.com/calendar/v3/users/me/calendarList/watch",
      }),
    token: z.string().optional().openapi({ example: "token" }),
    expiration: z
      .string()
      .optional()
      .openapi({ example: "2023-12-31T23:59:59.999Z" }),
    type: z.string().openapi({ example: "web_hook" }),
    address: z
      .string()
      .openapi({ example: "https://example.com/notifications" }),
    payload: z.boolean().optional().openapi({ example: true }),
    params: z
      .record(z.string())
      .optional()
      .openapi({ example: { key: "value" } }),
  })
  .openapi("ChannelSchema");

export const CalendarListEntryInputSchema = CalendarListEntrySchema.omit({
  kind: true,
  etag: true,
  id: true,
  accessRole: true,
  backgroundColor: true,
  foregroundColor: true,
}).openapi("CalendarListEntryInputSchema");
