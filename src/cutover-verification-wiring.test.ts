import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("rust/web cutover verification wiring", () => {
  const repoRoot = resolve(import.meta.dir, "..");
  const packageJsonPath = resolve(repoRoot, "package.json");
  const workflowPath = resolve(
    repoRoot,
    ".github/workflows/rust-web-cutover.yml",
  );
  const smokeScriptPath = resolve(
    repoRoot,
    "scripts/smoke-gateway-control-plane.sh",
  );
  const verifyScriptPath = resolve(repoRoot, "scripts/verify-rust-cutover.sh");
  const unifiedVerifyScriptPath = resolve(
    repoRoot,
    "scripts/verify-rust-web-cutover.sh",
  );

  it("defines repeatable verification scripts in package.json", () => {
    const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8")) as {
      scripts?: Record<string, string>;
    };
    const scripts = packageJson.scripts ?? {};

    expect(scripts["test:gateway"]).toBe(
      "cargo test -p map-gateway --manifest-path backend/Cargo.toml",
    );
    expect(scripts["test:cutover:web"]).toBe(
      "bun test src/no-convex-imports.test.ts src/lib/client-api.test.ts src/app/api/goals/validation.test.ts",
    );
    expect(scripts["verify:rust-cutover"]).toBe(
      "./scripts/verify-rust-cutover.sh",
    );
    expect(scripts["verify:gateway:smoke"]).toBe(
      "./scripts/smoke-gateway-control-plane.sh",
    );
    expect(scripts["verify:rust-web-cutover"]).toBe(
      "./scripts/verify-rust-web-cutover.sh",
    );
  });

  it("keeps the cutover workflow wired to gateway tests and smoke checks", () => {
    const workflow = readFileSync(workflowPath, "utf8");

    expect(workflow).toContain("name: Rust/Web Cutover Verification");
    expect(workflow).toContain("RUST_GATEWAY_TEST_DATABASE_URL");
    expect(workflow).toContain("Gateway crate tests");
    expect(workflow).toContain("Cutover verification script");
    expect(workflow).toContain("Gateway control-plane smoke script");
    expect(workflow).toContain("bun run test:gateway");
    expect(workflow).toContain("bun run verify:rust-cutover");
    expect(workflow).toContain("bun run verify:gateway:smoke");
  });

  it("keeps script chain and smoke auth-header guard in place", () => {
    const smokeScript = readFileSync(smokeScriptPath, "utf8");
    const verifyScript = readFileSync(verifyScriptPath, "utf8");
    const unifiedVerifyScript = readFileSync(unifiedVerifyScriptPath, "utf8");

    expect(smokeScript).toContain("if ((${#auth_header[@]})); then");
    expect(smokeScript).toContain("Gateway control-plane smoke check passed.");

    expect(verifyScript).toContain("bun run test:cutover:web");
    expect(verifyScript).toContain(
      "cargo test -p map-gateway --manifest-path backend/Cargo.toml model_runtime::tests",
    );

    expect(unifiedVerifyScript).toContain("bun run test:gateway");
    expect(unifiedVerifyScript).toContain("bun run verify:rust-cutover");
  });
});
