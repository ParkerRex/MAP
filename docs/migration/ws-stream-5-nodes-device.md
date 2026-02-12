# WS Stream 5: Nodes + Device Pairing Bridge

This document captures the MAP Rust gateway behavior for Stream 5 OpenClaw parity methods.

## Methods

Implemented in `backend/apps/gateway/src/routes/ws_methods/nodes_device.rs` and dispatched from WS canonical methods:

- `node.invoke.result`
- `node.pair.list`
- `node.rename`
- `device.pair.list`
- `device.pair.approve`
- `device.pair.reject`
- `device.token.rotate`
- `device.token.revoke`

## Behavior Summary

- `node.pair.list`: Returns pending node pairing requests and approved nodes with capability-derived metadata.
- `device.pair.list`: Returns pending pairing requests and paired devices, including role/scopes token metadata when present.
- `device.pair.approve`: Approves a pending `provider = node` pairing request and returns device summary.
- `device.pair.reject`: Rejects a pending `provider = node` pairing request.
- `device.token.rotate`: Rotates device token hash in `node_pairings`, updates node capabilities role/scopes, returns cleartext token once.
- `device.token.revoke`: Deactivates active token for device/node role pair and returns revoke timestamp.
- `node.rename`: Updates display name for an approved node.
- `node.invoke.result`: Accepts invoke result envelope, records audit log, and returns deterministic accepted/ignored response shape.

## Request Compatibility

Stream 5 handlers accept MAP camelCase and OpenClaw snake_case aliases for key params:

- `requestId` / `request_id`
- `deviceId` / `device_id`
- `nodeId` / `node_id`
- `displayName` / `display_name`

## Error Contract

Validation and operational failures return WS structured errors via `WsMethodError` mapped to:

- `invalid_request` for bad params and unsupported state transitions.
- `not_found` for unknown node/request lookups where applicable.
- `unavailable` only where runtime capability is intentionally not implemented.

No Stream 5 method should surface `method_not_found` when canonical mapping recognizes it.

## Regression Coverage

Current coverage includes:

- DB-backed lifecycle tests for approve/reject/rotate/revoke and invoke-result/rename contracts (auto-skip when test DB env is not configured).
- Unit tests for alias parsing and scope normalization stability.
