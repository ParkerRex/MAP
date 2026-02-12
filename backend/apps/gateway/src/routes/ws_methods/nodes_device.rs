use super::WsMethodError;
use crate::error::ApiError;
use crate::state::AppState;
use chrono::{DateTime, Utc};
use serde::Deserialize;
use serde_json::{json, Value};
use sha2::{Digest, Sha256};
use sqlx::FromRow;
use uuid::Uuid;

type WsMethodResult = Result<Value, WsMethodError>;

#[derive(Debug, Default, Deserialize)]
#[serde(rename_all = "camelCase")]
struct PairDecisionParams {
    #[serde(alias = "request_id")]
    request_id: Option<Uuid>,
    id: Option<Uuid>,
}

#[derive(Debug, Default, Deserialize)]
#[serde(rename_all = "camelCase")]
struct DeviceTokenRotateParams {
    #[serde(alias = "device_id")]
    device_id: Option<String>,
    role: Option<String>,
    scopes: Option<Vec<String>>,
}

#[derive(Debug, Default, Deserialize)]
#[serde(rename_all = "camelCase")]
struct DeviceTokenRevokeParams {
    #[serde(alias = "device_id")]
    device_id: Option<String>,
    role: Option<String>,
}

#[derive(Debug, Default, Deserialize)]
#[serde(rename_all = "camelCase")]
struct NodeRenameParams {
    #[serde(alias = "node_id")]
    node_id: Option<String>,
    #[serde(alias = "display_name")]
    display_name: Option<String>,
}

#[derive(Debug, Default, Deserialize)]
#[serde(rename_all = "camelCase")]
struct NodeInvokeResultParams {
    id: Option<String>,
    #[serde(alias = "node_id")]
    node_id: Option<String>,
    ok: Option<bool>,
    payload: Option<Value>,
    #[serde(alias = "payload_json")]
    payload_json: Option<Value>,
    error: Option<NodeInvokeResultError>,
}

#[derive(Debug, Default, Deserialize)]
#[serde(rename_all = "camelCase")]
struct NodeInvokeResultError {
    code: Option<String>,
    message: Option<String>,
}

#[derive(Debug, FromRow)]
struct PendingNodePairingRow {
    request_id: Uuid,
    node_key: String,
    created_at: DateTime<Utc>,
    display_name: Option<String>,
    capabilities: Value,
    pairing_status: Option<String>,
}

#[derive(Debug, FromRow)]
struct PairedNodeRow {
    node_key: String,
    display_name: Option<String>,
    capabilities: Value,
    created_at: DateTime<Utc>,
    updated_at: DateTime<Utc>,
    token_created_at: Option<DateTime<Utc>>,
    token_updated_at: Option<DateTime<Utc>>,
    token_active: Option<bool>,
}

#[derive(Debug, FromRow)]
struct DeviceLookupRow {
    node_id: Uuid,
    node_key: String,
    capabilities: Value,
}

#[cfg_attr(test, allow(dead_code))]
pub(crate) async fn dispatch(
    state: &AppState,
    method: &str,
    params: Value,
) -> Option<WsMethodResult> {
    dispatch_with_pool(&state.pool, method, params).await
}

async fn dispatch_with_pool(
    pool: &sqlx::PgPool,
    method: &str,
    params: Value,
) -> Option<WsMethodResult> {
    Some(match method {
        "node.invoke.result" => handle_node_invoke_result(pool, params).await,
        "node.pair.list" => handle_node_pair_list(pool).await,
        "node.rename" => handle_node_rename(pool, params).await,
        "device.pair.list" => handle_device_pair_list(pool).await,
        "device.pair.approve" => handle_device_pair_approve(pool, params).await,
        "device.pair.reject" => handle_device_pair_reject(pool, params).await,
        "device.token.rotate" => handle_device_token_rotate(pool, params).await,
        "device.token.revoke" => handle_device_token_revoke(pool, params).await,
        _ => return None,
    })
}

