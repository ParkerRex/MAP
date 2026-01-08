import { ConvexError, v } from "convex/values";
import { action, httpAction, internalMutation, mutation, query } from "./_generated/server";
import { api, components, internal } from "./_generated/api";
import { Agent, getFile, listUIMessages, storeFile } from "@convex-dev/agent";
import { PersistentTextStreaming, StreamIdValidator, type StreamId } from "@convex-dev/persistent-text-streaming";
import { RateLimiter, MINUTE } from "@convex-dev/rate-limiter";
import { openai } from "@ai-sdk/openai";
import type { ModelMessage } from "ai";
import { requireUser } from "./lib/auth";

const agent = new Agent(components.agent, {
  name: "Map Copilot",
  languageModel: openai.chat("gpt-4o-mini"),
  textEmbeddingModel: openai.embedding("text-embedding-3-small"),
  instructions:
    "You are MAP's assistant. Be concise, tactical, and action-oriented. Always propose next steps.",
});

const streaming = new PersistentTextStreaming(components.persistentTextStreaming);

const rateLimiter = new RateLimiter(components.rateLimiter, {
  createThread: { kind: "fixed window", rate: 30, period: MINUTE },
  sendMessage: { kind: "token bucket", rate: 12, period: MINUTE, capacity: 4 },
});

const contextOptions = {
  recentMessages: 8,
  searchOtherThreads: true,
  searchOptions: {
    limit: 8,
    textSearch: true,
    vectorSearch: true,
  },
};

type RunQueryCtx = {
  runQuery: (...args: any[]) => Promise<any>;
};

async function assertThreadAccess(ctx: RunQueryCtx, threadId: string, userId: string) {
  const thread = await ctx.runQuery(components.agent.threads.getThread, { threadId });
  if (!thread || thread.userId !== userId) {
    throw new ConvexError("Forbidden");
  }
  return thread;
}

export const listThreads = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const result = await ctx.runQuery(components.agent.threads.listThreadsByUserId, {
      userId: String(user._id),
      order: "desc",
      paginationOpts: { cursor: null, numItems: args.limit ?? 50 },
    });
    return result.page;
  },
});

export const getThread = query({
  args: {
    threadId: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    return await assertThreadAccess(ctx, args.threadId, String(user._id));
  },
});

export const listMessages = query({
  args: {
    threadId: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    await assertThreadAccess(ctx, args.threadId, String(user._id));
    const result = await listUIMessages(ctx, components.agent, {
      threadId: args.threadId,
      paginationOpts: { cursor: null, numItems: args.limit ?? 50 },
    });
    return result.page;
  },
});

export const createThread = mutation({
  args: {
    title: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    await rateLimiter.limit(ctx, "createThread", { key: String(user._id), throws: true });
    const { threadId } = await agent.createThread(ctx, {
      userId: String(user._id),
      title: args.title ?? undefined,
    });
    return threadId;
  },
});

export const createRun = mutation({
  args: {
    threadId: v.optional(v.string()),
    prompt: v.string(),
    fileIds: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const prompt = args.prompt.trim();
    if (!prompt) {
      throw new ConvexError("Prompt required");
    }
    await rateLimiter.limit(ctx, "sendMessage", { key: String(user._id), throws: true });

    let threadId = args.threadId;
    if (threadId) {
      await assertThreadAccess(ctx, threadId, String(user._id));
    } else {
      const created = await agent.createThread(ctx, { userId: String(user._id) });
      threadId = created.threadId;
    }

    const streamId = await streaming.createStream(ctx);
    const runId = await ctx.db.insert("chatRuns", {
      userId: user._id,
      threadId,
      streamId,
      prompt,
      fileIds: args.fileIds ?? [],
      status: "pending",
      createdAt: Date.now(),
    });

    return { runId, threadId, streamId };
  },
});

export const getRun = query({
  args: {
    runId: v.id("chatRuns"),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const run = await ctx.db.get(args.runId);
    if (!run || String(run.userId) !== String(user._id)) {
      return null;
    }
    return run;
  },
});

export const getRunByStreamId = query({
  args: {
    streamId: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const run = await ctx.db
      .query("chatRuns")
      .withIndex("by_stream", (q) => q.eq("streamId", args.streamId))
      .unique();
    if (!run || String(run.userId) !== String(user._id)) {
      return null;
    }
    return run;
  },
});

export const getStreamBody = query({
  args: {
    streamId: StreamIdValidator,
  },
  handler: async (ctx, args) => {
    return await streaming.getStreamBody(ctx, args.streamId as StreamId);
  },
});

export const uploadFile = action({
  args: {
    filename: v.string(),
    contentType: v.optional(v.string()),
    bytes: v.bytes(),
    sha256: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await ctx.runQuery(api.users.getCurrent);
    if (!user) {
      throw new ConvexError("Unauthorized");
    }

    if (args.bytes.byteLength > 8 * 1024 * 1024) {
      throw new ConvexError("File too large (8MB max)");
    }

    const blob = new Blob([args.bytes], {
      type: args.contentType ?? "application/octet-stream",
    });
    const { file } = await storeFile(ctx, components.agent, blob, {
      filename: args.filename,
      sha256: args.sha256,
    });

    return {
      fileId: file.fileId,
      url: file.url,
      filename: file.filename ?? args.filename,
      contentType: args.contentType ?? "application/octet-stream",
    };
  },
});

export const updateRunStatus = internalMutation({
  args: {
    runId: v.id("chatRuns"),
    status: v.union(
      v.literal("pending"),
      v.literal("streaming"),
      v.literal("done"),
      v.literal("error"),
    ),
    error: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.runId, {
      status: args.status,
      error: args.error,
      updatedAt: Date.now(),
    });
  },
});

export const streamChat = httpAction(async (ctx, request) => {
  const body = (await request.json()) as { streamId?: string };
  if (!body?.streamId) {
    return new Response("Missing streamId", { status: 400 });
  }

  const run = await ctx.runQuery(api.chat.getRunByStreamId, {
    streamId: body.streamId,
  });
  if (!run) {
    return new Response("Run not found", { status: 404 });
  }

  const response = await streaming.stream(
    ctx,
    request,
    body.streamId as StreamId,
    async (actionCtx, _request, _streamId, append) => {
      await actionCtx.runMutation(internal.chat.updateRunStatus, {
        runId: run._id,
        status: "streaming",
      });

      const { thread } = await agent.continueThread(actionCtx, {
        threadId: run.threadId,
        userId: String(run.userId),
      });

      const parts: any[] = [{ type: "text", text: run.prompt }];
      if (run.fileIds?.length) {
        for (const fileId of run.fileIds) {
          const { filePart, imagePart } = await getFile(actionCtx, components.agent, fileId);
          parts.push(imagePart ?? filePart);
        }
      }

      try {
        const message: ModelMessage = {
          role: "user",
          content: parts,
        };
        const result = await thread.streamText(
          {
            prompt: [message],
          },
          {
            contextOptions,
            saveStreamDeltas: false,
          },
        );

        for await (const delta of result.textStream) {
          await append(delta);
        }

        await actionCtx.runMutation(internal.chat.updateRunStatus, {
          runId: run._id,
          status: "done",
        });
      } catch (error) {
        await actionCtx.runMutation(internal.chat.updateRunStatus, {
          runId: run._id,
          status: "error",
          error: error instanceof Error ? error.message : String(error),
        });
        throw error;
      }
    },
  );

  response.headers.set("Access-Control-Allow-Origin", "*");
  response.headers.set("Vary", "Origin");
  return response;
});
