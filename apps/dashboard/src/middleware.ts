// Import necessary dependencies
import { updateSession } from "@map/supabase/middleware";
import { createClient } from "@map/supabase/server";
import { createI18nMiddleware } from "next-international/middleware";
import { type NextRequest, NextResponse } from "next/server";

// Create internationalization middleware
const I18nMiddleware = createI18nMiddleware({
  locales: ["en"],
  defaultLocale: "en",
  urlMappingStrategy: "rewrite",
});

export async function middleware(request: NextRequest) {
  // Update session and apply i18n middleware
  const response = await updateSession(request, I18nMiddleware(request));
  const supabase = createClient();
  const url = new URL("/", request.url);
  const nextUrl = request.nextUrl;

  // Extract locale from pathname
  const pathnameLocale = nextUrl.pathname.split("/", 2)?.[1];

  // Remove the locale from the pathname
  const pathnameWithoutLocale = nextUrl.pathname.slice(
    pathnameLocale.length + 1,
  );

  // Create a new URL without the locale in the pathname
  const newUrl = new URL(pathnameWithoutLocale || "/", request.url);

  // Get the current session
  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Redirect to login if not authenticated and not on login or setup pages
  if (
    !session &&
    newUrl.pathname !== "/login" &&
    !newUrl.pathname.includes("/setup")
  ) {
    const encodedSearchParams = `${newUrl.pathname.substring(1)}${
      newUrl.search
    }`;

    const url = new URL("/login", request.url);

    if (encodedSearchParams) {
      url.searchParams.append("return_to", encodedSearchParams);
    }

    return NextResponse.redirect(url);
  }

  // Redirect to setup if authenticated but no full_name in user metadata
  if (
    newUrl.pathname !== "/setup" &&
    session &&
    !session?.user?.user_metadata?.full_name
  ) {
    return NextResponse.redirect(`${url.origin}/setup`);
  }

  // Check MFA status
  const { data: mfaData } =
    await supabase.auth.mfa.getAuthenticatorAssuranceLevel();

  // Redirect to MFA verification if enrolled but not verified
  if (
    mfaData &&
    mfaData.nextLevel === "aal2" &&
    mfaData.nextLevel !== mfaData.currentLevel &&
    newUrl.pathname !== "/mfa/verify"
  ) {
    return NextResponse.redirect(`${url.origin}/mfa/verify`);
  }

  return response;
}

// Configure middleware to run on all routes except Next.js static files
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api).*)"],
};