async fn handle_node_pair_list(pool: &sqlx::PgPool) -> WsMethodResult {
    let pending = fetch_pending_node_pairings(pool).await?;
    let paired = fetch_paired_nodes(pool).await?;

    Ok(json!({
        "pending": pending.iter().map(|row| {
            let remote_ip = capability_string(&row.capabilities, &["remoteIp", "remote_ip"]);
            let is_repair = row.pairing_status.as_deref() == Some("approved");
            json!({
                "requestId": row.request_id,
                "nodeId": row.node_key,
                "displayName": row.display_name,
                "platform": capability_string(&row.capabilities, &["platform"]),
                "version": capability_string(&row.capabilities, &["version"]),
                "coreVersion": capability_string(&row.capabilities, &["coreVersion", "core_version"]),
                "uiVersion": capability_string(&row.capabilities, &["uiVersion", "ui_version"]),
                "remoteIp": remote_ip,
                "isRepair": is_repair,
                "ts": row.created_at.timestamp_millis(),
            })
        }).collect::<Vec<_>>(),
        "paired": paired.iter().map(|row| {
            json!({
                "nodeId": row.node_key,
                "displayName": row.display_name,
                "platform": capability_string(&row.capabilities, &["platform"]),
                "version": capability_string(&row.capabilities, &["version"]),
                "coreVersion": capability_string(&row.capabilities, &["coreVersion", "core_version"]),
                "uiVersion": capability_string(&row.capabilities, &["uiVersion", "ui_version"]),
                "remoteIp": capability_string(&row.capabilities, &["remoteIp", "remote_ip"]),
                "permissions": row.capabilities.get("permissions").cloned().unwrap_or(Value::Null),
                "createdAtMs": row.created_at.timestamp_millis(),
                "approvedAtMs": row.updated_at.timestamp_millis(),
                "lastConnectedAtMs": capability_i64(&row.capabilities, &["lastConnectedAtMs", "last_connected_at_ms"]),
            })
        }).collect::<Vec<_>>(),
    }))
}

async fn handle_device_pair_list(pool: &sqlx::PgPool) -> WsMethodResult {
    let pending = fetch_pending_node_pairings(pool).await?;
    let paired = fetch_paired_nodes(pool).await?;

    Ok(json!({
        "pending": pending.iter().map(|row| {
            json!({
                "requestId": row.request_id,
                "deviceId": row.node_key,
                "displayName": row.display_name,
                "role": role_from_capabilities(&row.capabilities),
                "remoteIp": capability_string(&row.capabilities, &["remoteIp", "remote_ip"]),
                "isRepair": row.pairing_status.as_deref() == Some("approved"),
                "ts": row.created_at.timestamp_millis(),
            })
        }).collect::<Vec<_>>(),
        "paired": paired.iter().map(device_row_from_paired).collect::<Vec<_>>(),
    }))
}

async fn handle_device_pair_approve(pool: &sqlx::PgPool, params: Value) -> WsMethodResult {
    let params = serde_json::from_value::<PairDecisionParams>(params)
        .map_err(|_| bad_request("invalid device.pair.approve params"))?;

    let Some(request_id) = params.request_id.or(params.id) else {
        return Err(bad_request("requestId is required"));
    };

    let pending = sqlx::query_as::<_, (String, String, Option<String>)>(
        r#"
        select pr.peer_key, n.id::text as node_id, n.capabilities #>> '{deviceTokenRole}' as role
        from pairing_requests pr
        left join nodes n on n.node_key = pr.peer_key
        where pr.id = $1 and pr.provider = 'node' and pr.status = 'pending' and pr.expires_at > now()
        "#,
    )
    .bind(request_id)
    .fetch_optional(pool)
    .await
    .map_err(request_failed)?;

    let Some((node_key, _node_id, existing_role)) = pending else {
        return Err(bad_request("unknown requestId"));
    };

    let token = Uuid::now_v7().to_string();
    let token_hash = hash_token(&token);

    let node = sqlx::query_as::<_, DeviceLookupRow>(
        r#"
        select id as node_id, node_key, capabilities
        from nodes
        where node_key = $1
        limit 1
        "#,
    )
    .bind(&node_key)
    .fetch_optional(pool)
    .await
    .map_err(request_failed)?;

    let Some(node) = node else {
        return Err(bad_request("unknown requestId"));
    };

    sqlx::query(
        r#"
        insert into node_pairings (node_id, token_hash, active)
        values ($1, $2, true)
        on conflict (node_id)
        do update set token_hash = excluded.token_hash, active = true, updated_at = now()
        "#,
    )
    .bind(node.node_id)
    .bind(token_hash)
    .execute(pool)
    .await
    .map_err(request_failed)?;

    let mut capabilities = node.capabilities;
    let role = existing_role
        .or_else(|| capability_string(&capabilities, &["deviceTokenRole"]))
        .unwrap_or_else(|| "node".to_string());
    set_capability_string(&mut capabilities, "deviceTokenRole", role.clone());

    sqlx::query(
        r#"
        update nodes
        set pairing_status = 'approved', capabilities = $2, updated_at = now()
        where id = $1
        "#,
    )
    .bind(node.node_id)
    .bind(capabilities)
    .execute(pool)
    .await
    .map_err(request_failed)?;

    sqlx::query(
        "update pairing_requests set status = 'approved', updated_at = now() where id = $1",
    )
    .bind(request_id)
    .execute(pool)
    .await
    .map_err(request_failed)?;

    let row = fetch_paired_node_by_key(pool, &node.node_key).await?;

    Ok(json!({
        "requestId": request_id,
        "device": device_row_from_paired(&row),
    }))
}

