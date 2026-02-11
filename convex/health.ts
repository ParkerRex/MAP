import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireUser } from "./lib/auth";
import { assertOwner } from "./lib/ownership";

const DEFAULT_LIMIT = 14;

export const listRecent = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const limit = args.limit ?? DEFAULT_LIMIT;
    const data = await ctx.db
      .query("appleHealthData")
      .withIndex("by_user_date", (q) => q.eq("userId", user._id))
      .order("desc")
      .take(limit);
    return data.sort((a, b) => a.date.localeCompare(b.date));
  },
});

export const summary = query({
  args: {
    days: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const limit = args.days ?? 7;
    const data = await ctx.db
      .query("appleHealthData")
      .withIndex("by_user_date", (q) => q.eq("userId", user._id))
      .order("desc")
      .take(limit);

    const totals = data.reduce(
      (acc, entry) => {
        acc.steps += entry.steps ?? 0;
        acc.activeEnergy += entry.activeEnergy ?? 0;
        acc.exerciseMinutes += entry.exerciseMinutes ?? 0;
        acc.sleepHours += entry.sleepHours ?? 0;
        acc.restingHeartRate += entry.restingHeartRate ?? 0;
        acc.hrvSDNN += entry.hrvSDNN ?? 0;
        acc.count += 1;
        return acc;
      },
      {
        steps: 0,
        activeEnergy: 0,
        exerciseMinutes: 0,
        sleepHours: 0,
        restingHeartRate: 0,
        hrvSDNN: 0,
        count: 0,
      },
    );

    const average = totals.count
      ? {
          steps: Math.round(totals.steps / totals.count),
          activeEnergy: Math.round(totals.activeEnergy / totals.count),
          exerciseMinutes: Math.round(totals.exerciseMinutes / totals.count),
          sleepHours: Number((totals.sleepHours / totals.count).toFixed(1)),
          restingHeartRate: Math.round(totals.restingHeartRate / totals.count),
          hrvSDNN: Math.round(totals.hrvSDNN / totals.count),
        }
      : null;

    const latest = data[0] ?? null;
    return {
      latest,
      average,
      days: data.sort((a, b) => a.date.localeCompare(b.date)),
    };
  },
});

export const upsert = mutation({
  args: {
    date: v.string(),
    steps: v.optional(v.number()),
    activeEnergy: v.optional(v.number()),
    exerciseMinutes: v.optional(v.number()),
    sleepHours: v.optional(v.number()),
    restingHeartRate: v.optional(v.number()),
    hrvSDNN: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const existing = await ctx.db
      .query("appleHealthData")
      .withIndex("by_user_date", (q) => q.eq("userId", user._id).eq("date", args.date))
      .unique();

    const patch = {
      steps: args.steps,
      activeEnergy: args.activeEnergy,
      exerciseMinutes: args.exerciseMinutes,
      sleepHours: args.sleepHours,
      restingHeartRate: args.restingHeartRate,
      hrvSDNN: args.hrvSDNN,
      updatedAt: Date.now(),
    };

    if (existing) {
      assertOwner(String(existing.userId), String(user._id));
      await ctx.db.patch(existing._id, patch);
      return await ctx.db.get(existing._id);
    }

    const insertId = await ctx.db.insert("appleHealthData", {
      userId: user._id,
      date: args.date,
      ...patch,
      createdAt: Date.now(),
    });
    return await ctx.db.get(insertId);
  },
});

export const remove = mutation({
  args: {
    entryId: v.id("appleHealthData"),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const entry = await ctx.db.get(args.entryId);
    if (!entry) {
      return null;
    }
    assertOwner(String(entry.userId), String(user._id));

    await ctx.db.delete(args.entryId);
    return null;
  },
});
