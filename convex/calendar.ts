import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireUser } from "./lib/auth";
import { assertOwner } from "./lib/ownership";

const LOCAL_PROVIDER = "local";

async function getOrCreateLocalCalendar(ctx: any, user: any) {
  const now = Date.now();
  const account =
    (await ctx.db
      .query("calendarAccounts")
      .withIndex("by_user", (q: any) => q.eq("userId", user._id))
      .filter((q: any) => q.eq(q.field("provider"), LOCAL_PROVIDER))
      .first()) ??
    (await (async () => {
      const accountId = await ctx.db.insert("calendarAccounts", {
        userId: user._id,
        provider: LOCAL_PROVIDER,
        email: user.email ?? "local",
        createdAt: now,
        updatedAt: now,
      });
      return await ctx.db.get(accountId);
    })());

  const calendar =
    (await ctx.db
      .query("calendars")
      .withIndex("by_account", (q: any) => q.eq("accountId", account._id))
      .first()) ??
    (await (async () => {
      const calendarId = await ctx.db.insert("calendars", {
        userId: user._id,
        accountId: account._id,
        provider: LOCAL_PROVIDER,
        externalId: `local-${user._id}`,
        summary: "Personal",
        createdAt: now,
        updatedAt: now,
      });
      return await ctx.db.get(calendarId);
    })());

  return { account, calendar };
}

export const listEvents = query({
  args: {
    from: v.string(),
    to: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const events = await ctx.db
      .query("calendarEvents")
      .withIndex("by_user_start", (q) =>
        q.eq("userId", user._id).gte("startTime", args.from).lt("startTime", args.to),
      )
      .filter((q) => q.eq(q.field("deletedAt"), undefined))
      .collect();

    return events.sort((a, b) => a.startTime.localeCompare(b.startTime));
  },
});

export const getSyncStatus = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx);
    const accounts = await ctx.db
      .query("calendarAccounts")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();
    const lastSync = await ctx.db
      .query("syncLogs")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .first();

    return {
      accounts,
      lastSyncAt: lastSync?._creationTime ?? null,
      lastStatus: lastSync?.status ?? "idle",
    };
  },
});

export const createEvent = mutation({
  args: {
    summary: v.string(),
    description: v.optional(v.string()),
    startTime: v.string(),
    endTime: v.string(),
    isAllDay: v.optional(v.boolean()),
    calendarId: v.optional(v.id("calendars")),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const now = Date.now();
    let calendarId = args.calendarId;
    if (!calendarId) {
      const { calendar } = await getOrCreateLocalCalendar(ctx, user);
      calendarId = calendar._id;
    }

    const eventId = await ctx.db.insert("calendarEvents", {
      userId: user._id,
      calendarId,
      externalId: `local-${crypto.randomUUID()}`,
      summary: args.summary,
      description: args.description,
      startTime: args.startTime,
      endTime: args.endTime,
      isAllDay: args.isAllDay,
      createdAt: now,
      updatedAt: now,
    });
    return await ctx.db.get(eventId);
  },
});

export const updateEvent = mutation({
  args: {
    eventId: v.id("calendarEvents"),
    summary: v.optional(v.string()),
    description: v.optional(v.string()),
    startTime: v.optional(v.string()),
    endTime: v.optional(v.string()),
    isAllDay: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const event = await ctx.db.get(args.eventId);
    if (!event) {
      return null;
    }
    assertOwner(String(event.userId), String(user._id));

    await ctx.db.patch(args.eventId, {
      summary: args.summary ?? event.summary,
      description: args.description ?? event.description,
      startTime: args.startTime ?? event.startTime,
      endTime: args.endTime ?? event.endTime,
      isAllDay: args.isAllDay ?? event.isAllDay,
      updatedAt: Date.now(),
    });
    return await ctx.db.get(args.eventId);
  },
});

export const removeEvent = mutation({
  args: {
    eventId: v.id("calendarEvents"),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const event = await ctx.db.get(args.eventId);
    if (!event) {
      return null;
    }
    assertOwner(String(event.userId), String(user._id));

    await ctx.db.patch(args.eventId, {
      deletedAt: Date.now(),
      updatedAt: Date.now(),
    });
    return await ctx.db.get(args.eventId);
  },
});
