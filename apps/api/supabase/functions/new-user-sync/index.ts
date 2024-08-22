// supabase/functions/new-user-sync/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const WEBHOOK_SECRET = Deno.env.get("WEBHOOK_SECRET");
const EXPRESS_SERVER_URL = Deno.env.get("EXPRESS_SERVER_URL");

interface WebhookPayload {
  type: string;
  record: {
    id: string;
    [key: string]: unknown;
  };
}

serve(async (req: Request) => {
  try {
    const payload: WebhookPayload = await req.json();
    const { type, record } = payload;

    if (type === "INSERT" && record && record.id) {
      const response = await fetch(`${EXPRESS_SERVER_URL}/sync-calendars`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${WEBHOOK_SECRET}`,
        },
        body: JSON.stringify({ type, record }),
      });

      if (!response.ok) {
        console.error("Failed to sync calendars:", await response.text());
        return new Response(JSON.stringify({ error: "Failed to sync calendars" }), { status: 500 });
      }

      return new Response(JSON.stringify({ message: "Calendar sync initiated successfully" }), {
        status: 200,
      });
    }

    return new Response(JSON.stringify({ error: "Invalid payload" }), { status: 400 });
  } catch (error) {
    console.error("Error processing request:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), { status: 500 });
  }
});
