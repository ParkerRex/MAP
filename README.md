# Turbo Repo Todo List

## General

lol

- [x] Create package.json for each package/app
- [ ] Setup user signup
- [ ] /setup component form

### API Setup

- [ ] Emails
  - [ ] Swap out the actual templates
    - [ ] Waitlist
    - [ ] Onboarding
- [x] Set up tsconfig files for each package/app
- [ ] Implement separate actions for each dashboard event
- [ ] Create separate queries for Supabase functions
- [x] Find and replace all UI components
- [ ] Set up Resend for email functionality

- [ ] Configure Upstash setup
- [ ] Add back my custom scripts for resetting the db
- [ ] Set up Job for google calendar fetch and ongoing every few minutes

#### Log

- [x] Merge pull request #208 from midday-ai/feature/inbox-ocr-provider

## Omitting, but might come back to

- [ ] Add documents package that processes medicals and other documents

## Deployment Todos

- [ ] The actual hooks in GitHub
- [ ] Linking environment variables in a smart way
- [ ] Events
  - [ ] Adding instrumentation for the calendar and the server actions!

### Getting Around

#### For db

1. Make your sql changes in a new migration (`src/apps/api/migrations/`)
2. Reset your local DB
   1. Navigate to `src/apps/api`
   2. Run `supabase db reset`
3. Test them locally
4. Gen types --local
5. push your migration to prod `supabase db push --linked`

### How AI Assistant Works

1. Assistant Component (`dashboard/src/components/assistant/index.tsx`):
This is the main component that handles the chat interface. It manages the AI state and UI state, and renders the chat messages.
2. AI Action (`dashboard/src/actions/ai/chat/tools/burn-rate.tsx`):
This file defines the getBurnRateTool function, which is responsible for fetching burn rate data and preparing it for display.
3. UI Component (`dashboard/src/actions/ai/chat/tools/ui/burn-rate-ui.tsx`):
This component renders the burn rate information in a user-friendly format.
4. Queries (`packages/supabase/src/queries/index.ts` and `cached-queries.ts`):
These files contain the database queries to fetch burn rate data.
5. Utils (`dashboard/src/actions/ai/chat/utils.tsx`):
This file contains utility functions, including getUIComponentFromMessage which maps tool results to their corresponding UI components.

``` mermaid
    graph TD
        A[Assistant Component<br>assistant/index.tsx] --> B[AI Action<br>chat/tools/burn-rate.tsx]
        B --> C[Supabase Queries<br>queries/index.ts<br>queries/cached-queries.ts]
        C --> B
        B --> D[BurnRateUI Component<br>chat/tools/ui/burn-rate-ui.tsx]
        D --> E[Utils<br>chat/utils.tsx]
        E --> A
        A --> F[Chat Component<br>components/chat/index.tsx]
        F --> A
```

### Structure Explanation

1. CRUD Operations: You'll define CRUD operations for your calendar in a file similar to mutations/index.ts. These operations will interact with your database.
2. Google Calendar Provider: Create a google-calendar-provider.ts file (similar to plaid-provider.ts) that will handle the communication with Google Calendar API.
3. Google Calendar API: Create a google-calendar-api.ts file (similar to plaid-api.ts) that will contain the low-level API calls to Google Calendar.
4. Queries: Define your query functions in a file similar to queries/index.ts.
5. Cached Queries: Create cached versions of your queries in a file similar to queries/cached-queries.ts.
6. Types: Define your types in a separate file, e.g., types/calendar.ts.

`mutations/index.ts`

``` typescript
import { getCurrentUserTeamQuery } from "../queries";
import type { Client } from "../types";
import type { CalendarEvent } from "../types/calendar";

export async function createCalendarEvent(
  supabase: Client,
  event: Omit<CalendarEvent, "id" | "team_id">
) {
  const { data: userData } = await getCurrentUserTeamQuery(supabase);

  return supabase
    .from("calendar_events")
    .insert({
      ...event,
      team_id: userData?.team_id,
    })
    .select()
    .single();
}

export async function updateCalendarEvent(
  supabase: Client,
  id: string,
  event: Partial<CalendarEvent>
) {
  return supabase
    .from("calendar_events")
    .update(event)
    .eq("id", id)
    .select()
    .single();
}

export async function deleteCalendarEvent(supabase: Client, id: string) {
  return supabase
    .from("calendar_events")
    .delete()
    .eq("id", id)
    .select()
    .single();
}
```

