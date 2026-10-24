use super::limits::{DEFAULT_CONTEXT_WINDOW_TOKENS, DEFAULT_MAX_OUTPUT_TOKENS};
use super::validation::validate_model_option;
use crate::protocol::Effort;
use serde::{Deserialize, Serialize};

/// 服务声明的单个模型能力；省略预算时使用 bridge 的自适应默认值。
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct ModelOption {
    pub id: String,
    pub name: String,
    #[serde(default)]
    pub efforts: Vec<Effort>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub default_effort: Option<Effort>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub context_window_tokens: Option<u32>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub max_output_tokens: Option<u32>,
}

impl ModelOption {
    /// 从服务商模型 ID 生成最小配置，显示名称按 UTF-8 字节安全截断。
    pub fn configured(id: impl Into<String>) -> Self {
        let id = id.into();
        Self {
            name: id
                .chars()
                .scan(0, |bytes, ch| {
                    *bytes += ch.len_utf8();
                    (*bytes <= 120).then_some(ch)
                })
                .collect(),
            id,
            efforts: vec![Effort::Default],
            default_effort: None,
            context_window_tokens: None,
            max_output_tokens: None,
        }
    }

    /// 返回实际采用的上下文窗口，不改变持久化的可选字段。
    pub fn effective_context_window_tokens(&self) -> u32 {
        self.context_window_tokens
            .unwrap_or(DEFAULT_CONTEXT_WINDOW_TOKENS)
    }

    /// 小窗口模型的默认输出最多占上下文的一半。
    pub fn effective_max_output_tokens(&self) -> u32 {
        self.max_output_tokens.unwrap_or_else(|| {
            DEFAULT_MAX_OUTPUT_TOKENS.min(self.effective_context_window_tokens() / 2)
        })
    }

    /// 校验模型标识、预算和思考强度之间的一致性。
    pub fn validate(&self) -> Result<(), String> {
        validate_model_option(self)
    }

    /// 默认强度始终可用；显式强度必须由服务能力列表声明。
    pub fn supports_effort(&self, effort: Effort) -> bool {
        effort == Effort::Default || self.efforts.contains(&effort)
    }
}
