import "server-only";

// Re-export constants from shared file
export { DEV_USER_ID, DEV_USER, type User } from "./auth-constants";

import { DEV_USER } from "./auth-constants";
import type { User } from "./auth-constants";

// Get the current authenticated user
// In production, this would verify a session token
export async function getUser(): Promise<User | null> {
  // For development, always return the dev user
  return DEV_USER;
}

// Require authentication - throws if not authenticated
export async function requireUser(): Promise<User> {
  const user = await getUser();
  if (!user) {
    throw new Error("Unauthorized");
  }
  return user;
}
