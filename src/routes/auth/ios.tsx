import { createFileRoute } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useState } from "react";
import { authClient } from "../../lib/auth-client";
import { getToken } from "../../lib/auth-server";
import { PageHeader, Panel, Pill } from "../../components/start/page";

const getAuthToken = createServerFn({ method: "GET" }).handler(async () => {
  return await getToken();
});

export const Route = createFileRoute("/auth/ios")({
  component: IosAuth,
});

function IosAuth() {
  const { data: session, isPending } = authClient.useSession();
  const [status, setStatus] = useState<"idle" | "redirecting" | "error">("idle");

  const redirectTarget = useMemo(() => {
    if (typeof window === "undefined") return "maphealth://auth/callback";
    const current = new URL(window.location.href);
    return current.searchParams.get("redirect") ?? "maphealth://auth/callback";
  }, []);

  useEffect(() => {
    if (isPending || !session?.session) return;
    let cancelled = false;
    setStatus("redirecting");

    void getAuthToken()
      .then((token) => {
        if (cancelled) return;
        if (!token) {
          setStatus("error");
          return;
        }
        const targetUrl = new URL(redirectTarget);
        targetUrl.searchParams.set("token", token);
        window.location.href = targetUrl.toString();
      })
      .catch(() => {
        if (!cancelled) setStatus("error");
      });

    return () => {
      cancelled = true;
    };
  }, [isPending, redirectTarget, session?.session]);

  const handleSignIn = async () => {
    const result = await authClient.signIn.social({
      provider: "google",
      callbackURL: window.location.href,
    });
    if (result?.data?.redirect && result.data.url) {
      window.location.href = result.data.url;
    }
  };

  return (
    <div className="space-y-10">
      <PageHeader
        eyebrow="iOS OAuth"
        title="Connect MAP to iOS"
        subtitle="Sign in with Google and hand off a Convex token to the native app."
      />

      <Panel title="Sign in" subtitle="Web OAuth handshake">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Pill tone={session?.session ? "emerald" : "amber"}>
              {isPending ? "Checking" : session?.session ? "Signed in" : "Not signed in"}
            </Pill>
            {status === "redirecting" ? <Pill tone="emerald">Redirecting</Pill> : null}
            {status === "error" ? <Pill tone="rose">Error</Pill> : null}
          </div>
          <p className="text-sm text-slate-600">
            {session?.session
              ? "If you are not redirected automatically, tap continue to retry the handoff."
              : "Sign in to start the OAuth session for iOS."}
          </p>
          <div className="flex flex-wrap gap-2">
            {!session?.session ? (
              <button
                type="button"
                onClick={() => void handleSignIn()}
                className="rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white"
              >
                Continue with Google
              </button>
            ) : (
              <button
                type="button"
                onClick={() => void handleSignIn()}
                className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600"
              >
                Re-authenticate
              </button>
            )}
          </div>
        </div>
      </Panel>
    </div>
  );
}