async fn handle_device_pair_reject(pool: &sqlx::PgPool, params: Value) -> WsMethodResult {
    let params = serde_json::from_value::<PairDecisionParams>(params)
        .map_err(|_| bad_request("invalid device.pair.reject params"))?;

    let Some(request_id) = params.request_id.or(params.id) else {
        return Err(bad_request("requestId is required"));
    };

    let pending = sqlx::query_as::<_, (String,)>(
        r#"
        select peer_key
        from pairing_requests
        where id = $1 and provider = 'node' and status = 'pending'
        "#,
    )
    .bind(request_id)
    .fetch_optional(pool)
    .await
    .map_err(request_failed)?;

    let Some((node_key,)) = pending else {
        return Err(bad_request("unknown requestId"));
    };

    sqlx::query(
        "update pairing_requests set status = 'rejected', updated_at = now() where id = $1",
    )
    .bind(request_id)
    .execute(pool)
    .await
    .map_err(request_failed)?;

    sqlx::query(
        "update nodes set pairing_status = 'rejected', updated_at = now() where node_key = $1",
    )
    .bind(&node_key)
    .execute(pool)
    .await
    .map_err(request_failed)?;

    Ok(json!({
        "requestId": request_id,
        "deviceId": node_key,
    }))
}

async fn handle_device_token_rotate(pool: &sqlx::PgPool, params: Value) -> WsMethodResult {
    let params = serde_json::from_value::<DeviceTokenRotateParams>(params)
        .map_err(|_| bad_request("invalid device.token.rotate params"))?;

    let device_id = params
        .device_id
        .map(|value| value.trim().to_string())
        .filter(|value| !value.is_empty())
        .ok_or_else(|| bad_request("deviceId is required"))?;

    let role = params
        .role
        .map(|value| value.trim().to_string())
        .filter(|value| !value.is_empty())
        .ok_or_else(|| bad_request("role is required"))?;

    let mut node = find_device_node(pool, &device_id).await?;

    let scopes = normalize_scopes(
        params
            .scopes
            .or_else(|| capability_strings(&node.capabilities, &["deviceTokenScopes", "scopes"])),
    );

    set_capability_string(&mut node.capabilities, "deviceTokenRole", role.clone());
    set_capability_strings(&mut node.capabilities, "deviceTokenScopes", &scopes);

    let token = Uuid::now_v7().to_string();
    let token_hash = hash_token(&token);

    sqlx::query(
        r#"
        insert into node_pairings (node_id, token_hash, active)
        values ($1, $2, true)
        on conflict (node_id)
        do update set token_hash = excluded.token_hash, active = true, updated_at = now()
        "#,
    )
    .bind(node.node_id)
    .bind(token_hash)
    .execute(pool)
    .await
    .map_err(request_failed)?;

    sqlx::query(
        r#"
        update nodes
        set pairing_status = 'approved', capabilities = $2, updated_at = now()
        where id = $1
        "#,
    )
    .bind(node.node_id)
    .bind(node.capabilities)
    .execute(pool)
    .await
    .map_err(request_failed)?;

    let rotated_at_ms = Utc::now().timestamp_millis();
    Ok(json!({
        "deviceId": node.node_key,
        "role": role,
        "token": token,
        "scopes": scopes,
        "rotatedAtMs": rotated_at_ms,
    }))
}

async fn handle_device_token_revoke(pool: &sqlx::PgPool, params: Value) -> WsMethodResult {
    let params = serde_json::from_value::<DeviceTokenRevokeParams>(params)
        .map_err(|_| bad_request("invalid device.token.revoke params"))?;

    let device_id = params
        .device_id
        .map(|value| value.trim().to_string())
        .filter(|value| !value.is_empty())
        .ok_or_else(|| bad_request("deviceId is required"))?;

    let role = params
        .role
        .map(|value| value.trim().to_string())
        .filter(|value| !value.is_empty())
        .ok_or_else(|| bad_request("role is required"))?;

    let node = find_device_node(pool, &device_id).await?;
    let existing_role = capability_string(&node.capabilities, &["deviceTokenRole"])
        .unwrap_or_else(|| "node".to_string());
    if existing_role != role {
        return Err(bad_request("unknown deviceId/role"));
    }

    let result = sqlx::query(
        "update node_pairings set active = false, updated_at = now() where node_id = $1",
    )
    .bind(node.node_id)
    .execute(pool)
    .await
    .map_err(request_failed)?;

    if result.rows_affected() == 0 {
        return Err(bad_request("unknown deviceId/role"));
    }

    Ok(json!({
        "deviceId": node.node_key,
        "role": role,
        "revokedAtMs": Utc::now().timestamp_millis(),
    }))
}

