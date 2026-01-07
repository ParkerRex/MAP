import { ConvexError } from "convex/values";

type AuthIdentity = {
  subject?: string;
  tokenIdentifier?: string;
  email?: string;
  name?: string;
  pictureUrl?: string;
};

type AuthContext = {
  auth: {
    getUserIdentity: () => Promise<AuthIdentity | null>;
  };
  db: {
    query: (table: string) => any;
  };
};

export async function requireIdentity(ctx: AuthContext): Promise<AuthIdentity> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new ConvexError("Unauthorized");
  }
  return identity;
}

export async function requireUser(ctx: AuthContext) {
  const identity = await requireIdentity(ctx);
  const subject = identity.subject ?? identity.tokenIdentifier;
  if (!subject) {
    throw new ConvexError("Unauthorized");
  }

  const user = await ctx.db
    .query("users")
    .withIndex("by_auth_subject", (q: any) => q.eq("authSubject", subject))
    .unique();

  if (!user) {
    throw new ConvexError("User not found");
  }

  return user;
}

export function assertRole(user: { roles?: string[] }, role: string) {
  if (!user.roles?.includes(role)) {
    throw new ConvexError("Forbidden");
  }
}
