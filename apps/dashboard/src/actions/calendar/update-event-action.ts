import { GoogleCalendarApi } from "@map/engine";
import { createClient } from "@map/supabase";
import { updateEventMutation } from "@map/supabase";

export async function updateEvent(
  userId: string,
  eventId: string,
  eventData: any,
) {
  const supabase = createClient();
  const gcalApi = new GoogleCalendarApi(/* Add necessary params */);

  // Update event in GCAL
  const updatedEvent = await gcalApi.updateEvent({
    calendarId: "primary",
    eventId: eventId,
    requestBody: eventData,
  });

  // Update event in Supabase
  await updateEventMutation(supabase, userId, updatedEvent);

  return updatedEvent;
}
