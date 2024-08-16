import { z } from "zod";

export const CalendarSchema = z
  .object({
    kind: z.string().openapi({ example: "calendar#calendar" }),
    etag: z.string().openapi({ example: '"00000000000000000"' }),
    id: z.string().openapi({ example: "calendarId@group.calendar.google.com" }),
    summary: z.string().openapi({ example: "My Calendar" }),
    description: z
      .string()
      .optional()
      .openapi({ example: "A description of my calendar" }),
    location: z.string().optional().openapi({ example: "Mountain View, CA" }),
    timeZone: z.string().openapi({ example: "America/Los_Angeles" }),
    conferenceProperties: z
      .object({
        allowedConferenceSolutionTypes: z
          .array(z.string())
          .openapi({ example: ["hangoutsMeet"] }),
      })
      .optional(),
  })
  .openapi("CalendarSchema");

export const CalendarInputSchema = CalendarSchema.omit({
  kind: true,
  etag: true,
  id: true,
}).openapi("CalendarInputSchema");
