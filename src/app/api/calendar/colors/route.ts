import { withAuth } from "@/lib/api/with-auth";
import { getGoogleCalendarClient } from "@/lib/google-calendar";

export const GET = withAuth(async () => {
  const calendar = await getGoogleCalendarClient();
  const response = await calendar.colors.get();

  return { colors: response.data };
});
