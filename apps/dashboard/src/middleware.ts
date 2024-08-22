// TODO: Remove this error
import { updateSession } from "@map/supabase/middleware";
import { createClient } from "@map/supabase/server";
import { type NextRequest, NextResponse } from "next/server";

export async function middleware(request: NextRequest) {
  const response = await updateSession(request);
  const supabase = createClient();
  const url = new URL("/", request.url);
  const nextUrl = request.nextUrl;

  // Get the current session
  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Redirect to login if not authenticated and not on login or setup pages
  if (
    !session &&
    nextUrl.pathname !== "/login" &&
    !nextUrl.pathname.includes("/setup")
  ) {
    const encodedSearchParams = `${nextUrl.pathname.substring(1)}${
      nextUrl.search
    }`;

    const url = new URL("/login", request.url);

    if (encodedSearchParams) {
      url.searchParams.append("return_to", encodedSearchParams);
    }

    return NextResponse.redirect(url);
  }

  // Redirect to setup if authenticated but no full_name in user metadata
  if (
    nextUrl.pathname !== "/setup" &&
    session &&
    !session?.user?.user_metadata?.full_name
  ) {
    return NextResponse.redirect(`${url.origin}/setup`);
  }

  return response;
}

// Configure middleware to run on all routes except Next.js static files
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api).*)"],
};