async fn handle_node_rename(pool: &sqlx::PgPool, params: Value) -> WsMethodResult {
    let params = serde_json::from_value::<NodeRenameParams>(params)
        .map_err(|_| bad_request("invalid node.rename params"))?;

    let node_id = params
        .node_id
        .map(|value| value.trim().to_string())
        .filter(|value| !value.is_empty())
        .ok_or_else(|| bad_request("nodeId is required"))?;

    let display_name = params
        .display_name
        .map(|value| value.trim().to_string())
        .filter(|value| !value.is_empty())
        .ok_or_else(|| bad_request("displayName is required"))?;

    let updated = sqlx::query_as::<_, (String, String)>(
        r#"
        update nodes
        set display_name = $2, updated_at = now()
        where (node_key = $1 or id::text = $1) and pairing_status = 'approved'
        returning node_key, display_name
        "#,
    )
    .bind(&node_id)
    .bind(&display_name)
    .fetch_optional(pool)
    .await
    .map_err(request_failed)?;

    let Some((node_key, updated_display_name)) = updated else {
        return Err(bad_request("unknown nodeId"));
    };

    Ok(json!({
        "nodeId": node_key,
        "displayName": updated_display_name,
    }))
}

async fn handle_node_invoke_result(pool: &sqlx::PgPool, params: Value) -> WsMethodResult {
    let params = serde_json::from_value::<NodeInvokeResultParams>(params)
        .map_err(|_| bad_request("invalid node.invoke.result params"))?;

    let id = params
        .id
        .map(|value| value.trim().to_string())
        .filter(|value| !value.is_empty())
        .ok_or_else(|| bad_request("id is required"))?;

    let node_id = params
        .node_id
        .map(|value| value.trim().to_string())
        .filter(|value| !value.is_empty())
        .ok_or_else(|| bad_request("nodeId is required"))?;

    let ok = params.ok.ok_or_else(|| bad_request("ok is required"))?;

    let payload = if let Some(payload) = params.payload {
        payload
    } else if let Some(payload_json) = params.payload_json {
        match payload_json {
            Value::String(raw) => serde_json::from_str::<Value>(&raw).unwrap_or(Value::String(raw)),
            other => other,
        }
    } else {
        Value::Null
    };

    let _ = sqlx::query(
        r#"
        insert into audit_logs (category, action, actor, details)
        values ('nodes', 'invoke_result', $1, $2)
        "#,
    )
    .bind(&node_id)
    .bind(json!({
        "id": id,
        "nodeId": node_id,
        "ok": ok,
        "payload": payload,
        "error": params.error.as_ref().map(|error| json!({
            "code": error.code,
            "message": error.message,
        })),
        "ignored": true,
        "reason": "invoke tracking unavailable in rust gateway runtime",
        "receivedAtMs": Utc::now().timestamp_millis(),
    }))
    .execute(pool)
    .await;

    Ok(json!({
        "ok": true,
        "ignored": true,
        "id": id,
        "nodeId": node_id,
        "accepted": false,
        "reason": "invoke tracking unavailable in rust gateway runtime",
    }))
}

fn device_row_from_paired(row: &PairedNodeRow) -> Value {
    let role = role_from_capabilities(&row.capabilities);
    let scopes = normalize_scopes(capability_strings(
        &row.capabilities,
        &["deviceTokenScopes", "scopes"],
    ));

    let tokens = row
        .token_created_at
        .map(|created_at| {
            let token_updated_at = row.token_updated_at.unwrap_or(created_at);
            let rotated_at =
                (token_updated_at > created_at).then_some(token_updated_at.timestamp_millis());
            let revoked_at =
                (!row.token_active.unwrap_or(true)).then_some(token_updated_at.timestamp_millis());

            vec![json!({
                "role": role,
                "scopes": scopes,
                "createdAtMs": created_at.timestamp_millis(),
                "rotatedAtMs": rotated_at,
                "revokedAtMs": revoked_at,
            })]
        })
        .unwrap_or_default();

    json!({
        "deviceId": row.node_key,
        "displayName": row.display_name,
        "roles": [role],
        "scopes": scopes,
        "remoteIp": capability_string(&row.capabilities, &["remoteIp", "remote_ip"]),
        "tokens": tokens,
        "createdAtMs": row.created_at.timestamp_millis(),
        "approvedAtMs": row.updated_at.timestamp_millis(),
    })
}

