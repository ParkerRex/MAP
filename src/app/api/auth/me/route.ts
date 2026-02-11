import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { handleApiError, unauthorized, validationError } from "@/lib/api/errors";
import { withAuth } from "@/lib/api/with-auth";
import { getUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getUser();

    if (!user) {
      throw unauthorized();
    }

    return NextResponse.json({ user });
  } catch (error) {
    return handleApiError(error);
  }
}

export const PATCH = withAuth(async (user, request) => {
  const body = await request.json().catch(() => ({}));
  let githubUsername = typeof body.githubUsername === "string" ? body.githubUsername.trim() : null;

  if (githubUsername?.startsWith("@")) {
    githubUsername = githubUsername.slice(1).trim();
  }

  if (githubUsername === "") {
    githubUsername = null;
  }

  if (githubUsername) {
    const githubUsernamePattern = /^(?!.*--)[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,37}[a-zA-Z0-9])?$/;
    if (!githubUsernamePattern.test(githubUsername)) {
      throw validationError("Invalid GitHub username", {
        githubUsername,
      });
    }
  }

  const [updated] = await db
    .update(users)
    .set({ githubUsername })
    .where(eq(users.id, user.id))
    .returning({
      id: users.id,
      email: users.email,
      displayName: users.displayName,
      firstName: users.firstName,
      lastName: users.lastName,
      profilePhotoUrl: users.profilePhotoUrl,
      githubUsername: users.githubUsername,
    });

  return { user: updated };
});
