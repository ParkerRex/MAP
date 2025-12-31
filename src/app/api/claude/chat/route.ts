import { type NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { handleApiError, unauthorized, badRequest } from "@/lib/api/errors";
import { getClaudeClientForUser, type ClaudeMessage } from "@/lib/claude";
import { z } from "zod";

const chatRequestSchema = z.object({
  messages: z.array(
    z.object({
      role: z.enum(["user", "assistant"]),
      content: z.string(),
    }),
  ),
  model: z.string().optional(),
  system: z.string().optional(),
  max_tokens: z.number().optional(),
  stream: z.boolean().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      throw unauthorized();
    }

    // Parse and validate request body
    const body = await request.json();
    const parseResult = chatRequestSchema.safeParse(body);

    if (!parseResult.success) {
      throw badRequest("Invalid request body", parseResult.error.issues);
    }

    const { messages, model, system, max_tokens, stream } = parseResult.data;

    // Get Claude client with auto token refresh
    let client;
    try {
      client = await getClaudeClientForUser(user.id);
    } catch {
      return NextResponse.json(
        { error: "Claude not connected. Please connect your Claude account." },
        { status: 400 },
      );
    }

    // Handle streaming response
    if (stream) {
      const encoder = new TextEncoder();

      const readable = new ReadableStream({
        async start(controller) {
          try {
            for await (const event of client.streamMessage({
              model,
              messages: messages as ClaudeMessage[],
              system,
              max_tokens,
            })) {
              const data = `data: ${JSON.stringify(event)}\n\n`;
              controller.enqueue(encoder.encode(data));
            }
            controller.enqueue(encoder.encode("data: [DONE]\n\n"));
            controller.close();
          } catch (error) {
            const errorMessage =
              error instanceof Error ? error.message : "Stream error";
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({ type: "error", error: { message: errorMessage } })}\n\n`,
              ),
            );
            controller.close();
          }
        },
      });

      return new Response(readable, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        },
      });
    }

    // Non-streaming response
    const response = await client.createMessage({
      model,
      messages: messages as ClaudeMessage[],
      system,
      max_tokens,
    });

    return NextResponse.json(response);
  } catch (error) {
    return handleApiError(error);
  }
}
