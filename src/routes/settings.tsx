import { createFileRoute } from "@tanstack/react-router";
import { authClient } from "../lib/auth-client";
import { PageHeader, Panel, Pill } from "../components/start/page";

export const Route = createFileRoute("/settings")({
  component: Settings,
});

function Settings() {
  const { data: session, isPending } = authClient.useSession();
  const user = session?.user;
  const isAuthed = Boolean(session?.session);

  const handleSignIn = async () => {
    const result = await authClient.signIn.social({
      provider: "google",
      callbackURL: window.location.href,
    });
    if (result?.data?.redirect && result.data.url) {
      window.location.href = result.data.url;
    }
  };

  const handleSignOut = async () => {
    await authClient.signOut();
  };

  return (
    <div className="space-y-10">
      <PageHeader
        eyebrow="Identity + sync"
        title="Account settings"
        subtitle="Manage Google access and deployment connections."
        actions={
          <button type="button" className="rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white">
            Invite teammate
          </button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <Panel title="Google account" subtitle="OAuth connection state">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-slate-900">
                {isPending ? "Checking session…" : isAuthed ? user?.email || "Connected" : "Not connected"}
              </p>
              <p className="text-xs text-slate-500">
                {isAuthed ? "Access granted for calendar + tasks." : "Sign in to enable sync features."}
              </p>
            </div>
            <Pill tone={isAuthed ? "emerald" : "amber"}>{isAuthed ? "Connected" : "Pending"}</Pill>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {isAuthed ? (
              <button
                type="button"
                onClick={() => void handleSignOut()}
                className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600"
              >
                Sign out
              </button>
            ) : (
              <button
                type="button"
                onClick={() => void handleSignIn()}
                className="rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white"
              >
                Connect Google
              </button>
            )}
            <button
              type="button"
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600"
            >
              Manage scopes
            </button>
          </div>
        </Panel>

        <Panel title="Deployments" subtitle="Convex environments" className="animate-rise-delay-1">
          <div className="space-y-3">
            {[
              { label: "Development", value: "Connected" },
              { label: "Staging", value: "Pending" },
              { label: "Production", value: "Locked" },
            ].map((env) => (
              <div key={env.label} className="flex items-center justify-between rounded-2xl border border-slate-100 bg-white px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-slate-900">{env.label}</p>
                  <p className="text-xs text-slate-500">Convex deployment</p>
                </div>
                <Pill tone={env.value === "Connected" ? "emerald" : env.value === "Pending" ? "amber" : "slate"}>
                  {env.value}
                </Pill>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <Panel title="Security" subtitle="Session hygiene" className="animate-rise-delay-2">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-slate-100 bg-white px-4 py-4">
            <p className="text-sm font-semibold text-slate-900">Web OAuth</p>
            <p className="text-xs text-slate-500">Enabled for iOS and web clients.</p>
          </div>
          <div className="rounded-2xl border border-slate-100 bg-white px-4 py-4">
            <p className="text-sm font-semibold text-slate-900">Session rotation</p>
            <p className="text-xs text-slate-500">15 minute token with refresh.</p>
          </div>
        </div>
      </Panel>
    </div>
  );
}
