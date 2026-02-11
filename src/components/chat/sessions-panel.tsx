import { useEffect, useState } from "react";
import { Panel } from "../start/page";
import { ActionStatusMessage } from "./action-status";
import { getErrorMessage } from "./error-utils";
import type { ActionStatus, AuthProfile, Session } from "./types";

type SessionsPanelProps = {
  sessions: Session[];
  activeSessionId: string | null;
  onSelectSession: (sessionId: string) => void;
  sessionsLoading: boolean;
  sessionsError: boolean;
  profiles: AuthProfile[];
  profilesLoading: boolean;
  profilesError: boolean;
  providers: string[];
  onAddProfile: (payload: { provider: string; apiKey: string }) => Promise<void>;
  onDeleteProfile: (profileId: string) => Promise<void>;
};

export function SessionsPanel({
  sessions,
  activeSessionId,
  onSelectSession,
  sessionsLoading,
  sessionsError,
  profiles,
  profilesLoading,
  profilesError,
  providers,
  onAddProfile,
  onDeleteProfile,
}: SessionsPanelProps) {
  const [newProfileProvider, setNewProfileProvider] = useState(providers[0] ?? "moonshot");
  const [newApiKey, setNewApiKey] = useState("");
  const [isAddingProfile, setIsAddingProfile] = useState(false);
  const [deletingProfileId, setDeletingProfileId] = useState<string | null>(null);
  const [status, setStatus] = useState<ActionStatus | null>(null);

  useEffect(() => {
    if (providers.length === 0) {
      return;
    }

    if (!providers.includes(newProfileProvider)) {
      setNewProfileProvider(providers[0]);
    }
  }, [newProfileProvider, providers]);

  const handleAddProfile = async () => {
    const apiKey = newApiKey.trim();
    if (!apiKey || isAddingProfile) {
      return;
    }

    setIsAddingProfile(true);
    try {
      await onAddProfile({ provider: newProfileProvider, apiKey });
      setNewApiKey("");
      setStatus({ kind: "success", message: `Profile saved for ${newProfileProvider}.` });
    } catch (error) {
      setStatus({
        kind: "error",
        message: getErrorMessage(error, "Failed to add model profile."),
      });
    } finally {
      setIsAddingProfile(false);
    }
  };

  const handleDeleteProfile = async (profileId: string) => {
    if (deletingProfileId) {
      return;
    }

    setDeletingProfileId(profileId);
    try {
      await onDeleteProfile(profileId);
      setStatus({ kind: "success", message: "Profile removed." });
    } catch (error) {
      setStatus({
        kind: "error",
        message: getErrorMessage(error, "Failed to delete model profile."),
      });
    } finally {
      setDeletingProfileId(null);
    }
  };

  return (
    <Panel title="Sessions" subtitle="Rust-backed conversation sessions">
      <div className="space-y-3">
        {sessionsLoading ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white/60 px-4 py-3 text-sm text-slate-500">
            Loading sessions...
          </div>
        ) : sessionsError ? (
          <div className="rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            Failed to load sessions.
          </div>
        ) : sessions.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white/60 px-4 py-3 text-sm text-slate-500">
            No sessions yet. Start a new one.
          </div>
        ) : (
          sessions.map((session) => (
            <button
              key={session.id}
              type="button"
              onClick={() => onSelectSession(session.id)}
              className={`w-full rounded-2xl border px-4 py-3 text-left transition ${
                activeSessionId === session.id
                  ? "border-slate-300 bg-white shadow-[0_12px_30px_-25px_rgba(15,23,42,0.35)]"
                  : "border-slate-100 bg-white/70 hover:border-slate-200"
              }`}
            >
              <p className="text-sm font-semibold text-slate-900">
                {session.title ?? "Untitled session"}
              </p>
              <p className="text-xs text-slate-500">
                {new Date(session.updated_at).toLocaleString()}
              </p>
            </button>
          ))
        )}
      </div>

      <div className="mt-6 space-y-3 border-t border-slate-100 pt-4">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
          Model auth profiles
        </p>

        {profilesLoading ? (
          <p className="text-xs text-slate-500">Loading profiles...</p>
        ) : profilesError ? (
          <p className="text-xs text-rose-600">Failed to load profiles.</p>
        ) : profiles.length === 0 ? (
          <p className="text-xs text-slate-500">No saved profiles yet.</p>
        ) : (
          <div className="space-y-2">
            {profiles.map((profile) => (
              <div
                key={profile.id}
                className="flex items-center justify-between gap-2 rounded-xl border border-slate-100 bg-white px-3 py-2"
              >
                <div>
                  <p className="text-xs font-semibold text-slate-900">
                    {profile.provider}:{profile.profile_id}
                  </p>
                  <p className="text-[11px] text-slate-500">{profile.profile_type}</p>
                </div>
                <button
                  type="button"
                  onClick={() => void handleDeleteProfile(profile.id)}
                  disabled={deletingProfileId === profile.id}
                  className="rounded-full border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold text-rose-500 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {deletingProfileId === profile.id ? "Deleting" : "Delete"}
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="space-y-2 rounded-xl border border-slate-100 bg-white px-3 py-3">
          <label
            htmlFor="profile-provider"
            className="text-[11px] font-semibold uppercase tracking-[0.15em] text-slate-400"
          >
            Provider
          </label>
          <select
            id="profile-provider"
            value={newProfileProvider}
            onChange={(event) => setNewProfileProvider(event.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700"
          >
            {providers.length > 0 ? (
              providers.map((provider) => (
                <option key={provider} value={provider}>
                  {provider}
                </option>
              ))
            ) : (
              <option value="moonshot">moonshot</option>
            )}
          </select>
          <label
            htmlFor="profile-api-key"
            className="text-[11px] font-semibold uppercase tracking-[0.15em] text-slate-400"
          >
            API key
          </label>
          <input
            id="profile-api-key"
            type="password"
            value={newApiKey}
            onChange={(event) => setNewApiKey(event.target.value)}
            placeholder="sk-..."
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700"
          />
          <button
            type="button"
            onClick={() => void handleAddProfile()}
            disabled={isAddingProfile || !newApiKey.trim()}
            className="w-full rounded-full bg-slate-900 px-3 py-2 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isAddingProfile ? "Adding profile" : "Add profile"}
          </button>
          <ActionStatusMessage status={status} />
        </div>
      </div>
    </Panel>
  );
}
