import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireUser } from "./lib/auth";
import { assertOwner } from "./lib/ownership";

const DEFAULT_LIMIT = 50;

export const list = query({
  args: {
    query: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const limit = args.limit ?? DEFAULT_LIMIT;
    const searchTerm = args.query?.trim();

    if (!searchTerm) {
      const notes = await ctx.db
        .query("notes")
        .withIndex("by_user", (q) => q.eq("userId", user._id))
        .filter((q) => q.eq(q.field("deletedAt"), undefined))
        .collect();
      return notes
        .sort((a, b) => (b.updatedAt ?? b.createdAt) - (a.updatedAt ?? a.createdAt))
        .slice(0, limit);
    }

    const results = new Map<string, any>();
    const titleMatches = await ctx.db
      .query("notes")
      .withSearchIndex("search_title", (q) => q.search("title", searchTerm).eq("userId", user._id))
      .take(limit);
    for (const note of titleMatches) {
      if (!note.deletedAt) {
        results.set(note._id, note);
      }
    }

    const contentMatches = await ctx.db
      .query("notes")
      .withSearchIndex("search_content", (q) =>
        q.search("content", searchTerm).eq("userId", user._id),
      )
      .take(limit);
    for (const note of contentMatches) {
      if (!note.deletedAt) {
        results.set(note._id, note);
      }
    }

    return Array.from(results.values())
      .sort((a, b) => (b.updatedAt ?? b.createdAt) - (a.updatedAt ?? a.createdAt))
      .slice(0, limit);
  },
});

export const create = mutation({
  args: {
    title: v.string(),
    content: v.string(),
    folderId: v.optional(v.id("folders")),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const now = Date.now();
    const noteId = await ctx.db.insert("notes", {
      userId: user._id,
      folderId: args.folderId,
      title: args.title,
      content: args.content,
      createdAt: now,
      updatedAt: now,
    });
    return await ctx.db.get(noteId);
  },
});

export const update = mutation({
  args: {
    noteId: v.id("notes"),
    title: v.optional(v.string()),
    content: v.optional(v.string()),
    folderId: v.optional(v.id("folders")),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const note = await ctx.db.get(args.noteId);
    if (!note) {
      return null;
    }
    assertOwner(String(note.userId), String(user._id));

    await ctx.db.patch(args.noteId, {
      title: args.title ?? note.title,
      content: args.content ?? note.content,
      folderId: args.folderId ?? note.folderId,
      updatedAt: Date.now(),
    });
    return await ctx.db.get(args.noteId);
  },
});

export const remove = mutation({
  args: {
    noteId: v.id("notes"),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const note = await ctx.db.get(args.noteId);
    if (!note) {
      return null;
    }
    assertOwner(String(note.userId), String(user._id));

    await ctx.db.patch(args.noteId, {
      deletedAt: Date.now(),
      updatedAt: Date.now(),
    });
    return await ctx.db.get(args.noteId);
  },
});
