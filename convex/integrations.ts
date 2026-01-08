import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireUser } from "./lib/auth";

const integrationProvider = v.union(
  v.literal("google"),
  v.literal("whoop"),
  v.literal("openai"),
  v.literal("claude"),
  v.literal("github"),
);

/**
 * Get all integrations for the current user
 */
export const list = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx);
    const integrations = await ctx.db
      .query("integrations")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    // Return without exposing tokens
    return integrations.map((i) => ({
      _id: i._id,
      provider: i.provider,
      status: i.status ?? "active",
      externalUserId: i.externalUserId,
      scopes: i.scopes,
      createdAt: i.createdAt,
      updatedAt: i.updatedAt,
      // Token status indicators without exposing actual tokens
      hasAccessToken: !!i.accessToken,
      hasRefreshToken: !!i.refreshToken,
      expiresAt: i.expiresAt,
    }));
  },
});

/**
 * Get a specific integration by provider
 */
export const getByProvider = query({
  args: {
    provider: integrationProvider,
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const integration = await ctx.db
      .query("integrations")
      .withIndex("by_user_provider", (q) => q.eq("userId", user._id).eq("provider", args.provider))
      .first();

    if (!integration) return null;

    return {
      _id: integration._id,
      provider: integration.provider,
      status: integration.status ?? "active",
      externalUserId: integration.externalUserId,
      scopes: integration.scopes,
      createdAt: integration.createdAt,
      updatedAt: integration.updatedAt,
      hasAccessToken: !!integration.accessToken,
      hasRefreshToken: !!integration.refreshToken,
      expiresAt: integration.expiresAt,
    };
  },
});

/**
 * Check if an integration is connected
 */
export const isConnected = query({
  args: {
    provider: integrationProvider,
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const integration = await ctx.db
      .query("integrations")
      .withIndex("by_user_provider", (q) => q.eq("userId", user._id).eq("provider", args.provider))
      .first();

    return {
      connected: !!integration && !!integration.accessToken,
      status: integration?.status ?? null,
      expiresAt: integration?.expiresAt ?? null,
    };
  },
});

/**
 * Store or update integration tokens (called after OAuth callback)
 */
export const upsertTokens = mutation({
  args: {
    provider: integrationProvider,
    accessToken: v.string(),
    refreshToken: v.optional(v.string()),
    expiresAt: v.optional(v.number()),
    scopes: v.optional(v.array(v.string())),
    externalUserId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const now = Date.now();

    const existing = await ctx.db
      .query("integrations")
      .withIndex("by_user_provider", (q) => q.eq("userId", user._id).eq("provider", args.provider))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        accessToken: args.accessToken,
        refreshToken: args.refreshToken ?? existing.refreshToken,
        expiresAt: args.expiresAt,
        scopes: args.scopes ?? existing.scopes,
        externalUserId: args.externalUserId ?? existing.externalUserId,
        status: "active",
        updatedAt: now,
      });
      return existing._id;
    }

    const id = await ctx.db.insert("integrations", {
      userId: user._id,
      provider: args.provider,
      accessToken: args.accessToken,
      refreshToken: args.refreshToken,
      expiresAt: args.expiresAt,
      scopes: args.scopes,
      externalUserId: args.externalUserId,
      status: "active",
      createdAt: now,
      updatedAt: now,
    });

    return id;
  },
});

/**
 * Update integration tokens (for token refresh)
 */
export const updateTokens = mutation({
  args: {
    provider: integrationProvider,
    accessToken: v.string(),
    refreshToken: v.optional(v.string()),
    expiresAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const now = Date.now();

    const existing = await ctx.db
      .query("integrations")
      .withIndex("by_user_provider", (q) => q.eq("userId", user._id).eq("provider", args.provider))
      .first();

    if (!existing) {
      throw new Error(`No ${args.provider} integration found`);
    }

    await ctx.db.patch(existing._id, {
      accessToken: args.accessToken,
      refreshToken: args.refreshToken ?? existing.refreshToken,
      expiresAt: args.expiresAt,
      updatedAt: now,
    });

    return existing._id;
  },
});

/**
 * Mark integration as disconnected/revoked
 */
export const disconnect = mutation({
  args: {
    provider: integrationProvider,
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    const existing = await ctx.db
      .query("integrations")
      .withIndex("by_user_provider", (q) => q.eq("userId", user._id).eq("provider", args.provider))
      .first();

    if (existing) {
      await ctx.db.delete(existing._id);
    }

    return { success: true };
  },
});

/**
 * Get integration tokens (internal use only - for actions)
 * Returns actual tokens for making API calls
 */
export const getTokensInternal = query({
  args: {
    provider: integrationProvider,
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const integration = await ctx.db
      .query("integrations")
      .withIndex("by_user_provider", (q) =>
        q.eq("userId", args.userId).eq("provider", args.provider),
      )
      .first();

    if (!integration) return null;

    return {
      accessToken: integration.accessToken,
      refreshToken: integration.refreshToken,
      expiresAt: integration.expiresAt,
    };
  },
});

/**
 * Log a sync operation
 */
export const logSync = mutation({
  args: {
    provider: v.string(),
    status: v.string(),
    message: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const now = Date.now();

    await ctx.db.insert("syncLogs", {
      userId: user._id,
      provider: args.provider,
      status: args.status,
      message: args.message,
      createdAt: now,
    });
  },
});

/**
 * Get sync history for a provider
 */
export const getSyncHistory = query({
  args: {
    provider: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const limit = args.limit ?? 10;

    const query = ctx.db
      .query("syncLogs")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc");

    const logs = await query.take(limit);

    if (args.provider) {
      return logs.filter((l) => l.provider === args.provider);
    }

    return logs;
  },
});
