// Middleware for dev mode - just pass through
import type { NextRequest, NextResponse } from "next/server";

export async function updateSession(request: NextRequest, response?: NextResponse) {
	// In dev mode, no session management needed
	// Just return the response as-is
	return response;
}
