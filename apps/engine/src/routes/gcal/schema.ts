import { z } from "zod";

export const CreateEventSchema = z.object({
  calendarId: z.string(),
  event: z.object({
    summary: z.string(),
    description: z.string().optional(),
    start: z.object({
      dateTime: z.string().optional(),
      date: z.string().optional(),
    }),
    end: z.object({
      dateTime: z.string().optional(),
      date: z.string().optional(),
    }),
    attendees: z
      .array(
        z.object({
          email: z.string().email(),
        }),
      )
      .optional(),
  }),
});

// Schema for updating an event
export const UpdateEventSchema = z.object({
  eventId: z.string(),
  event: z.object({
    summary: z.string().optional(),
    description: z.string().optional(),
    start: z
      .object({
        dateTime: z.string().optional(),
        date: z.string().optional(),
      })
      .optional(),
    end: z
      .object({
        dateTime: z.string().optional(),
        date: z.string().optional(),
      })
      .optional(),
    attendees: z
      .array(
        z.object({
          email: z.string().email(),
        }),
      )
      .optional(),
  }),
});

// Schema for getting events
export const GetEventsParamsSchema = z.object({
  timeMin: z.string().optional(),
  timeMax: z.string().optional(),
});

// Schema for event response
export const EventSchema = z.object({
  id: z.string(),
  summary: z.string(),
  description: z.string().optional(),
  start: z.object({
    dateTime: z.string().optional(),
    date: z.string().optional(),
  }),
  end: z.object({
    dateTime: z.string().optional(),
    date: z.string().optional(),
  }),
  attendees: z
    .array(
      z.object({
        email: z.string().email(),
      }),
    )
    .optional(),
});

// Schema for getting events response
export const GetEventsSchema = z.object({
  data: z.array(EventSchema),
});

// Schema for ACL rule
export const AclSchema = z.object({
  kind: z.string(),
  etag: z.string(),
  id: z.string(),
  scope: z.object({
    type: z.string(),
    value: z.string().optional(),
  }),
  role: z.string(),
});

// Schema for listing ACL rules
export const AclListSchema = z.object({
  kind: z.string(),
  etag: z.string(),
  nextPageToken: z.string().optional(),
  items: z.array(AclSchema),
});

// Schema for Calendar List entry
export const CalendarListSchema = z.object({
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

// Schema for Calendar
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

// Schema for Colors
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

// Schema for FreeBusy
export const FreeBusySchema = z.object({
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

// Schema for Settings
export const SettingsSchema = z.object({
  kind: z.string(),
  etag: z.string(),
  nextPageToken: z.string().optional(),
  nextSyncToken: z.string().optional(),
  items: z.array(
    z.object({
      kind: z.string(),
      etag: z.string(),
      id: z.string(),
      value: z.string(),
    }),
  ),
});

// Schema for Channel
export const ChannelSchema = z.object({
  kind: z.string(),
  id: z.string(),
  resourceId: z.string(),
  resourceUri: z.string(),
  token: z.string().optional(),
  expiration: z.string().optional(),
});

// ACL request schemas
export const AclParamsSchema = z.object({
  calendarId: z.string(),
  ruleId: z.string().optional(),
});

// Calendar List request schemas
export const CalendarListParamsSchema = z.object({
  calendarId: z.string().optional(),
  minAccessRole: z.string().optional(),
  showDeleted: z.boolean().optional(),
  showHidden: z.boolean().optional(),
});

// Calendar request schemas
export const CalendarParamsSchema = z.object({
  calendarId: z.string(),
});

// FreeBusy request schema
export const FreeBusyRequestSchema = z.object({
  timeMin: z.string(),
  timeMax: z.string(),
  items: z.array(
    z.object({
      id: z.string(),
    }),
  ),
});

// Settings request schema
export const SettingsParamsSchema = z.object({
  setting: z.string().optional(),
});

// Channel request schema
export const ChannelRequestSchema = z.object({
  id: z.string(),
  type: z.string(),
  address: z.string(),
});

// Schema for listing calendars
export const CalendarListListSchema = z.object({
  kind: z.string(),
  etag: z.string(),
  nextPageToken: z.string().optional(),
  items: z.array(CalendarListSchema),
});

// Schema for creating a calendar
export const CreateCalendarSchema = z.object({
  summary: z.string(),
  description: z.string().optional(),
  location: z.string().optional(),
  timeZone: z.string().optional(),
});

// Schema for updating a calendar
export const UpdateCalendarSchema = z.object({
  summary: z.string().optional(),
  description: z.string().optional(),
  location: z.string().optional(),
  timeZone: z.string().optional(),
});

// Schema for auth tokens
export const AuthTokensSchema = z.object({
  access_token: z.string(),
  refresh_token: z.string().optional(),
  expiry_date: z.number(),
});

// Schema for watch request
export const WatchRequestSchema = z.object({
  id: z.string(),
  type: z.string(),
  address: z.string(),
  params: z
    .object({
      ttl: z.string(),
    })
    .optional(),
});

// Schema for stop channel request
export const StopChannelRequestSchema = z.object({
  id: z.string(),
  resourceId: z.string(),
});
