import { type AuthFunctions, createClient } from "@convex-dev/better-auth";
import { convex } from "@convex-dev/better-auth/plugins";
import { betterAuth } from "better-auth/minimal";
import type { GenericCtx } from "convex/server";
import { components, internal } from "./_generated/api";
import type { DataModel } from "./_generated/dataModel";
import authConfig from "./auth.config";

const DEFAULT_AUTH_PROVIDER = "google";
const DEFAULT_STATUS = "active";

function requireEnv(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is not configured`);
  }
  return value;
}

type BetterAuthUserDoc = {
  _id: string;
  email?: string | null;
  name?: string | null;
  image?: string | null;
};

function buildUserPatch(doc: BetterAuthUserDoc, now: number) {
  const displayName = doc.name ?? doc.email ?? undefined;
  return {
    email: doc.email ?? undefined,
    displayName,
    profilePhotoUrl: doc.image ?? undefined,
    updatedAt: now,
  };
}

const authFunctions: AuthFunctions = internal.auth;

export const authComponent = createClient<DataModel>(components.betterAuth, {
  authFunctions,
  triggers: {
    user: {
      onCreate: async (ctx, doc: BetterAuthUserDoc) => {
        const now = Date.now();
        const authSubject = String(doc._id);
        const existing = await ctx.db
          .query("users")
          .withIndex("by_auth_subject", (q) => q.eq("authSubject", authSubject))
          .unique();
        const patch = buildUserPatch(doc, now);
        if (existing) {
          await ctx.db.patch(existing._id, patch);
          return;
        }
        await ctx.db.insert("users", {
          authSubject,
          authProvider: DEFAULT_AUTH_PROVIDER,
          status: DEFAULT_STATUS,
          createdAt: now,
          ...patch,
        });
      },
      onUpdate: async (ctx, doc: BetterAuthUserDoc) => {
        const now = Date.now();
        const authSubject = String(doc._id);
        const existing = await ctx.db
          .query("users")
          .withIndex("by_auth_subject", (q) => q.eq("authSubject", authSubject))
          .unique();
        if (!existing) {
          await ctx.db.insert("users", {
            authSubject,
            authProvider: DEFAULT_AUTH_PROVIDER,
            status: DEFAULT_STATUS,
            createdAt: now,
            ...buildUserPatch(doc, now),
          });
          return;
        }
        await ctx.db.patch(existing._id, buildUserPatch(doc, now));
      },
      onDelete: async (ctx, doc: BetterAuthUserDoc) => {
        const now = Date.now();
        const authSubject = String(doc._id);
        const existing = await ctx.db
          .query("users")
          .withIndex("by_auth_subject", (q) => q.eq("authSubject", authSubject))
          .unique();
        if (!existing) {
          return;
        }
        await ctx.db.patch(existing._id, {
          status: "deleted",
          deletedAt: now,
          updatedAt: now,
        });
      },
    },
  },
});

export const { onCreate, onUpdate, onDelete } = authComponent.triggersApi();

export function createAuth(ctx: GenericCtx<DataModel>) {
  return betterAuth({
    baseURL: requireEnv("SITE_URL"),
    database: authComponent.adapter(ctx),
    socialProviders: {
      google: {
        clientId: requireEnv("GOOGLE_CLIENT_ID"),
        clientSecret: requireEnv("GOOGLE_CLIENT_SECRET"),
      },
    },
    plugins: [convex({ authConfig })],
  });
}
