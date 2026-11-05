use crate::model::Provider;
use serde::{Deserialize, Serialize};

/// 限时单次配对码，成功认证后立即消费。
#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PairingWindow {
    pub code: String,
    pub expires_at: u64,
}

/// 临时 WebSocket 连接摘要，与持久授权分离。
#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ConnectionInfo {
    pub id: String,
    pub origin: String,
    pub connected_at: u64,
}

/// 可公开的授权摘要，不包含令牌或令牌摘要。
#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AuthorizationInfo {
    pub id: String,
    pub origin: String,
    pub created_at: u64,
    pub last_connected_at: u64,
    pub connected: bool,
}

/// bridge 生成的诊断摘要，禁止记录凭据或聊天正文。
#[derive(Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct LogEntry {
    pub timestamp: u64,
    pub level: String,
    pub message: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub request_id: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub provider_id: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub model: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub duration_ms: Option<u64>,
}

/// 桌面只读状态投影，不暴露内部锁与模型凭据。
#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Snapshot {
    pub running: bool,
    pub port: u16,
    pub allowed_origins: Vec<String>,
    pub providers: Vec<Provider>,
    pub pairing: Option<PairingWindow>,
    pub connections: Vec<ConnectionInfo>,
    pub authorizations: Vec<AuthorizationInfo>,
    pub logs: Vec<LogEntry>,
}
