import { calendar_v3 } from "googleapis";
import { GoogleCalendarProvider } from "./providers/calendars/gcal/gcal-provider";

class WebSocketManager {
  private static instance: WebSocketManager;
  private clients: Set<WebSocket> = new Set();

  private constructor() {}

  public static getInstance(): WebSocketManager {
    if (!WebSocketManager.instance) {
      WebSocketManager.instance = new WebSocketManager();
    }
    return WebSocketManager.instance;
  }

  public addClient(ws: WebSocket): void {
    this.clients.add(ws);
  }

  public removeClient(ws: WebSocket): void {
    this.clients.delete(ws);
  }

  public broadcast(message: string): void {
    this.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  }

  public async handleIncrementalSync(env: any): Promise<void> {
    const gcalProvider = new GoogleCalendarProvider(env);
    const events = await gcalProvider.getEvents({ calendarId: "primary" });
    if (events.items && events.items.length > 0) {
      this.broadcast(
        JSON.stringify({ type: "SYNC_COMPLETED", payload: events }),
      );
    }
  }

  public async stopChannel(env: any, watchChannelId: string): Promise<void> {
    const gcalProvider = new GoogleCalendarProvider(env);
    await gcalProvider.stopChannel({
      id: watchChannelId,
      resourceId: "primary",
    });
  }
}

export const wsManager = WebSocketManager.getInstance();
