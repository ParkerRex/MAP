import { z } from "zod";

export const FreeBusyRequestSchema = z
  .object({
    timeMin: z.string().openapi({ example: "2023-04-01T00:00:00Z" }),
    timeMax: z.string().openapi({ example: "2023-04-30T23:59:59Z" }),
    timeZone: z.string().optional().openapi({ example: "America/Los_Angeles" }),
    groupExpansionMax: z.number().optional().openapi({ example: 5 }),
    calendarExpansionMax: z.number().optional().openapi({ example: 10 }),
    items: z
      .array(
        z.object({
          id: z.string().openapi({ example: "primary" }),
        }),
      )
      .openapi({
        example: [{ id: "primary" }, { id: "secondary@example.com" }],
      }),
  })
  .openapi("FreeBusyRequestSchema");

export const FreeBusyResponseSchema = z
  .object({
    data: z.object({
      kind: z.string().openapi({ example: "calendar#freeBusy" }),
      timeMin: z.string().openapi({ example: "2023-04-01T00:00:00Z" }),
      timeMax: z.string().openapi({ example: "2023-04-30T23:59:59Z" }),
      calendars: z
        .record(
          z.object({
            busy: z.array(
              z.object({
                start: z.string().openapi({ example: "2023-04-01T10:00:00Z" }),
                end: z.string().openapi({ example: "2023-04-01T11:00:00Z" }),
              }),
            ),
          }),
        )
        .openapi({
          example: {
            primary: {
              busy: [
                { start: "2023-04-01T10:00:00Z", end: "2023-04-01T11:00:00Z" },
                { start: "2023-04-02T14:00:00Z", end: "2023-04-02T15:00:00Z" },
              ],
            },
            "secondary@example.com": {
              busy: [
                { start: "2023-04-03T09:00:00Z", end: "2023-04-03T10:00:00Z" },
              ],
            },
          },
        }),
    }),
  })
  .openapi("FreeBusyResponseSchema");