fn role_from_capabilities(capabilities: &Value) -> String {
    capability_string(capabilities, &["deviceTokenRole"])
        .or_else(|| capability_string(capabilities, &["role"]))
        .unwrap_or_else(|| "node".to_string())
}

fn capability_string(capabilities: &Value, keys: &[&str]) -> Option<String> {
    for key in keys {
        if let Some(value) = capabilities.get(*key).and_then(Value::as_str) {
            let trimmed = value.trim();
            if !trimmed.is_empty() {
                return Some(trimmed.to_string());
            }
        }
    }
    None
}

fn capability_i64(capabilities: &Value, keys: &[&str]) -> Option<i64> {
    for key in keys {
        if let Some(value) = capabilities.get(*key).and_then(Value::as_i64) {
            return Some(value);
        }
    }
    None
}

fn capability_strings(capabilities: &Value, keys: &[&str]) -> Option<Vec<String>> {
    for key in keys {
        if let Some(values) = capabilities
            .get(*key)
            .and_then(Value::as_array)
            .map(|array| {
                array
                    .iter()
                    .filter_map(Value::as_str)
                    .map(str::trim)
                    .filter(|value| !value.is_empty())
                    .map(ToString::to_string)
                    .collect::<Vec<_>>()
            })
            .filter(|values| !values.is_empty())
        {
            return Some(values);
        }
    }
    None
}

fn set_capability_string(capabilities: &mut Value, key: &str, value: String) {
    if !capabilities.is_object() {
        *capabilities = json!({});
    }

    if let Some(object) = capabilities.as_object_mut() {
        object.insert(key.to_string(), Value::String(value));
    }
}

fn set_capability_strings(capabilities: &mut Value, key: &str, values: &[String]) {
    if !capabilities.is_object() {
        *capabilities = json!({});
    }

    if let Some(object) = capabilities.as_object_mut() {
        object.insert(
            key.to_string(),
            Value::Array(
                values
                    .iter()
                    .map(|value| Value::String(value.clone()))
                    .collect(),
            ),
        );
    }
}

fn normalize_scopes(scopes: Option<Vec<String>>) -> Vec<String> {
    let mut unique = std::collections::BTreeSet::new();
    if let Some(scopes) = scopes {
        for scope in scopes {
            let trimmed = scope.trim();
            if !trimmed.is_empty() {
                unique.insert(trimmed.to_string());
            }
        }
    }
    unique.into_iter().collect()
}

async fn fetch_pending_node_pairings(
    pool: &sqlx::PgPool,
) -> WsMethodResultWith<Vec<PendingNodePairingRow>> {
    sqlx::query_as::<_, PendingNodePairingRow>(
        r#"
        select
          pr.id as request_id,
          pr.peer_key as node_key,
          pr.created_at,
          n.display_name,
          coalesce(n.capabilities, '{}'::jsonb) as capabilities,
          n.pairing_status
        from pairing_requests pr
        left join nodes n on n.node_key = pr.peer_key
        where pr.provider = 'node' and pr.status = 'pending' and pr.expires_at > now()
        order by pr.created_at desc
        "#,
    )
    .fetch_all(pool)
    .await
    .map_err(request_failed)
}

async fn fetch_paired_nodes(pool: &sqlx::PgPool) -> WsMethodResultWith<Vec<PairedNodeRow>> {
    sqlx::query_as::<_, PairedNodeRow>(
        r#"
        select
          n.node_key,
          n.display_name,
          coalesce(n.capabilities, '{}'::jsonb) as capabilities,
          n.created_at,
          n.updated_at,
          np.created_at as token_created_at,
          np.updated_at as token_updated_at,
          np.active as token_active
        from nodes n
        left join node_pairings np on np.node_id = n.id
        where n.pairing_status = 'approved'
        order by n.updated_at desc
        "#,
    )
    .fetch_all(pool)
    .await
    .map_err(request_failed)
}

