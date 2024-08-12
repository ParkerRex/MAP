import type { ProviderParams } from "types";
import { GoogleCalendarProvider } from "./providers/calendars/gcal/gcal-provider";

export async function performIncrementalSync(env: any) {
  const providerParams: ProviderParams = {
    clientId: env.GOOGLE_CLIENT_ID,
    clientSecret: env.GOOGLE_CLIENT_SECRET,
    redirectUri: env.GOOGLE_REDIRECT_URI,
    refreshToken: env.GOOGLE_REFRESH_TOKEN,
    kv: env.KV,
    provider: "google",
  };

  const gcalProvider = new GoogleCalendarProvider(providerParams);

  // Fetch the last sync token from KV storage
  const lastSyncToken = await env.KV.get("lastSyncToken");

  // Perform incremental sync
  const events = await gcalProvider.getEvents({
    calendarId: "primary",
    syncToken: lastSyncToken,
    maxResults: 100,
  });

  // Process the synced events
  for (const event of events.items || []) {
    // Handle each event (create, update, or delete)
    // You'll need to implement this logic based on your requirements
  }

  // Store the new sync token
  if (events.nextSyncToken) {
    await env.KV.put("lastSyncToken", events.nextSyncToken);
  }

  return events;
}
