export interface ProviderParams {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  refreshToken: string;
  kv?: KVNamespace;
}

export interface AclRequest {
  calendarId: string;
  ruleId?: string;
}

export interface AclResponse {
  kind: string;
  etag: string;
  id: string;
  scope: {
    type: string;
    value: string;
  };
  role: string;
}

export interface CalendarListRequest {
  calendarId: string;
}

export interface CalendarListResponse {
  kind: string;
  etag: string;
  id: string;
  summary: string;
  description: string;
  location: string;
  timeZone: string;
  summaryOverride: string;
  colorId: string;
  backgroundColor: string;
  foregroundColor: string;
  hidden: boolean;
  selected: boolean;
  accessRole: string;
  defaultReminders: Array<{
    method: string;
    minutes: number;
  }>;
  notificationSettings: {
    notifications: Array<{
      type: string;
      method: string;
    }>;
  };
  primary: boolean;
  deleted: boolean;
}

export interface CalendarRequest {
  calendarId: string;
}

export interface CalendarResponse {
  kind: string;
  etag: string;
  id: string;
  summary: string;
  description: string;
  location: string;
  timeZone: string;
  summaryOverride: string;
  colorId: string;
  backgroundColor: string;
  foregroundColor: string;
  hidden: boolean;
  selected: boolean;
  accessRole: string;
  defaultReminders: Array<{
    method: string;
    minutes: number;
  }>;
  notificationSettings: {
    notifications: Array<{
      type: string;
      method: string;
    }>;
  };
  primary: boolean;
  deleted: boolean;
}

export interface ChannelRequest {
  id: string;
  type: string;
  address: string;
  token?: string;
  expiration?: string;
  params?: {
    [key: string]: string;
  };
}

export interface ChannelResponse {
  kind: string;
  id: string;
  resourceId: string;
  resourceUri: string;
  token: string;
  expiration: string;
}

export interface ColorsResponse {
  kind: string;
  updated: string;
  calendar: {
    [key: string]: {
      background: string;
      foreground: string;
    };
  };
  event: {
    [key: string]: {
      background: string;
      foreground: string;
    };
  };
}

export interface CreateCalendarRequest {
  summary: string;
  description?: string;
  location?: string;
  timeZone?: string;
}

export interface CreateEventRequest {
  calendarId: string;
  event: {
    summary: string;
    description?: string;
    location?: string;
    timeZone?: string;
  };
}

export interface DeleteCalendarRequest {
  calendarId: string;
}

export interface DeleteEventRequest {
  calendarId: string;
  eventId: string;
}

export interface EventRequest {
  calendarId: string;
  eventId: string;
}

export interface EventResponse {
  kind: string;
  etag: string;
  id: string;
  status: string;
  htmlLink: string;
  created: string;
  updated: string;
  summary: string;
  description: string;
  location: string;
  colorId: string;
  creator: {
    id: string;
    email: string;
    displayName: string;
    self: boolean;
  };
  organizer: {
    id: string;
    email: string;
    displayName: string;
    self: boolean;
  };
  start: {
    date: string;
    dateTime: string;
    timeZone: string;
  };
  end: {
    date: string;
    dateTime: string;
    timeZone: string;
  };
  endTimeUnspecified: boolean;
  recurrence: string[];
  recurringEventId: string;
  originalStartTime: {
    date: string;
    dateTime: string;
    timeZone: string;
  };
  transparency: string;
  visibility: string;
  iCalUID: string;
  sequence: number;
  attendees: Array<{
    id: string;
    email: string;
    displayName: string;
    organizer: boolean;
    self: boolean;
    resource: boolean;
    optional: boolean;
    responseStatus: string;
    comment: string;
    additionalGuests: number;
  }>;
  attendeesOmitted: boolean;
  extendedProperties: {
    private: {
      [key: string]: string;
    };
    shared: {
      [key: string]: string;
    };
  };
  hangoutLink: string;
  conferenceData: {
    createRequest: {
      requestId: string;
      conferenceSolutionKey: {
        type: string;
      };
      status: {
        statusCode: string;
      };
    };
    entryPoints: Array<{
      entryPointType: string;
      uri: string;
      label: string;
      pin: string;
      accessCode: string;
      meetingCode: string;
      passcode: string;
      password: string;
    }>;
    conferenceSolution: {
      key: {
        type: string;
      };
      name: string;
      iconUri: string;
    };
    conferenceId: string;
    signature: string;
    notes: string;
  };
  gadget: {
    type: string;
    title: string;
    link: string;
    iconLink: string;
    width: number;
    height: number;
    display: string;
  };
  anyoneCanAddSelf: boolean;
  guestsCanInviteOthers: boolean;
  guestsCanModify: boolean;
  guestsCanSeeOtherGuests: boolean;
  privateCopy: boolean;
  locked: boolean;
  reminders: {
    useDefault: boolean;
    overrides: Array<{
      method: string;
      minutes: number;
    }>;
  };
  source: {
    url: string;
    title: string;
  };
}

