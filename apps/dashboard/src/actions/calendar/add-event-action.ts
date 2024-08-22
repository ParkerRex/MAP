import { authorizedApiCall } from "../../utils/express-client";

export async function addEvent(userId: string, eventData: any) {
  const createdEvent = await authorizedApiCall("/events", "POST", eventData);

  const supabase = createClient();
  await addEventMutation(supabase, userId, createdEvent);

  return createdEvent;
}
