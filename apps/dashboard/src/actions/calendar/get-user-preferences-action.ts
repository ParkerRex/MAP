import { getUserPreferencesQuery } from "@map/supabase";
import { createClient } from "@map/supabase";
import { unstable_cache } from "next/cache";

export async function getUserPreferences(userId: string) {
  const supabase = createClient();

  return unstable_cache(
    async () => {
      return getUserPreferencesQuery(supabase, userId);
    },
    ["user-preferences", userId],
    {
      tags: [`user-preferences_${userId}`],
      revalidate: 180,
    },
  )();
}
