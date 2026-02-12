use crate::error::ApiError;

pub(crate) mod skills_ext;

#[derive(Debug)]
pub(crate) enum WsMethodError {
    InvalidRequest(String),
    Unavailable(String),
    Api(ApiError),
}

impl From<ApiError> for WsMethodError {
    fn from(value: ApiError) -> Self {
        Self::Api(value)
    }
}

pub(crate) mod cron_control;
pub(crate) mod media_tools;
pub(crate) mod nodes_device;
pub(crate) mod system_runtime;

pub(crate) mod web_login;

pub(crate) fn canonical_ws_method(method: &str) -> Option<&'static str> {
    Some(match method {
        "agent.identity.get" | "agent/identity/get" => "agent.identity.get",
        "browser.request" | "browser/request" => "browser.request",
        "cron.status" | "cron/status" => "cron.status",
        "cron.update" | "cron/update" => "cron.update",
        "device.pair.approve" | "device/pair/approve" => "device.pair.approve",
        "device.pair.list" | "device/pair/list" => "device.pair.list",
        "device.pair.reject" | "device/pair/reject" => "device.pair.reject",
        "device.token.revoke" | "device/token/revoke" => "device.token.revoke",
        "device.token.rotate" | "device/token/rotate" => "device.token.rotate",
        "last-heartbeat" | "last.heartbeat" => "last-heartbeat",
        "node.invoke.result" | "node/invoke/result" => "node.invoke.result",
        "node.pair.list" | "node/pair/list" | "nodes.pair.list" => "node.pair.list",
        "node.rename" | "node/rename" => "node.rename",
        "sessions.compact" | "sessions/compact" => "sessions.compact",
        "sessions.delete" | "sessions/delete" => "sessions.delete",
        "sessions.preview" | "sessions/preview" => "sessions.preview",
        "sessions.usage" | "sessions/usage" => "sessions.usage",
        "sessions.usage.logs" | "sessions/usage/logs" => "sessions.usage.logs",
        "sessions.usage.timeseries" | "sessions/usage/timeseries" => "sessions.usage.timeseries",
        "set-heartbeats" | "set.heartbeats" => "set-heartbeats",
        "skills.bins" | "skills/bins" => "skills.bins",
        "skills.install" | "skills/install" => "skills.install",
        "skills.update" | "skills/update" => "skills.update",
        "system-event" | "system.event" => "system-event",
        "system-presence" | "system.presence" => "system-presence",
        "talk.mode" | "talk/mode" => "talk.mode",
        "tts.convert" | "tts/convert" => "tts.convert",
        "tts.disable" | "tts/disable" => "tts.disable",
        "tts.enable" | "tts/enable" => "tts.enable",
        "tts.providers" | "tts/providers" => "tts.providers",
        "tts.setProvider" | "tts/setProvider" | "tts.set-provider" | "tts.set_provider" => {
            "tts.setProvider"
        }
        "tts.status" | "tts/status" => "tts.status",
        "update.run" | "update/run" => "update.run",
        "usage.cost" | "usage/cost" => "usage.cost",
        "usage.status" | "usage/status" => "usage.status",
        "voicewake.get" | "voicewake/get" => "voicewake.get",
        "voicewake.set" | "voicewake/set" => "voicewake.set",
        "web.login.start" | "web/login/start" => "web.login.start",
        "web.login.wait" | "web/login/wait" => "web.login.wait",
        _ => return None,
    })
}

#[cfg_attr(not(test), allow(dead_code))]
pub(crate) fn is_unavailable_stub_method(method: &str) -> bool {
    let _ = method;
    false
}
