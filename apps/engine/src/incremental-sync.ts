import { calendar_v3 } from "googleapis";
import type { ProviderParams } from "types";
import { GoogleCalendarProvider } from "./providers/calendars/gcal/gcal-provider";

export async function performIncrementalSync(env: Record<string, unknown>) {
  const providerParams: ProviderParams = {
    clientId: env.GOOGLE_CLIENT_ID as string,
    clientSecret: env.GOOGLE_CLIENT_SECRET as string,
    redirectUri: env.GOOGLE_REDIRECT_URI as string,
    refreshToken: env.GOOGLE_REFRESH_TOKEN as string,
    kv: env.KV as KVNamespace,
  };

  const gcalProvider = new GoogleCalendarProvider(providerParams);

  // Fetch the last sync token from KV storage
  const lastSyncToken = await (env.KV as KVNamespace).get("lastSyncToken");

  // Perform incremental sync
  const events = await gcalProvider.getEvents({
    calendarId: "primary",
    pageToken: lastSyncToken || undefined,
    maxResults: 100,
  });

  // Process the synced events
  for (const event of events.items || []) {
    // Handle each event (create, update, or delete)
    // You'll need to implement this logic based on your requirements
  }

  // Store the new sync token
  if (events.nextPageToken) {
    await (env.KV as KVNamespace).put("lastSyncToken", events.nextPageToken);
  }

  return events;
}
