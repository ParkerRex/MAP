export type Session = {
  id: string;
  title: string | null;
  created_at: string;
  updated_at: string;
};

export type SessionMessage = {
  id: string;
  session_id: string;
  role: "user" | "assistant" | string;
  text: string;
  created_at: string;
};

export type CreateSessionResponse = Session;

export type CreateRunResponse = {
  run_id: string;
  session_id: string;
  status: string;
  requires_confirmation: boolean;
  stream_path: string;
};

export type ModelAttempt = {
  model: string;
  provider: string;
  profile_id: string;
  source: string;
  ok: boolean;
  error?: string | null;
};

export type SessionRun = {
  id: string;
  session_id: string;
  prompt: string;
  status: string;
  output: string;
  metadata: {
    model_used?: string;
    attempts?: ModelAttempt[];
    requires_confirmation?: boolean;
  };
  model_used?: string | null;
  created_at: string;
  updated_at: string;
};

export type ModelsResponse = {
  primary_model: string;
  fallback_models: string[];
  providers: Array<{
    provider: string;
    base_url: string;
    env_key_configured: boolean;
  }>;
  failover_strategy: string;
};

export type AuthProfile = {
  id: string;
  provider: string;
  profile_id: string;
  profile_type: string;
  payload: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type SecurityAuditResponse = {
  status: "ok" | "warning";
  checks: Array<{
    name: string;
    ok: boolean;
    detail: string;
  }>;
};

export type SkillsResponse = {
  skills: Array<{
    skill_key: string;
    description: string;
    source_type: string;
    source_path: string;
  }>;
  precedence: string[];
};

export type CronJob = {
  id: string;
  name: string;
  schedule_kind: string;
  schedule_expr: string;
  timezone: string | null;
  payload: {
    message?: string;
  };
  session_target: string;
  delivery_mode: string | null;
  enabled: boolean;
  next_run_at: string | null;
  last_run_at: string | null;
  last_error: string | null;
  created_at: string;
  updated_at: string;
};

export type CronRun = {
  id: string;
  cron_job_id: string;
  status: string;
  started_at: string;
  finished_at: string | null;
  output: {
    session_id?: string;
    message?: string;
  };
};

export type ChannelsSummaryResponse = {
  connectors: string[];
  account_count: number;
  route_count: number;
};

export type PairingRequest = {
  id: string;
  provider: string;
  peer_key: string;
  code: string;
  status: string;
  expires_at: string;
  created_at: string;
  updated_at: string;
};

export type ChannelAccount = {
  id: string;
  provider: string;
  account_key: string;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type ChannelRoute = {
  id: string;
  provider: string;
  account_id: string | null;
  peer_key: string;
  session_scope: string;
  created_at: string;
  updated_at: string;
};

export type NodeRecord = {
  id: string;
  node_key: string;
  display_name: string | null;
  pairing_status: string;
  capabilities: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type NodePairingRequest = {
  id: string;
  provider: string;
  peer_key: string;
  code: string;
  status: string;
  expires_at: string;
  created_at: string;
  updated_at: string;
};

export type NodesResponse = {
  nodes: NodeRecord[];
  pending_requests: NodePairingRequest[];
  pairing_mode: string;
};

export type VerifyNodeResponse = {
  ok: boolean;
  node_id: string | null;
};

export type InboundMessageResponse = {
  accepted: boolean;
  requires_pairing: boolean;
  reason?: string | null;
  pairing_request_id?: string | null;
  pairing_code?: string | null;
  pairing_expires_at?: string | null;
  session_id?: string | null;
  session_key?: string | null;
  run_id?: string | null;
  model_used?: string | null;
  output?: string | null;
};

export type GeneratePreviewResponse = {
  model_used: string;
  output: string;
  attempts: ModelAttempt[];
};

export type ActionStatusKind = "success" | "error";

export type ActionStatus = {
  kind: ActionStatusKind;
  message: string;
};
