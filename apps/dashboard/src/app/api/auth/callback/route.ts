import { AuthManager } from "@/lib/integrations/auth";
import { CalendarSyncService } from "@/services/CalendarSyncService";
import { createClient } from "@map/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { searchParams, origin } = new URL(request.url);
    const code = searchParams.get("code");
    const next = searchParams.get("next") ?? "/";

    if (!code) {
      console.error("No code provided in callback");
      return NextResponse.redirect(`${origin}/auth/auth-code-error`);
    }

    const supabase = createClient();

    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error || !data.session) {
      console.error("Failed to exchange code for session", { error });
      return NextResponse.redirect(`${origin}/auth/auth-code-error`);
    }

    const authManager = new AuthManager();

    // Store the integration details
    if (data.session.provider_token && data.session.provider_refresh_token) {
      try {
        await authManager.storeToken("GOOGLE", data.user.id, {
          access_token: data.session.provider_token,
          refresh_token: data.session.provider_refresh_token,
          expires_in: 3600, // Assuming 1 hour expiration, adjust as needed
        });

        try {
          const calendarSyncService = new CalendarSyncService();
          await calendarSyncService.syncCalendar(data.user.id);
        } catch (syncError) {
          console.error("Error during initial sync:", syncError);
          // Consider redirecting to an error page or showing an error message
          return NextResponse.redirect(
            `${origin}/error?message=${encodeURIComponent("Initial calendar sync failed. Please try again later.")}`,
          );
        }
      } catch (error) {
        console.error("Error during token storage or initial sync:", error);
        return NextResponse.redirect(
          `${origin}/error?message=${encodeURIComponent((error as Error).message)}`,
        );
      }
    } else {
      console.error("Missing provider tokens in session data");
      return NextResponse.redirect(`${origin}/login`);
    }

    return NextResponse.redirect(`${origin}${next}`);
  } catch (error) {
    console.error("Error in auth callback:", error);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_BASE_URL}/error?message=${encodeURIComponent(
        `Authentication failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      )}`,
    );
  }
}
