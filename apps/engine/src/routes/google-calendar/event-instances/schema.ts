import { z } from "zod";
import { EventSchema } from "../events/schema";

export const DefaultReminderSchema = z.object({
  method: z.string().openapi({ example: "email" }),
  minutes: z.number().openapi({ example: 30 }),
});

export const EventInstancesSchema = z
  .object({
    data: z.object({
      kind: z.string().openapi({ example: "calendar#events" }),
      etag: z.string().openapi({ example: '"etag-value"' }),
      summary: z.string().optional().openapi({ example: "Event Summary" }),
      description: z
        .string()
        .optional()
        .openapi({ example: "Event Description" }),
      updated: z.string().openapi({ example: "2023-04-01T12:00:00.000Z" }),
      timeZone: z
        .string()
        .optional()
        .openapi({ example: "America/Los_Angeles" }),
      accessRole: z.string().openapi({ example: "reader" }),
      defaultReminders: z.array(DefaultReminderSchema),
      nextPageToken: z
        .string()
        .optional()
        .openapi({ example: "next-page-token" }),
      nextSyncToken: z
        .string()
        .optional()
        .openapi({ example: "next-sync-token" }),
      items: z.array(EventSchema),
    }),
  })
  .openapi("EventInstancesSchema");
