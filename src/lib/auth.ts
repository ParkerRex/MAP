import "server-only";

import { getSession, type SessionUser } from "./auth/session";

export type User = SessionUser;

// Get the current authenticated user from session
export async function getUser(): Promise<User | null> {
  return getSession();
}

// Require authentication - throws if not authenticated
export async function requireUser(): Promise<User> {
  const user = await getUser();
  if (!user) {
    throw new Error("Unauthorized");
  }
  return user;
}

// Re-export session utilities
export { createSession, deleteSession, refreshSession } from "./auth/session";
