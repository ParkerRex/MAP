import { type NextRequest, NextResponse } from "next/server";

export async function middleware(request: NextRequest) {
	// In local dev mode, skip all auth checks
	// Just pass through all requests
	return NextResponse.next();
}

// Configure middleware to run on all routes except Next.js static files
export const config = {
	matcher: ["/((?!_next/static|_next/image|favicon.ico|api).*)"],
};