`google-calendar-provider.ts`

``` typescript
import type { Provider } from "../interface";
import type {
  CreateEventRequest,
  UpdateEventRequest,
  DeleteEventRequest,
  GetEventsRequest,
  ProviderParams,
} from "../types";
import { GoogleCalendarApi } from "./google-calendar-api";
import { transformEvent } from "./transform";

export class GoogleCalendarProvider implements Provider {
  #api: GoogleCalendarApi;

  constructor(params: Omit<ProviderParams, "provider">) {
    this.#api = new GoogleCalendarApi(params);
  }

  async getEvents({ accessToken, timeMin, timeMax }: GetEventsRequest) {
    const response = await this.#api.getEvents({
      accessToken,
      timeMin,
      timeMax,
    });

    return response.map(transformEvent);
  }

  async createEvent({ accessToken, event }: CreateEventRequest) {
    const response = await this.#api.createEvent({
      accessToken,
      event,
    });

    return transformEvent(response);
  }

  async updateEvent({ accessToken, eventId, event }: UpdateEventRequest) {
    const response = await this.#api.updateEvent({
      accessToken,
      eventId,
      event,
    });

    return transformEvent(response);
  }

  async deleteEvent({ accessToken, eventId }: DeleteEventRequest) {
    await this.#api.deleteEvent({
      accessToken,
      eventId,
    });
  }
}
```

`engine/src/providers/GCal/google-calendar-api.ts`

``` typescript
import { google } from "googleapis";
import type { ProviderParams } from "../types";
import type {
  GetEventsRequest,
  CreateEventRequest,
  UpdateEventRequest,
  DeleteEventRequest,
} from "./types";

export class GoogleCalendarApi {
  #clientId: string;
  #clientSecret: string;

  constructor(params: Omit<ProviderParams, "provider">) {
    this.#clientId = params.envs.GOOGLE_CLIENT_ID;
    this.#clientSecret = params.envs.GOOGLE_CLIENT_SECRET;
  }

  async getEvents({ accessToken, timeMin, timeMax }: GetEventsRequest) {
    const auth = new google.auth.OAuth2(this.#clientId, this.#clientSecret);
    auth.setCredentials({ access_token: accessToken });

    const calendar = google.calendar({ version: "v3", auth });

    const response = await calendar.events.list({
      calendarId: "primary",
      timeMin,
      timeMax,
      singleEvents: true,
      orderBy: "startTime",
    });

    return response.data.items;
  }

  async createEvent({ accessToken, event }: CreateEventRequest) {
    const auth = new google.auth.OAuth2(this.#clientId, this.#clientSecret);
    auth.setCredentials({ access_token: accessToken });

    const calendar = google.calendar({ version: "v3", auth });

    const response = await calendar.events.insert({
      calendarId: "primary",
      requestBody: event,
    });

    return response.data;
  }

  async updateEvent({ accessToken, eventId, event }: UpdateEventRequest) {
    const auth = new google.auth.OAuth2(this.#clientId, this.#clientSecret);
    auth.setCredentials({ access_token: accessToken });

    const calendar = google.calendar({ version: "v3", auth });

    const response = await calendar.events.update({
      calendarId: "primary",
      eventId,
      requestBody: event,
    });

    return response.data;
  }

  async deleteEvent({ accessToken, eventId }: DeleteEventRequest) {
    const auth = new google.auth.OAuth2(this.#clientId, this.#clientSecret);
    auth.setCredentials({ access_token: accessToken });

    const calendar = google.calendar({ version: "v3", auth });

    await calendar.events.delete({
      calendarId: "primary",
      eventId,
    });
  }
}
```
