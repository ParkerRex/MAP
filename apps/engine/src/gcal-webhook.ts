import { Hono } from "hono";
import { performIncrementalSync } from "./incremental-sync";
import { wsManager } from "./websocket-manager";

const gcalWebhookApp = new Hono();

gcalWebhookApp.post("/gcal-webhook", async (c) => {
  const channelId = c.req.header("X-Goog-Channel-ID");
  const resourceId = c.req.header("X-Goog-Resource-ID");
  const state = c.req.header("X-Goog-Resource-State");

  if (state === "sync") {
    // Initial sync completed, no action needed
    return c.json({ success: true });
  }

  if (state === "exists" || state === "update") {
    // Perform incremental sync
    const events = await performIncrementalSync(c.env);

    // Broadcast changes to all connected WebSocket clients
    broadcastChanges(events);
  }

  return c.json({ success: true });
});

function broadcastChanges(events: any[]) {
  wsManager.broadcast(
    JSON.stringify({ type: "SYNC_COMPLETED", payload: events }),
  );
}

export { gcalWebhookApp };
