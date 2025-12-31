import { z } from "zod";

// Date/time schema with mutual exclusivity validation
// Either dateTime OR date must be provided, not both
const dateTimeSchema = z
  .object({
    dateTime: z.string().optional(),
    date: z.string().optional(),
    timeZone: z.string().optional(),
  })
  .refine(
    (data) => {
      // Must have either dateTime or date, but not both
      const hasDateTime = !!data.dateTime;
      const hasDate = !!data.date;
      return (hasDateTime || hasDate) && !(hasDateTime && hasDate);
    },
    {
      message: "Either dateTime or date must be provided, but not both",
    },
  );

// For partial updates, both can be omitted
const optionalDateTimeSchema = z
  .object({
    dateTime: z.string().optional(),
    date: z.string().optional(),
    timeZone: z.string().optional(),
  })
  .refine(
    (data) => {
      // If neither is provided, that's fine for partial updates
      const hasDateTime = !!data.dateTime;
      const hasDate = !!data.date;
      if (!hasDateTime && !hasDate) return true;
      // But if one is provided, can't have both
      return !(hasDateTime && hasDate);
    },
    {
      message: "Cannot provide both dateTime and date",
    },
  );

// Conference data for Google Meet integration
const conferenceDataSchema = z
  .object({
    createRequest: z
      .object({
        requestId: z.string(),
        conferenceSolutionKey: z
          .object({
            type: z.enum(["hangoutsMeet", "addOn"]),
          })
          .optional(),
      })
      .optional(),
    conferenceId: z.string().optional(),
    conferenceSolution: z
      .object({
        key: z.object({
          type: z.string(),
        }),
        name: z.string().optional(),
        iconUri: z.string().optional(),
      })
      .optional(),
    entryPoints: z
      .array(
        z.object({
          entryPointType: z.enum(["video", "phone", "sip", "more"]),
          uri: z.string().optional(),
          label: z.string().optional(),
          pin: z.string().optional(),
          accessCode: z.string().optional(),
          meetingCode: z.string().optional(),
          passcode: z.string().optional(),
          password: z.string().optional(),
        }),
      )
      .optional(),
  })
  .optional();

// Attendee schema with all Google Calendar fields
const attendeeSchema = z.object({
  email: z.string().email(),
  displayName: z.string().max(200).optional(),
  optional: z.boolean().optional(),
  responseStatus: z.enum(["needsAction", "declined", "tentative", "accepted"]).optional(),
  comment: z.string().optional(),
  additionalGuests: z.number().int().min(0).optional(),
  resource: z.boolean().optional(),
});

export const calendarEventSchema = z.object({
  summary: z.string().max(1000).optional(),
  description: z.string().max(10000).optional(),
  location: z.string().max(1000).optional(),
  start: dateTimeSchema,
  end: dateTimeSchema,
  colorId: z.string().max(10).optional(),
  recurrence: z.array(z.string()).optional(),
  attendees: z.array(attendeeSchema).optional(),
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
        .max(5)
        .optional(),
    })
    .optional(),
  visibility: z.enum(["default", "public", "private", "confidential"]).optional(),
  transparency: z.enum(["opaque", "transparent"]).optional(),
  status: z.enum(["confirmed", "tentative", "cancelled"]).optional(),
  // Guest control fields
  guestsCanInviteOthers: z.boolean().optional(),
  guestsCanModify: z.boolean().optional(),
  guestsCanSeeOtherGuests: z.boolean().optional(),
  // Event type
  eventType: z
    .enum(["default", "birthday", "focusTime", "outOfOffice", "workingLocation"])
    .optional(),
  // Conference data for Google Meet
  conferenceData: conferenceDataSchema,
});

// For updates, use optional date/time schema and make all fields partial
export const updateCalendarEventSchema = z.object({
  summary: z.string().max(1000).optional(),
  description: z.string().max(10000).optional(),
  location: z.string().max(1000).optional(),
  start: optionalDateTimeSchema.optional(),
  end: optionalDateTimeSchema.optional(),
  colorId: z.string().max(10).optional(),
  recurrence: z.array(z.string()).optional(),
  attendees: z.array(attendeeSchema).optional(),
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
        .max(5)
        .optional(),
    })
    .optional(),
  visibility: z.enum(["default", "public", "private", "confidential"]).optional(),
  transparency: z.enum(["opaque", "transparent"]).optional(),
  status: z.enum(["confirmed", "tentative", "cancelled"]).optional(),
  guestsCanInviteOthers: z.boolean().optional(),
  guestsCanModify: z.boolean().optional(),
  guestsCanSeeOtherGuests: z.boolean().optional(),
  eventType: z
    .enum(["default", "birthday", "focusTime", "outOfOffice", "workingLocation"])
    .optional(),
  conferenceData: conferenceDataSchema,
});

export type CalendarEventInput = z.infer<typeof calendarEventSchema>;
export type UpdateCalendarEventInput = z.infer<typeof updateCalendarEventSchema>;
