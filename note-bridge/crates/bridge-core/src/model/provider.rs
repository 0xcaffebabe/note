use super::option::ModelOption;
use super::validation::{validate_provider, validate_provider_input};
use crate::protocol::Effort;
use serde::{Deserialize, Serialize};

/// 模型服务的 HTTP 协议，与网站和 Node worker 的序列化值保持一致。
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum Protocol {
    Anthropic,
    Responses,
    ChatCompletions,
}

/// 凭据认证方式；None 表示无需认证并明确清除原凭据。
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum AuthKind {
    ApiKey,
    Bearer,
    None,
}

/// 不含密钥的模型服务配置，可安全返回管理界面或持久化为 JSON。
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct Provider {
    pub id: String,
    pub name: String,
    pub protocol: Protocol,
    pub base_url: String,
    pub model: String,
    #[serde(default)]
    pub models: Vec<ModelOption>,
    pub auth_kind: AuthKind,
    pub enabled: bool,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub source: Option<String>,
}

/// 新建或编辑服务的输入。省略 api_key 表示保留原凭据。
///
/// 有意不实现 Debug，避免 API 密钥进入诊断输出。
#[derive(Clone, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct ProviderInput {
    pub id: Option<String>,
    pub name: String,
    pub protocol: Protocol,
    pub base_url: String,
    pub model: String,
    #[serde(default)]
    pub models: Vec<ModelOption>,
    pub auth_kind: AuthKind,
    #[serde(default = "enabled_by_default")]
    pub enabled: bool,
    pub api_key: Option<String>,
    #[serde(default)]
    pub source: Option<String>,
}

fn enabled_by_default() -> bool {
    true
}

impl Provider {
    /// 返回网站可选择的模型；单模型旧配置补齐默认模型，多模型列表补齐默认强度。
    pub fn model_options(&self) -> Vec<ModelOption> {
        if self.models.is_empty() {
            let mut model = ModelOption::configured(self.model.clone());
            model.efforts = vec![Effort::Default, Effort::Low, Effort::Medium, Effort::High];
            vec![model]
        } else {
            self.models
                .iter()
                .cloned()
                .map(|mut model| {
                    if !model.efforts.contains(&Effort::Default) {
                        model.efforts.insert(0, Effort::Default);
                    }
                    model
                })
                .collect()
        }
    }

    /// 校验请求中的模型 ID 与显式思考强度是否属于该服务。
    pub fn accepts_model(&self, id: &str, effort: Effort) -> bool {
        self.model_options()
            .iter()
            .any(|model| model.id == id && model.supports_effort(effort))
    }

    /// 校验可持久化的服务元数据，不读取凭据库。
    pub fn validate(&self) -> Result<(), String> {
        validate_provider(self)
    }
}

impl ProviderInput {
    /// 在写入凭据或配置之前验证完整输入，拒绝无需认证却携带密钥的配置。
    pub fn validate(&self) -> Result<(), String> {
        validate_provider_input(self)
    }
}
