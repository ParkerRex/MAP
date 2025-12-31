import { type NextRequest, NextResponse } from "next/server";
import { handleApiError, unauthorized } from "@/lib/api/errors";
import { getUser } from "@/lib/auth";
import { getGoogleCalendarClient } from "@/lib/google-calendar";

export async function GET(request: NextRequest) {
  try {
    const user = await getUser();

    if (!user) {
      throw unauthorized();
    }

    const { searchParams } = new URL(request.url);
    const pageToken = searchParams.get("pageToken");
    const minAccessRole = searchParams.get("minAccessRole") as
      | "freeBusyReader"
      | "owner"
      | "reader"
      | "writer"
      | null;
    const showDeleted = searchParams.get("showDeleted") === "true";
    const showHidden = searchParams.get("showHidden") === "true";

    const calendar = await getGoogleCalendarClient();

    const response = await calendar.calendarList.list({
      maxResults: 250,
      pageToken: pageToken || undefined,
      minAccessRole: minAccessRole || undefined,
      showDeleted,
      showHidden,
    });

    const calendars = response.data.items || [];

    return NextResponse.json({
      calendars,
      nextPageToken: response.data.nextPageToken,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
