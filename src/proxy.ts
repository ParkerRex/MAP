import { type NextRequest, NextResponse } from "next/server";

const PUBLIC_PATHS = ["/", "/login", "/signup", "/auth/error"];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public paths
  if (PUBLIC_PATHS.some((path) => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  // Check for session cookie or Authorization header
  const sessionCookie = request.cookies.get("session");
  const authHeader = request.headers.get("authorization");
  const hasSession = sessionCookie?.value || authHeader?.startsWith("Bearer ");

  if (!hasSession) {
    // Redirect to login if no session
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/|favicon.ico|api|robots.txt|ads.txt|apple-touch-icon).*)",
  ],
};
