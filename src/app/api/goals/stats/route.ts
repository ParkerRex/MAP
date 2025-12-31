import { goalsDb } from "@/db/goals";
import { withAuth } from "@/lib/api/with-auth";

export const GET = withAuth(async (user) => {
  const stats = await goalsDb.getCompletionStats(user.id);
  return { stats };
});
