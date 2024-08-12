import type { ProviderParams } from "types";
import { GoogleCalendarProvider } from "./providers/calendars/gcal/gcal-provider";

type WebSocketMessage = {
  type:
    | "EVENT_CREATED"
    | "EVENT_UPDATED"
    | "EVENT_DELETED"
    | "CALENDAR_UPDATED"
    | "SYNC_REQUIRED";
  payload: any;
};

export async function handleCalendarSync(
  message: WebSocketMessage,
  env: any,
  ws: WebSocket,
) {
  const providerParams: ProviderParams = {
    clientId: env.GOOGLE_CLIENT_ID,
    clientSecret: env.GOOGLE_CLIENT_SECRET,
    redirectUri: env.GOOGLE_REDIRECT_URI,
    refreshToken: env.GOOGLE_REFRESH_TOKEN,
    kv: env.KV,
    provider: "google",
  };

  const gcalProvider = new GoogleCalendarProvider(providerParams);

  switch (message.type) {
    case "EVENT_CREATED":
      const createdEvent = await gcalProvider.createEvent({
        calendarId: message.payload.calendarId,
        event: message.payload.event,
      });
      broadcastUpdate(ws, { type: "EVENT_CREATED", payload: createdEvent });
      break;
    case "EVENT_UPDATED":
      const updatedEvent = await gcalProvider.updateEvent({
        calendarId: message.payload.calendarId,
        eventId: message.payload.event.id,
        requestBody: message.payload.event,
      });
      broadcastUpdate(ws, { type: "EVENT_UPDATED", payload: updatedEvent });
      break;
    case "EVENT_DELETED":
      await gcalProvider.deleteEvent({
        calendarId: message.payload.calendarId,
        eventId: message.payload.eventId,
      });
      broadcastUpdate(ws, { type: "EVENT_DELETED", payload: message.payload });
      break;
    case "CALENDAR_UPDATED":
      const updatedCalendar = await gcalProvider.updateCalendar({
        calendarId: message.payload.calendarId,
        requestBody: message.payload.calendar,
      });
      broadcastUpdate(ws, {
        type: "CALENDAR_UPDATED",
        payload: updatedCalendar,
      });
      break;
    case "SYNC_REQUIRED":
      const syncedEvents = await performFullSync(gcalProvider, env);
      broadcastUpdate(ws, { type: "SYNC_COMPLETED", payload: syncedEvents });
      break;
    default:
      console.warn("Unknown message type:", message.type);
  }
}

function broadcastUpdate(ws: WebSocket, message: WebSocketMessage) {
  ws.send(JSON.stringify(message));
}

async function performFullSync(gcalProvider: GoogleCalendarProvider, env: any) {
  const lastSyncToken = await env.KV.get("lastSyncToken");
  const events = await gcalProvider.getEvents({
    calendarId: "primary",
    syncToken: lastSyncToken,
    maxResults: 2500, // Adjust this value based on your needs
  });

  if (events.nextSyncToken) {
    await env.KV.put("lastSyncToken", events.nextSyncToken);
  }

  return events.items;
}