async fn fetch_paired_node_by_key(
    pool: &sqlx::PgPool,
    node_key: &str,
) -> WsMethodResultWith<PairedNodeRow> {
    let row = sqlx::query_as::<_, PairedNodeRow>(
        r#"
        select
          n.node_key,
          n.display_name,
          coalesce(n.capabilities, '{}'::jsonb) as capabilities,
          n.created_at,
          n.updated_at,
          np.created_at as token_created_at,
          np.updated_at as token_updated_at,
          np.active as token_active
        from nodes n
        left join node_pairings np on np.node_id = n.id
        where n.node_key = $1
        limit 1
        "#,
    )
    .bind(node_key)
    .fetch_optional(pool)
    .await
    .map_err(request_failed)?;

    row.ok_or_else(|| bad_request("unknown requestId"))
}

async fn find_device_node(
    pool: &sqlx::PgPool,
    device_id: &str,
) -> WsMethodResultWith<DeviceLookupRow> {
    let row = sqlx::query_as::<_, DeviceLookupRow>(
        r#"
        select id as node_id, node_key, capabilities
        from nodes
        where node_key = $1 or id::text = $1
        limit 1
        "#,
    )
    .bind(device_id)
    .fetch_optional(pool)
    .await
    .map_err(request_failed)?;

    row.ok_or_else(|| bad_request("unknown deviceId/role"))
}

type WsMethodResultWith<T> = Result<T, WsMethodError>;

fn bad_request(message: &str) -> WsMethodError {
    WsMethodError::InvalidRequest(message.to_string())
}

fn request_failed(error: sqlx::Error) -> WsMethodError {
    WsMethodError::Api(ApiError::Database(error))
}

