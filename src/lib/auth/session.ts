import "server-only";

import { and, eq, gt } from "drizzle-orm";
import { nanoid } from "nanoid";
import { cookies } from "next/headers";
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
}

function getExpiryDate(): Date {
  const date = new Date();
  date.setDate(date.getDate() + SESSION_EXPIRY_DAYS);
  return date;
}

export async function createSession(userId: string): Promise<string> {
  const sessionId = nanoid(32);
  const expiresAt = getExpiryDate();

  await db.insert(sessions).values({
    id: sessionId,
    userId,
    expiresAt,
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, sessionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    expires: expiresAt,
    path: "/",
  });

  return sessionId;
}

export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE_NAME)?.value;

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
    })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(and(eq(sessions.id, sessionId), gt(sessions.expiresAt, new Date())))
    .limit(1);

  return result[0] ?? null;
}

export async function deleteSession(): Promise<void> {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (sessionId) {
    await db.delete(sessions).where(eq(sessions.id, sessionId));
  }

  cookieStore.delete(SESSION_COOKIE_NAME);
}

export async function refreshSession(): Promise<void> {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!sessionId) {
    return;
  }

  const expiresAt = getExpiryDate();

  await db.update(sessions).set({ expiresAt }).where(eq(sessions.id, sessionId));

  cookieStore.set(SESSION_COOKIE_NAME, sessionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    expires: expiresAt,
    path: "/",
  });
}