export interface FreeBusyRequest {
  timeMin: string;
  timeMax: string;
  timeZone?: string;
  groupExpansionMax?: number;
  calendarExpansionMax?: number;
  items: Array<{
    id: string;
  }>;
}

export interface FreeBusyResponse {
  kind: string;
  timeMin: string;
  timeMax: string;
  calendars: {
    [key: string]: {
      busy: Array<{
        start: string;
        end: string;
      }>;
    };
  };
  groups: {
    [key: string]: {
      calendars: string[];
    };
  };
}

export interface GetCalendarsResponse {
  kind: string;
  etag: string;
  id: string;
  status: string;
  htmlLink: string;
  created: string;
  updated: string;
  summary: string;
  description: string;
  location: string;
  colorId: string;
  creator: {
    id: string;
    email: string;
    displayName: string;
    self: boolean;
  };
  organizer: {
    id: string;
    email: string;
    displayName: string;
    self: boolean;
  };
  start: {
    date: string;
    dateTime: string;
    timeZone: string;
  };
  end: {
    date: string;
    dateTime: string;
    timeZone: string;
  };
  endTimeUnspecified: boolean;
  recurrence: string[];
  recurringEventId: string;
  originalStartTime: {
    date: string;
    dateTime: string;
    timeZone: string;
  };
  transparency: string;
  visibility: string;
  iCalUID: string;
  sequence: number;
  attendees: Array<{
    id: string;
    email: string;
    displayName: string;
    organizer: boolean;
    self: boolean;
    resource: boolean;
    optional: boolean;
    responseStatus: string;
    comment: string;
    additionalGuests: number;
  }>;
  attendeesOmitted: boolean;
  extendedProperties: {
    private: {
      [key: string]: string;
    };
    shared: {
      [key: string]: string;
    };
  };
  hangoutLink: string;
  conferenceData: {
    createRequest: {
      requestId: string;
      conferenceSolutionKey: {
        type: string;
      };
      status: {
        statusCode: string;
      };
    };
    entryPoints: Array<{
      entryPointType: string;
      uri: string;
      label: string;
      pin: string;
      accessCode: string;
      meetingCode: string;
      passcode: string;
      password: string;
    }>;
    conferenceSolution: {
      key: {
        type: string;
      };
      name: string;
      iconUri: string;
    };
    conferenceId: string;
    signature: string;
    notes: string;
  };
  gadget: {
    type: string;
    title: string;
    link: string;
    iconLink: string;
    width: number;
    height: number;
    display: string;
  };
  anyoneCanAddSelf: boolean;
  guestsCanInviteOthers: boolean;
  guestsCanModify: boolean;
  guestsCanSeeOtherGuests: boolean;
  privateCopy: boolean;
  locked: boolean;
  reminders: {
    useDefault: boolean;
    overrides: Array<{
      method: string;
      minutes: number;
    }>;
  };
  source: {
    url: string;
    title: string;
  };
}

export interface FreeBusyRequest {
  timeMin: string;
  timeMax: string;
  timeZone?: string;
  groupExpansionMax?: number;
  calendarExpansionMax?: number;
  items: Array<{
    id: string;
  }>;
}

export interface FreeBusyResponse {
  kind: string;
  timeMin: string;
  timeMax: string;
  calendars: {
    [key: string]: {
      busy: Array<{
        start: string;
        end: string;
      }>;
    };
  };
  groups: {
    [key: string]: {
      calendars: string[];
    };
  };
}

export interface GetCalendarsResponse {
  kind: string;
  etag: string;
  items: Array<CalendarResponse>;
}

export interface GetEventsRequest {
  calendarId: string;
  timeMin?: string;
  timeMax?: string;
  maxResults?: number;
  singleEvents?: boolean;
  orderBy?: string;
}

export interface GetEventsResponse {
  kind: string;
  etag: string;
  summary: string;
  description: string;
  updated: string;
  timeZone: string;
  accessRole: string;
  defaultReminders: Array<{
    method: string;
    minutes: number;
  }>;
  nextPageToken: string;
  items: Array<EventResponse>;
}

export interface SettingRequest {
  setting: string;
}

export interface SettingResponse {
  kind: string;
  etag: string;
  id: string;
  value: string;
}

export interface UpdateEventRequest {
  calendarId: string;
  eventId: string;
  event: {
    summary: string;
    description?: string;
    location?: string;
    start: {
      date?: string;
      dateTime?: string;
      timeZone?: string;
    };
    end: {
      date?: string;
      dateTime?: string;
      timeZone?: string;
    };
    attendees?: Array<{
      email: string;
      displayName?: string;
      organizer?: boolean;
      self?: boolean;
      resource?: boolean;
      optional?: boolean;
      responseStatus?: string;
      comment?: string;
      additionalGuests?: number;
    }>;
    reminders?: {
      useDefault?: boolean;
      overrides?: Array<{
        method: string;
        minutes: number;
      }>;
    };
  };
}
