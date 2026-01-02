import { NextResponse } from "next/server";
import { z } from "zod";
import { calendarDb } from "@/db/calendar";
import { badRequest, handleApiError, unauthorized } from "@/lib/api/errors";
import { getUser } from "@/lib/auth";

const bodySchema = z.object({
  apiKey: z.string().min(10),
});

export async function POST(request: Request) {
  try {
    const user = await getUser();
    if (!user) {
      throw unauthorized();
    }

    const body = await request.json();
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
      throw badRequest("Invalid API key", parsed.error.issues);
    }

    const apiKey = parsed.data.apiKey.trim();

    await calendarDb.upsertIntegration({
      userId: user.id,
      provider: "CLAUDE",
      accessToken: apiKey,
      refreshToken: undefined,
      expiresAt: undefined,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
