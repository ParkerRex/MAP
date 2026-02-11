import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PageHeader, Panel, Pill } from "../../components/start/page";
import { apiRequest } from "../../lib/client-api";

export const Route = createFileRoute("/auth/ios")({
  component: IosAuth,
});

type MeResponse = {
  user: {
    id: string;
    email: string;
  };
};

function IosAuth() {
  const [status, setStatus] = useState<"idle" | "redirecting" | "error">("idle");

  const meQuery = useQuery({
    queryKey: ["auth", "me"],
    queryFn: () => apiRequest<MeResponse>("/api/auth/me"),
    retry: false,
  });

  const tokenMutation = useMutation({
    mutationFn: () => apiRequest<{ token: string }>("/api/auth/token"),
  });

  const redirectTarget = useMemo(() => {
    if (typeof window === "undefined") return "maphealth://auth/callback";
    const current = new URL(window.location.href);
    return current.searchParams.get("redirect") ?? "maphealth://auth/callback";
  }, []);

  const handleStartOAuth = () => {
    setStatus("redirecting");
    window.location.href = "/api/auth/google?platform=ios";
  };

  const handleContinueWithExistingSession = async () => {
    setStatus("redirecting");
    try {
      const { token } = await tokenMutation.mutateAsync();
      const targetUrl = new URL(redirectTarget);
      targetUrl.searchParams.set("token", token);
      window.location.href = targetUrl.toString();
    } catch {
      setStatus("error");
    }
  };

  const signedIn = Boolean(meQuery.data?.user);

  return (
    <div className="space-y-10">
      <PageHeader
        eyebrow="iOS OAuth"
        title="Connect MAP to iOS"
        subtitle="Sign in with Google and hand off a session token to the native app."
      />

      <Panel title="Sign in" subtitle="Web OAuth handshake">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Pill tone={signedIn ? "emerald" : "amber"}>
              {meQuery.isLoading ? "Checking" : signedIn ? "Signed in" : "Not signed in"}
            </Pill>
            {status === "redirecting" ? <Pill tone="emerald">Redirecting</Pill> : null}
            {status === "error" ? <Pill tone="rose">Error</Pill> : null}
          </div>
          <p className="text-sm text-slate-600">
            {signedIn
              ? "You are signed in. Continue to pass your current session to iOS."
              : "Start Google OAuth in iOS mode to receive a callback token."}
          </p>
          <div className="flex flex-wrap gap-2">
            {signedIn ? (
              <button
                type="button"
                onClick={() => void handleContinueWithExistingSession()}
                className="rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white"
              >
                Continue to iOS
              </button>
            ) : (
              <button
                type="button"
                onClick={handleStartOAuth}
                className="rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white"
              >
                Continue with Google
              </button>
            )}
            <button
              type="button"
              onClick={handleStartOAuth}
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600"
            >
              Re-authenticate iOS
            </button>
          </div>
        </div>
      </Panel>
    </div>
  );
}
