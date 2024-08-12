import type { calendar_v3 } from "googleapis";
import type { ProviderParams } from "types";
import { GoogleCalendarProvider } from "./providers/calendars/gcal/gcal-provider";

type WebSocketMessage = {
  type:
    | "EVENT_CREATED"
    | "EVENT_UPDATED"
    | "EVENT_DELETED"
    | "CALENDAR_UPDATED"
    | "SYNC_REQUIRED"
    | "SYNC_COMPLETED";
  payload:
    | calendar_v3.Schema$Event
    | calendar_v3.Schema$Events
    | { calendarId: string; eventId: string };
};

export async function handleCalendarSync(
  message: WebSocketMessage,
  env: Record<string, unknown>,
  ws: WebSocket,
) {
  const providerParams: ProviderParams = {
    clientId: env.GOOGLE_CLIENT_ID as string,
    clientSecret: env.GOOGLE_CLIENT_SECRET as string,
    redirectUri: env.GOOGLE_REDIRECT_URI as string,
    refreshToken: env.GOOGLE_REFRESH_TOKEN as string,
    kv: env.KV as KVNamespace,
  };

  const gcalProvider = new GoogleCalendarProvider(providerParams);

  switch (message.type) {
    case "EVENT_CREATED": {
      const createdEvent = await gcalProvider.createEvent({
        calendarId: (message.payload as calendar_v3.Schema$Event)
          .calendarId as string,
        event: message.payload as calendar_v3.Schema$Event,
      });
      broadcastUpdate(ws, {
        type: "EVENT_CREATED",
        payload: createdEvent,
      });
      break;
    }
    case "EVENT_UPDATED": {
      const updatedEvent = await gcalProvider.updateEvent({
        calendarId: (message.payload as calendar_v3.Schema$Event)
          .calendarId as string,
        eventId: (message.payload as calendar_v3.Schema$Event).id as string,
        event: message.payload as calendar_v3.Schema$Event,
      });
      broadcastUpdate(ws, { type: "EVENT_UPDATED", payload: updatedEvent });
      break;
    }
    case "EVENT_DELETED": {
      const { calendarId, eventId } = message.payload as {
        calendarId: string;
        eventId: string;
      };
      await gcalProvider.deleteEvent({
        calendarId,
        eventId,
      });
      broadcastUpdate(ws, { type: "EVENT_DELETED", payload: message.payload });
      break;
    }
    case "CALENDAR_UPDATED": {
      const updatedCalendar = await gcalProvider.updateCalendar({
        calendarId: (message.payload as calendar_v3.Schema$Calendar)
          .id as string,
        calendar: message.payload as calendar_v3.Schema$Calendar,
      });
      broadcastUpdate(ws, {
        type: "CALENDAR_UPDATED",
        payload: updatedCalendar,
      });
      break;
    }
    case "SYNC_REQUIRED": {
      const syncedEvents = await performFullSync(gcalProvider, env);
      broadcastUpdate(ws, { type: "SYNC_COMPLETED", payload: syncedEvents });
      break;
    }
    default:
      console.warn("Unknown message type:", message.type);
  }
}

function broadcastUpdate(ws: WebSocket, message: WebSocketMessage) {
  ws.send(JSON.stringify(message));
}

async function performFullSync(
  gcalProvider: GoogleCalendarProvider,
  env: Record<string, unknown>,
) {
  const lastSyncToken = await (env.KV as KVNamespace).get("lastSyncToken");
  const events = await gcalProvider.getEvents({
    calendarId: "primary",
    pageToken: lastSyncToken || undefined,
    maxResults: 2500, // Adjust this value based on your needs
  });

  if (events.nextPageToken) {
    await (env.KV as KVNamespace).put("lastSyncToken", events.nextPageToken);
  }

  return events.items;
}
