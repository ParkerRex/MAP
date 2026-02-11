import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const repoRoot = resolve(import.meta.dir, "..");
const wsRoutePath = resolve(repoRoot, "backend/apps/gateway/src/routes/ws.rs");

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

describe("gateway ws contract matrix", () => {
  it("keeps method alias compatibility for map and openclaw names", () => {
    const source = readFileSync(wsRoutePath, "utf8");

    const methodAliases: Array<{ aliases: string[]; canonical: string }> = [
      { aliases: ["models.list", "models.get", "models"], canonical: "models.list" },
      { aliases: ["skills.list", "skills.status"], canonical: "skills.list" },
      { aliases: ["cron.jobs.list", "cron.list"], canonical: "cron.jobs.list" },
      { aliases: ["cron.runs.list", "cron.runs"], canonical: "cron.runs.list" },
      { aliases: ["cron.jobs.create", "cron.add"], canonical: "cron.jobs.create" },
      { aliases: ["cron.jobs.run", "cron.run"], canonical: "cron.jobs.run" },
      { aliases: ["cron.jobs.delete", "cron.remove"], canonical: "cron.jobs.delete" },
      {
        aliases: [
          "channels.resolveSession",
          "channels.resolve-session",
          "channels.resolve_session",
        ],
        canonical: "channels.resolveSession",
      },
      { aliases: ["nodes.list", "node.list"], canonical: "nodes.list" },
      {
        aliases: ["nodes.pair.request", "node.pair.request"],
        canonical: "nodes.pair.request",
      },
      {
        aliases: ["nodes.pair.approve", "node.pair.approve"],
        canonical: "nodes.pair.approve",
      },
      {
        aliases: ["nodes.pair.reject", "node.pair.reject"],
        canonical: "nodes.pair.reject",
      },
      { aliases: ["nodes.verify", "node.pair.verify"], canonical: "nodes.verify" },
    ];

    for (const { aliases, canonical } of methodAliases) {
      const aliasPattern = aliases
        .map((alias) => `\"${escapeRegex(alias)}\"`)
        .join("\\s*\\|\\s*");
      const pattern = new RegExp(
        `${aliasPattern}\\s*=>\\s*(?:\\{\\s*)?\\"${escapeRegex(canonical)}\\"`,
        "m",
      );
      expect(source).toMatch(pattern);
    }
  });

  it("keeps serde alias support for openclaw snake_case params", () => {
    const source = readFileSync(wsRoutePath, "utf8");

    const serdeAliases = [
      "session_id",
      "session_key",
      "fallback_models",
      "idempotency_key",
      "message_limit",
      "run_limit",
      "run_id",
      "schedule_kind",
      "schedule_expr",
      "session_target",
      "delivery_mode",
      "peer_kind",
      "peer_id",
      "account_key",
      "thread_id",
      "dm_scope",
      "dm_policy",
      "identity_key",
      "agent_id",
      "main_key",
      "node_id",
      "node_key",
      "display_name",
      "request_id",
      "job_id",
    ];

    for (const alias of serdeAliases) {
      const pattern = new RegExp(`#\\[serde\\(alias\\s*=\\s*\"${escapeRegex(alias)}\"\\)\\]`, "m");
      expect(source).toMatch(pattern);
    }
  });
});
