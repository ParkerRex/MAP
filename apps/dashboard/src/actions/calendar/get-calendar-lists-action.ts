import { unstable_cache } from "next/cache";
import { authorizedApiCall } from "../../utils/express-client";

export async function getCalendarLists(userId: string) {
  return unstable_cache(
    async () => {
      return authorizedApiCall("/calendars");
    },
    ["calendar-lists", userId],
    {
      tags: [`calendar-lists_${userId}`],
      revalidate: 180,
    },
  )();
}
