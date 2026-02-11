import "server-only";

import { and, eq, gt } from "drizzle-orm";
import { nanoid } from "nanoid";
import { cookies, headers } from "next/headers";
import { db } from "@/db";
import { sessions, users } from "@/db/schema";

const SESSION_COOKIE_NAME = "session";
const SESSION_EXPIRY_DAYS = 30;

export interface SessionUser {
  id: string;
  email: string;
  displayName: string | null;
  firstName: string | null;
  lastName: string | null;
  profilePhotoUrl: string | null;
  githubUsername: string | null;
}

function getExpiryDate(): Date {
  const date = new Date();
  date.setDate(date.getDate() + SESSION_EXPIRY_DAYS);
  return date;
}

/**
 * Create a session for a user.
 * By default, sets a cookie for web clients.
 * Pass skipCookie: true for iOS clients that use Bearer tokens.
 */
export async function createSession(
  userId: string,
  options?: { skipCookie?: boolean },
): Promise<string> {
  const sessionId = nanoid(32);
  const expiresAt = getExpiryDate();

  await db.insert(sessions).values({
    id: sessionId,
    userId,
    expiresAt,
  });

  // Skip cookie for iOS clients (they use Bearer token)
  if (!options?.skipCookie) {
    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE_NAME, sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      expires: expiresAt,
      path: "/",
    });
  }

  return sessionId;
}

/**
 * Get session ID from either cookie or Authorization header.
 * Supports both web (cookie) and iOS (Bearer token) clients.
 */
async function getSessionId(): Promise<string | null> {
  // First, check for Bearer token in Authorization header (iOS)
  const headerStore = await headers();
  const authHeader = headerStore.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.slice(7);
  }

  // Fall back to cookie (web)
  const cookieStore = await cookies();
  return cookieStore.get(SESSION_COOKIE_NAME)?.value ?? null;
}

export async function getCurrentSessionToken(): Promise<string | null> {
  return getSessionId();
}

export async function getSession(): Promise<SessionUser | null> {
  const sessionId = await getSessionId();

  if (!sessionId) {
    return null;
  }

  const result = await db
    .select({
      id: users.id,
      email: users.email,
      displayName: users.displayName,
      firstName: users.firstName,
      lastName: users.lastName,
      profilePhotoUrl: users.profilePhotoUrl,
      githubUsername: users.githubUsername,
    })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(and(eq(sessions.id, sessionId), gt(sessions.expiresAt, new Date())))
    .limit(1);

  const user = result[0] ?? null;

  // Sliding session: refresh expiry on each authenticated request
  if (user) {
    // Fire and forget - don't block the response
    refreshSession().catch(() => {
      // Silently ignore refresh errors
    });
  }

  return user;
}

/**
 * Delete the current session.
 * For iOS, you can optionally pass the session ID directly.
 */
export async function deleteSession(sessionIdToDelete?: string): Promise<void> {
  const sessionId = sessionIdToDelete ?? (await getSessionId());

  if (sessionId) {
    await db.delete(sessions).where(eq(sessions.id, sessionId));
  }

  // Clear cookie if it exists (no-op for iOS Bearer token requests)
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

/**
 * Refresh the session expiry (sliding expiration).
 * Works for both cookie and Bearer token sessions.
 */
export async function refreshSession(): Promise<void> {
  const sessionId = await getSessionId();

  if (!sessionId) {
    return;
  }

  const expiresAt = getExpiryDate();

  await db.update(sessions).set({ expiresAt }).where(eq(sessions.id, sessionId));

  // Update cookie if using cookie-based auth (web clients)
  const cookieStore = await cookies();
  const hasCookie = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (hasCookie) {
    cookieStore.set(SESSION_COOKIE_NAME, sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      expires: expiresAt,
      path: "/",
    });
  }
}
