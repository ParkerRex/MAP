import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireUser } from "./lib/auth";
import { assertOwner } from "./lib/ownership";

const goalCategory = v.union(
  v.literal("health"),
  v.literal("work"),
  v.literal("personal"),
  v.literal("family"),
  v.literal("spiritual"),
);

const goalStatus = v.union(
  v.literal("pending"),
  v.literal("in_progress"),
  v.literal("completed"),
);

export const list = query({
  args: {
    status: v.optional(goalStatus),
    category: v.optional(goalCategory),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    let goalsQuery = ctx.db
      .query("goals")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .filter((q) => q.eq(q.field("deletedAt"), undefined));

    if (args.status) {
      goalsQuery = goalsQuery.filter((q) =>
        q.eq(q.field("status"), args.status),
      );
    }
    if (args.category) {
      goalsQuery = goalsQuery.filter((q) =>
        q.eq(q.field("category"), args.category),
      );
    }

    const goals = await goalsQuery.collect();
    return goals.sort(
      (a, b) =>
        (b.updatedAt ?? b.createdAt) - (a.updatedAt ?? a.createdAt),
    );
  },
});

export const create = mutation({
  args: {
    title: v.string(),
    category: goalCategory,
    dueAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const now = Date.now();
    const goalId = await ctx.db.insert("goals", {
      userId: user._id,
      title: args.title,
      category: args.category,
      status: "pending",
      dueAt: args.dueAt,
      createdAt: now,
      updatedAt: now,
    });
    return await ctx.db.get(goalId);
  },
});

export const update = mutation({
  args: {
    goalId: v.id("goals"),
    title: v.optional(v.string()),
    category: v.optional(goalCategory),
    status: v.optional(goalStatus),
    dueAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const goal = await ctx.db.get(args.goalId);
    if (!goal) {
      return null;
    }
    assertOwner(String(goal.userId), String(user._id));

    const status = args.status ?? goal.status;
    await ctx.db.patch(args.goalId, {
      title: args.title ?? goal.title,
      category: args.category ?? goal.category,
      status,
      dueAt: args.dueAt ?? goal.dueAt,
      completedAt:
        status === "completed" ? Date.now() : goal.completedAt ?? undefined,
      updatedAt: Date.now(),
    });
    return await ctx.db.get(args.goalId);
  },
});

export const toggle = mutation({
  args: {
    goalId: v.id("goals"),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const goal = await ctx.db.get(args.goalId);
    if (!goal) {
      return null;
    }
    assertOwner(String(goal.userId), String(user._id));

    const status = goal.status === "completed" ? "in_progress" : "completed";
    await ctx.db.patch(args.goalId, {
      status,
      completedAt: status === "completed" ? Date.now() : undefined,
      updatedAt: Date.now(),
    });
    return await ctx.db.get(args.goalId);
  },
});

export const remove = mutation({
  args: {
    goalId: v.id("goals"),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const goal = await ctx.db.get(args.goalId);
    if (!goal) {
      return null;
    }
    assertOwner(String(goal.userId), String(user._id));

    await ctx.db.patch(args.goalId, {
      deletedAt: Date.now(),
      updatedAt: Date.now(),
    });
    return await ctx.db.get(args.goalId);
  },
});
