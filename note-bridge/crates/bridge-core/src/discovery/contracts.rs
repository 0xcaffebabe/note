use crate::model::{AuthKind, ModelOption, Protocol};
use serde::{Deserialize, Serialize};

/// 显式扫描的配置目录；缺省时使用对应 CLI 的目录约定。
#[derive(Clone, Default, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DiscoveryPaths {
    pub claude_dir: Option<String>,
    pub codex_dir: Option<String>,
}

/// 扫描候选的可导入状态，不包含文件内容或凭据诊断。
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub enum DiscoveryStatus {
    /// 端点、模型和凭据均通过校验，可由用户选择导入。
    Ready,
    /// 配置可识别，但缺少此端点对应的凭据。
    MissingCredential,
    /// 存在无法安全静态解析或当前直连协议不支持的配置。
    Unsupported,
    /// 配置格式、字段或资源不符合导入契约。
    Invalid,
}

/// 本地扫描候选及可展示的来源元数据。
///
/// 故意不实现 Debug；凭据、指纹仅供本地导入，不序列化给 WebView。
#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DiscoveredProvider {
    pub id: String,
    pub name: String,
    pub protocol: Protocol,
    #[serde(serialize_with = "super::candidate::serialize_discovered_base_url")]
    pub base_url: String,
    pub model: String,
    pub models: Vec<ModelOption>,
    pub auth_kind: AuthKind,
    pub source: String,
    pub status: DiscoveryStatus,
    pub message: String,
    #[serde(skip)]
    pub fingerprint: String,
    #[serde(skip)]
    pub(super) catalog_fingerprint: String,
    #[serde(skip)]
    pub api_key: Option<String>,
}

/// Codex 本地认证分类；OAuth 只标记为不可复用，不读取其令牌。
#[derive(Clone)]
pub(super) enum CodexAuth {
    Key(String),
    Missing,
    OAuth,
    Invalid,
}
