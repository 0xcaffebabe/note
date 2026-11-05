//! 面向站点的 v2 产品协议，与 Pi 内部消息和 worker 私有 IPC 独立演进。
//! 此模块只定义线协议及请求形状；配对、授权和任务生命周期由网关执行。
use serde::{Deserialize, Serialize};
use serde_json::Value;

/// 站点协议版本；与 Pi SDK 或 SQLite 文档版本无关。
pub const VERSION: u8 = 2;

/// WebSocket 完整消息的传输上限；业务请求参数仍受更小的准入上限约束。
pub const MAX_FRAME_BYTES: usize = 16 * 1024 * 1024;

/// 认证后的站点调用白名单，不包含宿主配置、CLI 或任意工具执行入口。
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

const MAX_REQUEST_ID_BYTES: usize = 80;
const MAX_REQUEST_PARAMS_BYTES: usize = 128 * 1024;

/// 来自浏览器的协议帧；反序列化成功不代表已通过版本和授权检查。
#[derive(Deserialize)]
pub struct ClientFrame {
    pub v: u8,
    #[serde(flatten)]
    pub message: ClientMessage,
}

/// 配对、认证和会话 RPC 的线协议；Request 只能在网关认证成功后转发。
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

/// 用户选择的推理强度。Default 表示省略上游参数，不等价于显式关闭推理。
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

/// 检查站点 RPC 的标识、方法和参数体积；不执行授权或读取业务状态。
pub fn valid_request(id: &str, method: &str, params: &Value) -> bool {
    !id.is_empty()
        && id.len() <= MAX_REQUEST_ID_BYTES
        && id
            .bytes()
            .all(|b| b.is_ascii_alphanumeric() || b"_-:.".contains(&b))
        && METHODS.contains(&method)
        && params.is_object()
        && params.to_string().len() <= MAX_REQUEST_PARAMS_BYTES
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
