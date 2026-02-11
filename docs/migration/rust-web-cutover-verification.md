# Rust/Web Cutover Verification

This document defines the repeatable verification flow for Rust gateway + web
cutover checks.

## CI Workflow

The workflow is at:

- `.github/workflows/rust-web-cutover.yml`

It runs on `push` and `pull_request` for backend, scripts, test, and workflow
path changes. CI provisions Postgres and then runs:

1. `bun run test:gateway`
2. `bun run verify:rust-cutover`
3. `bun run verify:gateway:smoke` (against a live gateway process)

## Local Verification Commands

Run these from repo root:

```bash
bun run test:gateway
bun run verify:rust-cutover
bun run verify:rust-web-cutover
```

If you want to run smoke checks against a specific gateway target:

```bash
RUST_GATEWAY_URL=http://127.0.0.1:18889 \
RUST_GATEWAY_TOKEN=... \
bun run verify:gateway:smoke
```

## Environment Variables

Required for gateway tests and runtime:

- `RUST_GATEWAY_DATABASE_URL`

Recommended for explicit test-db targeting:

- `RUST_GATEWAY_TEST_DATABASE_URL`

Optional for local smoke + process boot:

- `RUST_GATEWAY_HOST` (default `127.0.0.1` in CI)
- `RUST_GATEWAY_PORT` (CI uses `18889` to avoid common local collisions)
- `RUST_GATEWAY_TOKEN` for protected gateways

## Regression Coverage Added

Control-plane-critical endpoint contracts are covered by Rust tests in:

- `backend/apps/gateway/src/routes/cron.rs`

Covered flows:

- model preview contract (`POST /v1/models/generate`)
- inbound simulation policy outcomes (`POST /v1/channels/inbound`)
- cron run listing contract (`GET /v1/cron/runs`)

Wiring regressions for scripts/workflow are covered by:

- `src/cutover-verification-wiring.test.ts`
