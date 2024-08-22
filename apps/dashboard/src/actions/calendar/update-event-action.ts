import { updateEventMutation } from "@map/supabase";
import { createClient } from "@map/supabase/client";
import { authorizedApiCall } from "../../utils/express-client";

export async function updateEvent(
  userId: string,
  eventId: string,
  eventData: any,
) {
  const updatedEvent = await authorizedApiCall(
    `/events/${eventId}`,
    "PUT",
    eventData,
  );

  const supabase = createClient();
  await updateEventMutation(supabase, userId, updatedEvent);

  return updatedEvent;
}
