import { unauthorized } from "@/lib/api/errors";
import { withAuth } from "@/lib/api/with-auth";
import { getCurrentSessionToken } from "@/lib/auth/session";

export const GET = withAuth(async () => {
  const token = await getCurrentSessionToken();
  if (!token) {
    throw unauthorized();
  }

  return { token };
});
