import { z } from "zod";

const dateTimeSchema = z.object({
  dateTime: z.string().optional(),
  date: z.string().optional(),
  timeZone: z.string().optional(),
});

export const calendarEventSchema = z.object({
  summary: z.string().max(1000).optional(),
  description: z.string().max(10000).optional(),
  location: z.string().max(1000).optional(),
  start: dateTimeSchema,
  end: dateTimeSchema,
  colorId: z.string().max(10).optional(),
  recurrence: z.array(z.string()).optional(),
  attendees: z
    .array(
      z.object({
        email: z.string().email(),
        displayName: z.string().max(200).optional(),
        optional: z.boolean().optional(),
        responseStatus: z.string().optional(),
      }),
    )
    .optional(),
  reminders: z
    .object({
      useDefault: z.boolean().optional(),
      overrides: z
        .array(
          z.object({
            method: z.enum(["email", "popup"]),
            minutes: z.number().min(0).max(40320),
          }),
        )
        .optional(),
    })
    .optional(),
  visibility: z
    .enum(["default", "public", "private", "confidential"])
    .optional(),
  transparency: z.enum(["opaque", "transparent"]).optional(),
  status: z.enum(["confirmed", "tentative", "cancelled"]).optional(),
});

export const updateCalendarEventSchema = calendarEventSchema.partial();

export type CalendarEventInput = z.infer<typeof calendarEventSchema>;
export type UpdateCalendarEventInput = z.infer<
  typeof updateCalendarEventSchema
>;
