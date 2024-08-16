// project-root/apps/engine/src/routes/google-calendar/schema.ts

import { z } from "zod";

export const AclRuleSchema = z.object({
  kind: z.string(),
  etag: z.string(),
  id: z.string(),
  scope: z.object({
    type: z.string(),
    value: z.string().optional(),
  }),
  role: z.string(),
});

export const AclSchema = z.object({
  kind: z.string(),
  etag: z.string(),
  nextPageToken: z.string().optional(),
  nextSyncToken: z.string().optional(),
  items: z.array(AclRuleSchema),
});

export const CalendarListEntrySchema = z.object({
  kind: z.string(),
  etag: z.string(),
  id: z.string(),
  summary: z.string(),
  description: z.string().optional(),
  location: z.string().optional(),
  timeZone: z.string(),
  summaryOverride: z.string().optional(),
  colorId: z.string().optional(),
  backgroundColor: z.string(),
  foregroundColor: z.string(),
  hidden: z.boolean().optional(),
  selected: z.boolean().optional(),
  accessRole: z.string(),
  defaultReminders: z
    .array(
      z.object({
        method: z.string(),
        minutes: z.number(),
      }),
    )
    .optional(),
  notificationSettings: z
    .object({
      notifications: z.array(
        z.object({
          type: z.string(),
          method: z.string(),
        }),
      ),
    })
    .optional(),
  primary: z.boolean().optional(),
  deleted: z.boolean().optional(),
  conferenceProperties: z
    .object({
      allowedConferenceSolutionTypes: z.array(z.string()),
    })
    .optional(),
});

export const CalendarListSchema = z.object({
  kind: z.string(),
  etag: z.string(),
  nextPageToken: z.string().optional(),
  nextSyncToken: z.string().optional(),
  items: z.array(CalendarListEntrySchema),
});

export const CalendarSchema = z.object({
  kind: z.string(),
  etag: z.string(),
  id: z.string(),
  summary: z.string(),
  description: z.string().optional(),
  location: z.string().optional(),
  timeZone: z.string(),
  conferenceProperties: z
    .object({
      allowedConferenceSolutionTypes: z.array(z.string()),
    })
    .optional(),
});

export const EventSchema = z.object({
  kind: z.string(),
  etag: z.string(),
  id: z.string(),
  status: z.string(),
  htmlLink: z.string(),
  created: z.string(),
  updated: z.string(),
  summary: z.string(),
  description: z.string().optional(),
  location: z.string().optional(),
  colorId: z.string().optional(),
  creator: z.object({
    id: z.string().optional(),
    email: z.string().optional(),
    displayName: z.string().optional(),
    self: z.boolean().optional(),
  }),
  organizer: z.object({
    id: z.string().optional(),
    email: z.string().optional(),
    displayName: z.string().optional(),
    self: z.boolean().optional(),
  }),
  start: z.object({
    date: z.string().optional(),
    dateTime: z.string().optional(),
    timeZone: z.string().optional(),
  }),
  end: z.object({
    date: z.string().optional(),
    dateTime: z.string().optional(),
    timeZone: z.string().optional(),
  }),
  recurrence: z.array(z.string()).optional(),
  recurringEventId: z.string().optional(),
  originalStartTime: z
    .object({
      date: z.string().optional(),
      dateTime: z.string().optional(),
      timeZone: z.string().optional(),
    })
    .optional(),
  transparency: z.string().optional(),
  visibility: z.string().optional(),
  iCalUID: z.string(),
  sequence: z.number(),
  attendees: z
    .array(
      z.object({
        id: z.string().optional(),
        email: z.string().optional(),
        displayName: z.string().optional(),
        organizer: z.boolean().optional(),
        self: z.boolean().optional(),
        resource: z.boolean().optional(),
        optional: z.boolean().optional(),
        responseStatus: z.string().optional(),
        comment: z.string().optional(),
        additionalGuests: z.number().optional(),
      }),
    )
    .optional(),
  attendeesOmitted: z.boolean().optional(),
  extendedProperties: z
    .object({
      private: z.record(z.string()).optional(),
      shared: z.record(z.string()).optional(),
    })
    .optional(),
  hangoutLink: z.string().optional(),
  conferenceData: z
    .object({
      createRequest: z
        .object({
          requestId: z.string(),
          conferenceSolutionKey: z.object({
            type: z.string(),
          }),
          status: z.object({
            statusCode: z.string(),
          }),
        })
        .optional(),
      entryPoints: z
        .array(
          z.object({
            entryPointType: z.string(),
            uri: z.string(),
            label: z.string().optional(),
            pin: z.string().optional(),
            accessCode: z.string().optional(),
            meetingCode: z.string().optional(),
            passcode: z.string().optional(),
            password: z.string().optional(),
          }),
        )
        .optional(),
      conferenceSolution: z
        .object({
          key: z.object({
            type: z.string(),
          }),
          name: z.string(),
          iconUri: z.string(),
        })
        .optional(),
      conferenceId: z.string().optional(),
      signature: z.string().optional(),
      notes: z.string().optional(),
    })
    .optional(),
  gadget: z
    .object({
      type: z.string().optional(),
      title: z.string().optional(),
      link: z.string().optional(),
      iconLink: z.string().optional(),
      width: z.number().optional(),
      height: z.number().optional(),
      display: z.string().optional(),
      preferences: z.record(z.string()).optional(),
    })
    .optional(),
  anyoneCanAddSelf: z.boolean().optional(),
  guestsCanInviteOthers: z.boolean().optional(),
  guestsCanModify: z.boolean().optional(),
  guestsCanSeeOtherGuests: z.boolean().optional(),
  privateCopy: z.boolean().optional(),
  locked: z.boolean().optional(),
  reminders: z
    .object({
      useDefault: z.boolean(),
      overrides: z
        .array(
          z.object({
            method: z.string(),
            minutes: z.number(),
          }),
        )
        .optional(),
    })
    .optional(),
  source: z
    .object({
      url: z.string().optional(),
      title: z.string().optional(),
    })
    .optional(),
  attachments: z
    .array(
      z.object({
        fileUrl: z.string(),
        title: z.string(),
        mimeType: z.string(),
        iconLink: z.string(),
        fileId: z.string(),
      }),
    )
    .optional(),
  eventType: z.string(),
});

