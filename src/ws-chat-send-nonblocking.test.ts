import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const repoRoot = resolve(import.meta.dir, "..");
const wsRoutePath = resolve(repoRoot, "backend/apps/gateway/src/routes/ws.rs");

function sectionBetween(source: string, start: string, end: string): string {
  const startIndex = source.indexOf(start);
  expect(startIndex).toBeGreaterThanOrEqual(0);

  const endIndex = source.indexOf(end, startIndex + start.length);
  expect(endIndex).toBeGreaterThan(startIndex);

  return source.slice(startIndex, endIndex);
}

describe("gateway ws chat.send non-blocking contract", () => {
  it("acks before background execution and keeps run execution out of the handler", () => {
    const source = readFileSync(wsRoutePath, "utf8");
    const chatSendBlock = sectionBetween(source, '"chat.send" => {', '"chat.inject" => {');

    expect(chatSendBlock).toContain("create_chat_run_record(");
    expect(chatSendBlock).toContain("send_ok(socket, &request.id, accepted).await?;");
    expect(chatSendBlock).toContain("tokio::spawn(async move");

    const ackIndex = chatSendBlock.indexOf("send_ok(socket, &request.id, accepted).await?;");
    const spawnIndex = chatSendBlock.indexOf("tokio::spawn(async move");
    expect(ackIndex).toBeGreaterThanOrEqual(0);
    expect(spawnIndex).toBeGreaterThan(ackIndex);

    // chat.send must not await generation inline.
    expect(chatSendBlock).not.toContain("execute_chat_run(");
  });

  it("executes runs in background task and emits run.started before generation", () => {
    const source = readFileSync(wsRoutePath, "utf8");
    const taskBlock = sectionBetween(source, "async fn run_chat_task(", "fn api_error_to_wire(");

    expect(taskBlock).toContain('"kind": "run.started"');
    expect(taskBlock).toContain("execute_chat_run(");

    const startedIndex = taskBlock.indexOf('"kind": "run.started"');
    const executeIndex = taskBlock.indexOf("execute_chat_run(");
    expect(startedIndex).toBeGreaterThanOrEqual(0);
    expect(executeIndex).toBeGreaterThan(startedIndex);
  });
});
