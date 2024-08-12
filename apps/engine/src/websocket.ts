import { Hono } from "hono";
import { upgradeWebSocket } from "hono/cloudflare-workers";
import { handleCalendarSync } from "./handle-calendar-sync";
import { performIncrementalSync } from "./incremental-sync";
import { GoogleCalendarProvider } from "./providers/calendars/gcal/gcal-provider";
import { wsManager } from "./websocket-manager";

const websocketApp = new Hono();

websocketApp.get(
  "/ws",
  upgradeWebSocket((c) => {
    let intervalId: NodeJS.Timeout;
    let watchChannelId: string;

    return {
      onOpen: async (ws) => {
        wsManager.addClient(ws);
        const gcalProvider = new GoogleCalendarProvider(c.env);

        // Set up Google Calendar watch
        const watchResponse = await gcalProvider.watchCalendar({
          calendarId: "primary",
          requestBody: {
            id: crypto.randomUUID(),
            type: "web_hook",
            address: `${c.env.WEBHOOK_URL}/gcal-webhook`,
          },
        });
        watchChannelId = watchResponse.id || "";

        // Perform initial sync
        const events = await performIncrementalSync(c.env);
        ws.send(JSON.stringify({ type: "SYNC_COMPLETED", payload: events }));

        // Set up interval for incremental sync (as a fallback)
        intervalId = setInterval(async () => {
          await wsManager.handleIncrementalSync(c.env);
        }, 300000); // 5 minutes interval
      },
      onMessage: async (ws, message) => {
        try {
          const parsedMessage = JSON.parse(message as string);
          await handleCalendarSync(parsedMessage, c.env, ws as WebSocket);
        } catch (error) {
          console.error("Error handling WebSocket message:", error);
        }
      },
      onClose: async (ws) => {
        console.log("WebSocket connection closed");
        wsManager.removeClient(ws);
        clearInterval(intervalId);
        if (watchChannelId) {
          await wsManager.stopChannel(c.env, watchChannelId);
        }
      },
      onError: (ws, err) => {
        console.error("WebSocket error:", err);
        wsManager.removeClient(ws);
        clearInterval(intervalId);
      },
    };
  }),
);

export { websocketApp };
