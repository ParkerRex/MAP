import { type NextRequest, NextResponse } from "next/server";

// Routes that don't require authentication
const publicRoutes = [
  "/",
  "/login",
  "/signup",
  "/auth/error",
  "/api/auth/google",
  "/api/auth/google/callback",
];

// Routes that should never redirect (API routes, static files, etc.)
const ignoredPaths = [
  "/api/", // All API routes handle their own auth
  "/_next/",
  "/favicon.ico",
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for ignored paths
  if (ignoredPaths.some((path) => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  // Allow public routes
  if (publicRoutes.includes(pathname)) {
    return NextResponse.next();
  }

  // Check for session cookie or Authorization header
  const sessionCookie = request.cookies.get("session");
  const authHeader = request.headers.get("authorization");
  const hasSession = sessionCookie?.value || authHeader?.startsWith("Bearer ");

  // Redirect to login if not authenticated
  if (!hasSession) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
