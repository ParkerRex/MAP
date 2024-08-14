import { GoogleCalendarApi } from "@map/providers";
import { createClient } from "@map/supabase";
import { addEventMutation } from "@map/supabase";

export async function addEvent(userId: string, eventData: any) {
  const supabase = createClient();
  const gcalApi = new GoogleCalendarApi(/* Add necessary params */);

  // Add event to GCAL
  const createdEvent = await gcalApi.insertEvent({
    calendarId: "primary",
    requestBody: eventData,
  });

  // Add event to Supabase
  await addEventMutation(supabase, userId, createdEvent);

  return createdEvent;
}