fn hash_token(token: &str) -> String {
    let mut hasher = Sha256::new();
    hasher.update(token.as_bytes());
    let bytes = hasher.finalize();
    hex::encode(bytes)
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::db;
    use serde_json::json;
    use sqlx::postgres::PgPoolOptions;

    fn resolve_test_database_url() -> Option<String> {
        std::env::var("RUST_GATEWAY_TEST_DATABASE_URL")
            .ok()
            .or_else(|| std::env::var("RUST_GATEWAY_DATABASE_URL").ok())
            .or_else(|| std::env::var("DATABASE_URL").ok())
    }

    async fn reset_database(pool: &sqlx::PgPool) {
        sqlx::query(
            r#"
            truncate table
              auth_usage_stats,
              auth_profiles,
              audit_logs,
              chat_runs,
              channel_accounts,
              channel_routes,
              cron_jobs,
              cron_runs,
              node_pairings,
              nodes,
              pairing_allowlists,
              pairing_requests,
              session_messages,
              sessions,
              skills
            restart identity cascade
            "#,
        )
        .execute(pool)
        .await
        .expect("failed to truncate gateway test tables");
    }

    async fn seed_pending_request(pool: &sqlx::PgPool, node_key: &str, display_name: &str) -> Uuid {
        sqlx::query(
            r#"
            insert into nodes (node_key, display_name, pairing_status, capabilities)
            values ($1, $2, 'pending', $3)
            on conflict (node_key)
            do update set display_name = excluded.display_name, pairing_status = 'pending', capabilities = excluded.capabilities, updated_at = now()
            "#,
        )
        .bind(node_key)
        .bind(display_name)
        .bind(json!({
            "platform": "ios",
            "remoteIp": "127.0.0.1",
        }))
        .execute(pool)
        .await
        .expect("failed to seed node");

        sqlx::query_scalar::<_, Uuid>(
            r#"
            insert into pairing_requests (provider, peer_key, code, status, expires_at)
            values ('node', $1, '123456', 'pending', now() + interval '5 minutes')
            returning id
            "#,
        )
        .bind(node_key)
        .fetch_one(pool)
        .await
        .expect("failed to seed pairing request")
    }

    #[tokio::test]
    async fn device_pairing_approve_reject_rotate_revoke_lifecycle() {
        let Some(database_url) = resolve_test_database_url() else {
            eprintln!(
                "skipping ws stream-5 lifecycle tests: set RUST_GATEWAY_TEST_DATABASE_URL, RUST_GATEWAY_DATABASE_URL, or DATABASE_URL"
            );
            return;
        };

        let pool = db::connect_and_migrate(&database_url)
            .await
            .expect("failed to connect or migrate gateway test database");
        reset_database(&pool).await;

        let request_a = seed_pending_request(&pool, "node-stream5-a", "Node Stream A").await;
        let request_b = seed_pending_request(&pool, "node-stream5-b", "Node Stream B").await;

        let list_before = dispatch_with_pool(&pool, "device.pair.list", json!({}))
            .await
            .expect("expected handler")
            .expect("expected success payload");
        assert_eq!(
            list_before
                .get("pending")
                .and_then(Value::as_array)
                .map(Vec::len),
            Some(2)
        );

        let approve = dispatch_with_pool(
            &pool,
            "device.pair.approve",
            json!({ "requestId": request_a }),
        )
        .await
        .expect("expected handler")
        .expect("expected success payload");
        assert_eq!(approve.get("requestId"), Some(&json!(request_a)));
        assert_eq!(
            approve.pointer("/device/deviceId").and_then(Value::as_str),
            Some("node-stream5-a")
        );
        assert!(approve.get("token").is_none());

        let rotate = dispatch_with_pool(
            &pool,
            "device.token.rotate",
            json!({
                "deviceId": "node-stream5-a",
                "role": "node",
                "scopes": ["gateway.write", "gateway.read"],
            }),
        )
        .await
        .expect("expected handler")
        .expect("expected rotate payload");
        assert_eq!(
            rotate.get("deviceId").and_then(Value::as_str),
            Some("node-stream5-a")
        );
        assert_eq!(rotate.get("role").and_then(Value::as_str), Some("node"));
        assert!(rotate.get("token").and_then(Value::as_str).is_some());
        assert_eq!(
            rotate.get("scopes").and_then(Value::as_array).map(Vec::len),
            Some(2)
        );

        let revoke = dispatch_with_pool(
            &pool,
            "device.token.revoke",
            json!({
                "deviceId": "node-stream5-a",
                "role": "node",
            }),
        )
        .await
        .expect("expected handler")
        .expect("expected revoke payload");
        assert_eq!(
            revoke.get("deviceId").and_then(Value::as_str),
            Some("node-stream5-a")
        );
        assert!(revoke.get("revokedAtMs").and_then(Value::as_i64).is_some());

        let reject = dispatch_with_pool(
            &pool,
            "device.pair.reject",
            json!({ "requestId": request_b }),
        )
        .await
        .expect("expected handler")
        .expect("expected reject payload");
        assert_eq!(reject.get("requestId"), Some(&json!(request_b)));
        assert_eq!(
            reject.get("deviceId").and_then(Value::as_str),
            Some("node-stream5-b")
        );

        let list_after = dispatch_with_pool(&pool, "device.pair.list", json!({}))
            .await
            .expect("expected handler")
            .expect("expected success payload");
        assert_eq!(
            list_after
                .get("pending")
                .and_then(Value::as_array)
                .map(Vec::len),
            Some(0)
        );
        assert_eq!(
            list_after
                .get("paired")
                .and_then(Value::as_array)
                .map(Vec::len),
            Some(1)
        );
    }

    #[tokio::test]
    async fn node_invoke_result_and_rename_contracts_are_deterministic() {
        let Some(database_url) = resolve_test_database_url() else {
            eprintln!(
                "skipping ws stream-5 invoke/rename tests: set RUST_GATEWAY_TEST_DATABASE_URL, RUST_GATEWAY_DATABASE_URL, or DATABASE_URL"
            );
            return;
        };

        let pool = db::connect_and_migrate(&database_url)
            .await
            .expect("failed to connect or migrate gateway test database");
        reset_database(&pool).await;

        let request_id = seed_pending_request(&pool, "node-stream5-rename", "Before Rename").await;
        let _approved = dispatch_with_pool(
            &pool,
            "device.pair.approve",
            json!({ "requestId": request_id }),
        )
        .await
        .expect("expected handler")
        .expect("expected approve payload");

        let renamed = dispatch_with_pool(
            &pool,
            "node.rename",
            json!({
                "nodeId": "node-stream5-rename",
                "displayName": "After Rename",
            }),
        )
        .await
        .expect("expected handler")
        .expect("expected rename payload");
        assert_eq!(
            renamed.get("displayName").and_then(Value::as_str),
            Some("After Rename")
        );

        let invoke_result = dispatch_with_pool(
            &pool,
            "node.invoke.result",
            json!({
                "id": "invoke-123",
                "nodeId": "node-stream5-rename",
                "ok": false,
                "error": {
                    "code": "FAILED",
                    "message": "simulated",
                }
            }),
        )
        .await
        .expect("expected handler")
        .expect("expected invoke payload");
        assert_eq!(invoke_result.get("ok"), Some(&Value::Bool(true)));
        assert_eq!(invoke_result.get("ignored"), Some(&Value::Bool(true)));
        assert_eq!(invoke_result.get("accepted"), Some(&Value::Bool(false)));

        let bad_invoke = dispatch_with_pool(
            &pool,
            "node.invoke.result",
            json!({
                "nodeId": "node-stream5-rename",
                "ok": true
            }),
        )
        .await
        .expect("expected handler")
        .expect_err("expected bad request for missing id");
        match bad_invoke {
            WsMethodError::InvalidRequest(message) => {
                assert!(message.contains("id is required"));
            }
            other => panic!("expected invalid request error, got {other:?}"),
        }
    }

    #[test]
    fn stream_five_param_aliases_parse_map_and_openclaw_shapes() {
        let decision_map = serde_json::from_value::<PairDecisionParams>(json!({
            "requestId": Uuid::nil()
        }))
        .expect("map-style decision params should parse");
        assert_eq!(decision_map.request_id, Some(Uuid::nil()));

        let decision_openclaw = serde_json::from_value::<PairDecisionParams>(json!({
            "request_id": Uuid::nil()
        }))
        .expect("openclaw-style decision params should parse");
        assert_eq!(decision_openclaw.request_id, Some(Uuid::nil()));

        let rotate_map = serde_json::from_value::<DeviceTokenRotateParams>(json!({
            "deviceId": "node-a",
            "role": "node",
            "scopes": ["gateway.read"]
        }))
        .expect("map-style rotate params should parse");
        assert_eq!(rotate_map.device_id.as_deref(), Some("node-a"));
        assert_eq!(rotate_map.role.as_deref(), Some("node"));

        let rotate_openclaw = serde_json::from_value::<DeviceTokenRotateParams>(json!({
            "device_id": "node-b",
            "role": "node",
            "scopes": ["gateway.write"]
        }))
        .expect("openclaw-style rotate params should parse");
        assert_eq!(rotate_openclaw.device_id.as_deref(), Some("node-b"));
        assert_eq!(rotate_openclaw.role.as_deref(), Some("node"));

        let rename_map = serde_json::from_value::<NodeRenameParams>(json!({
            "nodeId": "node-c",
            "displayName": "Node C"
        }))
        .expect("map-style rename params should parse");
        assert_eq!(rename_map.node_id.as_deref(), Some("node-c"));
        assert_eq!(rename_map.display_name.as_deref(), Some("Node C"));

        let rename_openclaw = serde_json::from_value::<NodeRenameParams>(json!({
            "node_id": "node-d",
            "display_name": "Node D"
        }))
        .expect("openclaw-style rename params should parse");
        assert_eq!(rename_openclaw.node_id.as_deref(), Some("node-d"));
        assert_eq!(rename_openclaw.display_name.as_deref(), Some("Node D"));

        let invoke_map = serde_json::from_value::<NodeInvokeResultParams>(json!({
            "id": "invoke-1",
            "nodeId": "node-e",
            "ok": true,
            "payload": {"ok": true}
        }))
        .expect("map-style invoke params should parse");
        assert_eq!(invoke_map.id.as_deref(), Some("invoke-1"));
        assert_eq!(invoke_map.node_id.as_deref(), Some("node-e"));
        assert_eq!(invoke_map.ok, Some(true));

        let invoke_openclaw = serde_json::from_value::<NodeInvokeResultParams>(json!({
            "id": "invoke-2",
            "node_id": "node-f",
            "ok": false,
            "payload_json": "{\"ok\":false}",
            "error": {"code": "E_FAIL", "message": "failed"}
        }))
        .expect("openclaw-style invoke params should parse");
        assert_eq!(invoke_openclaw.id.as_deref(), Some("invoke-2"));
        assert_eq!(invoke_openclaw.node_id.as_deref(), Some("node-f"));
        assert_eq!(invoke_openclaw.ok, Some(false));
        assert!(invoke_openclaw.error.is_some());
    }

    #[test]
    fn stream_five_scope_normalization_is_stable() {
        let scopes = normalize_scopes(Some(vec![
            "gateway.write".to_string(),
            "gateway.read".to_string(),
            "gateway.write".to_string(),
            " ".to_string(),
        ]));
        assert_eq!(
            scopes,
            vec!["gateway.read".to_string(), "gateway.write".to_string()]
        );
    }

    #[tokio::test]
    async fn unknown_method_returns_none_without_database_access() {
        let pool = PgPoolOptions::new()
            .connect_lazy("postgres://user:pass@127.0.0.1:5432/map_test")
            .expect("lazy pool creation should succeed");

        let result = dispatch_with_pool(&pool, "stream5.not.real", json!({})).await;
        assert!(result.is_none());
    }
}
