import { getCalendarListsQuery } from "@map/supabase";
import { createClient } from "@map/supabase";
import { unstable_cache } from "next/cache";

export async function getCalendarLists(userId: string) {
  const supabase = createClient();

  return unstable_cache(
    async () => {
      return getCalendarListsQuery(supabase, userId);
    },
    ["calendar-lists", userId],
    {
      tags: [`calendar-lists_${userId}`],
      revalidate: 180,
    },
  )();
}
