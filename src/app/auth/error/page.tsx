"use client";

import { AlertCircle } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/ui/icons";

function ErrorContent() {
  const searchParams = useSearchParams();
  const errorCode = searchParams.get("error");

  const getErrorMessage = (code: string | null) => {
    switch (code) {
      case "oauth_denied":
        return "Access was denied. Please try again.";
      case "invalid_state":
        return "Session expired. Please try signing in again.";
      case "missing_code":
        return "Authentication was interrupted. Please try again.";
      case "callback_failed":
        return "Something went wrong during sign in. Please try again.";
      default:
        return "Unable to sign in. Please try again.";
    }
  };

  return (
    <div className="flex flex-col items-center text-center">
      <div className="flex items-center justify-center w-16 h-16 rounded-full bg-red-100 dark:bg-red-950/50 mb-6">
        <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
      </div>

      <h1 className="text-2xl font-medium mb-2">Sign in failed</h1>
      <p className="text-[#878787] mb-8">{getErrorMessage(errorCode)}</p>

      <Button asChild className="w-full max-w-[280px]">
        <Link href="/login">Try again</Link>
      </Button>
    </div>
  );
}

export default function AuthErrorPage() {
  return (
    <div>
      <header className="w-full fixed left-0 right-0">
        <div className="ml-5 mt-4 md:ml-10 md:mt-10">
          <Link href="https://mapthemap.com">
            <Icons.Logo />
          </Link>
        </div>
      </header>

      <div className="flex min-h-screen justify-center items-center overflow-hidden p-6 md:p-0">
        <div className="relative z-20 m-auto flex w-full max-w-[380px] flex-col py-8">
          <Suspense fallback={<div>Loading...</div>}>
            <ErrorContent />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
