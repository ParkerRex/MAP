import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const WEBHOOK_SECRET = Deno.env.get("WEBHOOK_SECRET");
const EXPRESS_SERVER_URL = Deno.env.get("EXPRESS_SERVER_URL");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

serve(async (req: Request) => {
  try {
    // Fetch all users
    const { data: users, error } = await supabase.from("users").select("id");

    if (error) throw error;

    // Sync calendars for each user
    for (const user of users) {
      await fetch(`${EXPRESS_SERVER_URL}/sync-calendars`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${WEBHOOK_SECRET}`,
        },
        body: JSON.stringify({ type: "PERIODIC", record: { id: user.id } }),
      });
    }

    return new Response(JSON.stringify({ message: "Nightly sync completed successfully" }), {
      status: 200,
    });
  } catch (error) {
    console.error("Error during nightly sync:", error);
    return new Response(JSON.stringify({ error: "Failed to complete nightly sync" }), {
      status: 500,
    });
  }
});
