import { Hono } from "hono";
import { upgradeWebSocket } from "hono/cloudflare-workers";
import { handleCalendarSync } from "./handle-calendar-sync";
import { performIncrementalSync } from "./incremental-sync";

const websocketApp = new Hono();

websocketApp.get(
  "/ws",
  upgradeWebSocket((c) => {
    let intervalId: NodeJS.Timeout;

    return {
      onOpen: (ws) => {
        // Perform initial sync
        performIncrementalSync(c.env)
          .then((events) => {
            ws.send(
              JSON.stringify({ type: "SYNC_COMPLETED", payload: events }),
            );
          })
          .catch(console.error);

        // Set up interval for incremental sync
        intervalId = setInterval(() => {
          performIncrementalSync(c.env)
            .then((events) => {
              if (events.length > 0) {
                ws.send(
                  JSON.stringify({ type: "SYNC_COMPLETED", payload: events }),
                );
              }
            })
            .catch(console.error);
        }, 30000); // 30 seconds interval
      },
      onMessage: async (ws, message) => {
        try {
          const parsedMessage = JSON.parse(message as string);
          await handleCalendarSync(parsedMessage, c.env, ws);
        } catch (error) {
          console.error("Error handling WebSocket message:", error);
        }
      },
      onClose: () => {
        console.log("WebSocket connection closed");
        clearInterval(intervalId);
      },
      onError: (err) => {
        console.error("WebSocket error:", err);
        clearInterval(intervalId);
      },
    };
  }),
);

export { websocketApp };
