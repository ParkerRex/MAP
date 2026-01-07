import { ConvexError } from "convex/values";
import { mutation, query } from "./_generated/server";
import { authComponent } from "./auth";

const DEFAULT_AUTH_PROVIDER = "google";
const DEFAULT_STATUS = "active";

function buildUserPatch(authUser: { email?: string | null; name?: string | null; image?: string | null }, now: number) {
  const displayName = authUser.name ?? authUser.email ?? undefined;
  return {
    email: authUser.email ?? undefined,
    displayName,
    profilePhotoUrl: authUser.image ?? undefined,
    updatedAt: now,
  };
}

export const getCurrent = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    const subject = identity?.subject ?? identity?.tokenIdentifier;
    if (!subject) {
      return null;
    }

    return await ctx.db
      .query("users")
      .withIndex("by_auth_subject", (q) => q.eq("authSubject", subject))
      .unique();
  },
});

export const ensure = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    const subject = identity?.subject ?? identity?.tokenIdentifier;
    if (!subject) {
      throw new ConvexError("Unauthorized");
    }

    const existing = await ctx.db
      .query("users")
      .withIndex("by_auth_subject", (q) => q.eq("authSubject", subject))
      .unique();

    if (existing) {
      return existing;
    }

    const authUser = await authComponent.getAuthUser(ctx);
    if (!authUser) {
      throw new ConvexError("Unauthorized");
    }

    const now = Date.now();
    const insertId = await ctx.db.insert("users", {
      authSubject: subject,
      authProvider: DEFAULT_AUTH_PROVIDER,
      status: DEFAULT_STATUS,
      createdAt: now,
      ...buildUserPatch(authUser, now),
    });

    return await ctx.db.get(insertId);
  },
});
