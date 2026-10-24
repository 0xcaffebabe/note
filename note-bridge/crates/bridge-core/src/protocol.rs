//! Product protocol: authenticated session RPC, independent of Pi's internal wire format.
use serde::{Deserialize, Serialize};
use serde_json::Value;
pub const VERSION: u8 = 2;
pub const MAX_FRAME_BYTES: usize = 16 * 1024 * 1024;
pub const METHODS: &[&str] = &[
    "sessions.list",
    "sessions.create",
    "sessions.get",
    "sessions.archive",
    "messages.send",
    "runs.cancel",
    "session.subscribe",
    "session.unsubscribe",
    "knowledge.document",
];
#[derive(Deserialize)]
pub struct ClientFrame {
    pub v: u8,
    #[serde(flatten)]
    pub message: ClientMessage,
}
#[derive(Deserialize)]
#[serde(tag = "type", rename_all_fields = "camelCase")]
pub enum ClientMessage {
    #[serde(rename = "pair")]
    Pair { code: String },
    #[serde(rename = "auth")]
    Auth { token: String },
    #[serde(rename = "auth.forget")]
    AuthForget,
    #[serde(rename = "ping")]
    Ping,
    #[serde(rename = "request")]
    Request {
        id: String,
        method: String,
        #[serde(default)]
        params: Value,
    },
}
#[derive(Debug, Clone, Copy, Default, PartialEq, Eq, Deserialize, Serialize)]
#[serde(rename_all = "lowercase")]
pub enum Effort {
    #[default]
    Default,
    None,
    Minimal,
    Low,
    Medium,
    High,
    Xhigh,
    Max,
    Ultra,
}
pub fn valid_request(id: &str, method: &str, params: &Value) -> bool {
    !id.is_empty()
        && id.len() <= 80
        && id
            .bytes()
            .all(|b| b.is_ascii_alphanumeric() || b"_-:.".contains(&b))
        && METHODS.contains(&method)
        && params.is_object()
        && params.to_string().len() <= 128 * 1024
}
#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;
    #[test]
    fn rpc_is_bounded_and_does_not_expose_cli_commands() {
        assert!(valid_request(
            "r-1",
            "messages.send",
            &json!({"text":"hello"})
        ));
        for method in ["bash", "read", "configure", "initialize", "chat.start"] {
            assert!(!valid_request("r-1", method, &json!({})));
        }
        assert!(!valid_request("bad\n", "sessions.list", &json!({})));
        assert!(!valid_request("r-1", "sessions.list", &json!([])));
        assert!(!valid_request(
            "r-1",
            "messages.send",
            &json!({"text":"x".repeat(128*1024)})
        ));
    }
}
