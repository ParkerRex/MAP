import { z } from "zod";

export const EventSchema = z
  .object({
    kind: z.string().openapi({ example: "calendar#event" }),
    etag: z.string().openapi({ example: '"3181159875584000"' }),
    id: z.string().openapi({ example: "eventId" }),
    status: z.string().openapi({ example: "confirmed" }),
    htmlLink: z
      .string()
      .openapi({ example: "https://www.google.com/calendar/event?eid=..." }),
    created: z.string().openapi({ example: "2023-04-01T10:00:00.000Z" }),
    updated: z.string().openapi({ example: "2023-04-01T10:00:00.000Z" }),
    summary: z.string().openapi({ example: "Team Meeting" }),
    description: z
      .string()
      .optional()
      .openapi({ example: "Weekly team sync-up" }),
    location: z.string().optional().openapi({ example: "Conference Room A" }),
    colorId: z.string().optional().openapi({ example: "1" }),
    creator: z.object({
      id: z.string().optional().openapi({ example: "user123" }),
      email: z.string().optional().openapi({ example: "user@example.com" }),
      displayName: z.string().optional().openapi({ example: "John Doe" }),
      self: z.boolean().optional().openapi({ example: true }),
    }),
    organizer: z.object({
      id: z.string().optional().openapi({ example: "user123" }),
      email: z.string().optional().openapi({ example: "user@example.com" }),
      displayName: z.string().optional().openapi({ example: "John Doe" }),
      self: z.boolean().optional().openapi({ example: true }),
    }),
    start: z.object({
      date: z.string().optional().openapi({ example: "2023-04-01" }),
      dateTime: z
        .string()
        .optional()
        .openapi({ example: "2023-04-01T10:00:00-07:00" }),
      timeZone: z
        .string()
        .optional()
        .openapi({ example: "America/Los_Angeles" }),
    }),
    end: z.object({
      date: z.string().optional().openapi({ example: "2023-04-01" }),
      dateTime: z
        .string()
        .optional()
        .openapi({ example: "2023-04-01T11:00:00-07:00" }),
      timeZone: z
        .string()
        .optional()
        .openapi({ example: "America/Los_Angeles" }),
    }),
    recurrence: z
      .array(z.string())
      .optional()
      .openapi({ example: ["RRULE:FREQ=WEEKLY;BYDAY=MO"] }),
    recurringEventId: z
      .string()
      .optional()
      .openapi({ example: "recurringEventId" }),
    originalStartTime: z
      .object({
        date: z.string().optional().openapi({ example: "2023-04-01" }),
        dateTime: z
          .string()
          .optional()
          .openapi({ example: "2023-04-01T10:00:00-07:00" }),
        timeZone: z
          .string()
          .optional()
          .openapi({ example: "America/Los_Angeles" }),
      })
      .optional(),
    transparency: z.string().optional().openapi({ example: "opaque" }),
    visibility: z.string().optional().openapi({ example: "default" }),
    iCalUID: z.string().openapi({ example: "iCalUID@google.com" }),
    sequence: z.number().openapi({ example: 0 }),
    attendees: z
      .array(
        z.object({
          id: z.string().optional().openapi({ example: "attendee123" }),
          email: z
            .string()
            .optional()
            .openapi({ example: "attendee@example.com" }),
          displayName: z.string().optional().openapi({ example: "Jane Doe" }),
          organizer: z.boolean().optional().openapi({ example: false }),
          self: z.boolean().optional().openapi({ example: false }),
          resource: z.boolean().optional().openapi({ example: false }),
          optional: z.boolean().optional().openapi({ example: false }),
          responseStatus: z
            .string()
            .optional()
            .openapi({ example: "needsAction" }),
          comment: z
            .string()
            .optional()
            .openapi({ example: "Looking forward to it!" }),
          additionalGuests: z.number().optional().openapi({ example: 0 }),
        }),
      )
      .optional(),
    attendeesOmitted: z.boolean().optional().openapi({ example: false }),
    extendedProperties: z
      .object({
        private: z
          .record(z.string())
          .optional()
          .openapi({ example: { key1: "value1" } }),
        shared: z
          .record(z.string())
          .optional()
          .openapi({ example: { key2: "value2" } }),
      })
      .optional(),
    hangoutLink: z
      .string()
      .optional()
      .openapi({ example: "https://meet.google.com/abc-defg-hij" }),
    conferenceData: z
      .object({
        createRequest: z
          .object({
            requestId: z.string().openapi({ example: "requestId" }),
            conferenceSolutionKey: z.object({
              type: z.string().openapi({ example: "hangoutsMeet" }),
            }),
            status: z.object({
              statusCode: z.string().openapi({ example: "success" }),
            }),
          })
          .optional(),
        entryPoints: z
          .array(
            z.object({
              entryPointType: z.string().openapi({ example: "video" }),
              uri: z
                .string()
                .openapi({ example: "https://meet.google.com/abc-defg-hij" }),
              label: z.string().optional().openapi({ example: "Meet" }),
              pin: z.string().optional().openapi({ example: "123456" }),
              accessCode: z
                .string()
                .optional()
                .openapi({ example: "accessCode" }),
              meetingCode: z
                .string()
                .optional()
                .openapi({ example: "meetingCode" }),
              passcode: z.string().optional().openapi({ example: "passcode" }),
              password: z.string().optional().openapi({ example: "password" }),
            }),
          )
          .optional(),
        conferenceSolution: z
          .object({
            key: z.object({
              type: z.string().openapi({ example: "hangoutsMeet" }),
            }),
            name: z.string().openapi({ example: "Google Meet" }),
            iconUri: z.string().openapi({
              example:
                "https://fonts.gstatic.com/s/i/productlogos/meet_2020q4/v1/web-24dp/logo_meet_2020q4_color_1x_web_24dp.png",
            }),
          })
          .optional(),
        conferenceId: z
          .string()
          .optional()
          .openapi({ example: "conferenceId" }),
        signature: z.string().optional().openapi({ example: "signature" }),
        notes: z.string().optional().openapi({ example: "Conference notes" }),
      })
      .optional(),
    gadget: z
      .object({
        type: z.string().optional().openapi({ example: "gadgetType" }),
        title: z.string().optional().openapi({ example: "Gadget Title" }),
        link: z
          .string()
          .optional()
          .openapi({ example: "https://gadget.example.com" }),
        iconLink: z
          .string()
          .optional()
          .openapi({ example: "https://gadget.example.com/icon.png" }),
        width: z.number().optional().openapi({ example: 300 }),
        height: z.number().optional().openapi({ example: 200 }),
        display: z.string().optional().openapi({ example: "chip" }),
        preferences: z
          .record(z.string())
          .optional()
          .openapi({ example: { key: "value" } }),
      })
      .optional(),
    anyoneCanAddSelf: z.boolean().optional().openapi({ example: false }),
    guestsCanInviteOthers: z.boolean().optional().openapi({ example: true }),
    guestsCanModify: z.boolean().optional().openapi({ example: false }),
    guestsCanSeeOtherGuests: z.boolean().optional().openapi({ example: true }),
    privateCopy: z.boolean().optional().openapi({ example: false }),
    locked: z.boolean().optional().openapi({ example: false }),
    reminders: z
      .object({
        useDefault: z.boolean().openapi({ example: true }),
        overrides: z
          .array(
            z.object({
              method: z.string().openapi({ example: "email" }),
              minutes: z.number().openapi({ example: 10 }),
            }),
          )
          .optional(),
      })
      .optional(),
    source: z
      .object({
        url: z
          .string()
          .optional()
          .openapi({ example: "https://example.com/event" }),
        title: z.string().optional().openapi({ example: "Event Source" }),
      })
      .optional(),
    attachments: z
      .array(
        z.object({
          fileUrl: z
            .string()
            .openapi({ example: "https://drive.google.com/file/d/..." }),
          title: z.string().openapi({ example: "Attachment" }),
          mimeType: z.string().openapi({ example: "application/pdf" }),
          iconLink: z.string().openapi({
            example:
              "https://drive-thirdparty.googleusercontent.com/16/type/application/pdf",
          }),
          fileId: z.string().openapi({ example: "fileId" }),
        }),
      )
      .optional(),
    eventType: z.string().openapi({ example: "default" }),
  })
  .openapi("EventSchema");

export const EventsSchema = z
  .object({
    data: z.object({
      kind: z.string().openapi({ example: "calendar#events" }),
      etag: z.string().openapi({ example: '"p33089bfuqc"' }),
      summary: z.string().optional().openapi({ example: "My Calendar" }),
      description: z
        .string()
        .optional()
        .openapi({ example: "Calendar Description" }),
      updated: z.string().openapi({ example: "2023-04-01T12:00:00.000Z" }),
      timeZone: z
        .string()
        .optional()
        .openapi({ example: "America/Los_Angeles" }),
      accessRole: z.string().openapi({ example: "owner" }),
      defaultReminders: z.array(
        z.object({
          method: z.string().openapi({ example: "email" }),
          minutes: z.number().openapi({ example: 10 }),
        }),
      ),
      nextPageToken: z
        .string()
        .optional()
        .openapi({ example: "nextPageToken" }),
      nextSyncToken: z
        .string()
        .optional()
        .openapi({ example: "nextSyncToken" }),
      items: z.array(EventSchema),
    }),
  })
  .openapi("EventsSchema");
