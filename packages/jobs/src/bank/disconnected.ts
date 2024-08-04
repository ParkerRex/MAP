// Import necessary modules and components
import ConnectionIssueEmail from "@midday/email/emails/connection-issue";
import { renderAsync } from "@react-email/components";
import { cronTrigger } from "@trigger.dev/sdk";
import { client, resend, supabase } from "../client";
import { processBatch } from "../utils/process";

// Define a job to handle disconnected bank connections
client.defineJob({
  id: "bank-connection-disconnected",
  name: "Bank - Connection Disconnected",
  version: "0.1.1",
  // Set up a cron trigger to run every Monday at 2:30 PM
  trigger: cronTrigger({
    cron: "30 14 * * 1",
  }),
  // Specify required integrations
  integrations: {
    supabase,
    resend,
  },
  // Main job execution function
  run: async (_, io) => {
    // Fetch disconnected bank connections from Supabase
    const { data } = await io.supabase.client
      .from("bank_connections")
      .select("id, team:team_id(id, name), name")
      .eq("status", "disconnected");

    // Fetch users associated with each disconnected bank connection
    const usersPromises =
      data?.map(async ({ team, name }) => {
        const { data: users } = await io.supabase.client
          .from("users_on_team")
          .select("id, user:user_id(id, email, full_name, locale)")
          .eq("team_id", team.id)
          .eq("role", "owner");

        return users?.map((user) => ({
          ...user,
          bankName: name,
          teamName: team.name,
        }));
      }) ?? [];

    const users = await Promise.all(usersPromises);

    // Prepare email content for each user
    const emailPromises = users
      ?.flat()
      .map(async ({ user, bankName, teamName }) => {
        const html = await renderAsync(
          ConnectionIssueEmail({
            fullName: user.full_name,
            locale: user.locale,
            bankName,
            teamName,
          }),
        );

        return {
          from: "Middaybot <middaybot@midday.ai>",
          to: [user.email],
          subject: "Bank Connection Issue",
          html,
        };
      });

    const emails = await Promise.all(emailPromises);

    // Send emails in batches of 50
    await processBatch(emails, 50, async (batch, index) => {
      await io.resend.batch.send(`send-email-${index}`, batch);
    });
  },
});