export const FreeBusyRequestSchema = z.object({
  timeMin: z.string(),
  timeMax: z.string(),
  timeZone: z.string().optional(),
  groupExpansionMax: z.number().optional(),
  calendarExpansionMax: z.number().optional(),
  items: z.array(
    z.object({
      id: z.string(),
    }),
  ),
});

export const EventInstancesSchema = z.object({
  kind: z.string(),
  etag: z.string(),
  summary: z.string().optional(),
  description: z.string().optional(),
  updated: z.string(),
  timeZone: z.string().optional(),
  accessRole: z.string(),
  defaultReminders: z.array(
    z.object({
      method: z.string(),
      minutes: z.number(),
    }),
  ),
  nextPageToken: z.string().optional(),
  nextSyncToken: z.string().optional(),
  items: z.array(EventSchema),
});

export const QuickAddEventSchema = EventSchema;

export const WatchRequestSchema = z.object({
  id: z.string(),
  type: z.string(),
  address: z.string(),
  params: z.record(z.string()).optional(),
});

export const FreeBusyResponseSchema = z.object({
  kind: z.string(),
  timeMin: z.string(),
  timeMax: z.string(),
  calendars: z.record(
    z.object({
      busy: z.array(
        z.object({
          start: z.string(),
          end: z.string(),
        }),
      ),
    }),
  ),
});

export const SettingSchema = z.object({
  kind: z.string(),
  etag: z.string(),
  id: z.string(),
  value: z.string(),
});

export const SettingsSchema = z.object({
  kind: z.string(),
  etag: z.string(),
  nextPageToken: z.string().optional(),
  nextSyncToken: z.string().optional(),
  items: z.array(SettingSchema),
});

export const ColorsSchema = z.object({
  kind: z.string(),
  updated: z.string(),
  calendar: z.record(
    z.object({
      background: z.string(),
      foreground: z.string(),
    }),
  ),
  event: z.record(
    z.object({
      background: z.string(),
      foreground: z.string(),
    }),
  ),
});

// Update EventsSchema to match the provider's response
export const EventsSchema = z.object({
  kind: z.string(),
  etag: z.string(),
  summary: z.string().optional(),
  description: z.string().optional(),
  updated: z.string(),
  timeZone: z.string().optional(),
  accessRole: z.string(),
  defaultReminders: z.array(
    z.object({
      method: z.string(),
      minutes: z.number(),
    }),
  ),
  nextPageToken: z.string().optional(),
  nextSyncToken: z.string().optional(),
  items: z.array(EventSchema),
});

// Add ChannelSchema as per Google Calendar API
export const ChannelSchema = z.object({
  kind: z.string(),
  id: z.string(),
  resourceId: z.string(),
  resourceUri: z.string(),
  token: z.string().optional(),
  expiration: z.string().optional(),
  type: z.string(),
  address: z.string(),
  payload: z.boolean().optional(),
  params: z.record(z.string()).optional(),
});
