//! Claude 配置入口；模型映射规则由 claude_models 负责。

use super::candidate::{candidate, failure, finish};
use super::claude_models::claude_models;
use super::contracts::{DiscoveredProvider, DiscoveryStatus};
use crate::model::{AuthKind, Protocol};

/// 解析同一份 Claude settings.json 中的端点、模型和认证。
///
/// 只接受该文件 env 对象内的凭据，不借用进程环境或其他文件；不执行 helper。
pub fn parse_claude_settings(raw: &str, source: &str) -> DiscoveredProvider {
    let value: serde_json::Value = match serde_json::from_str(raw) {
        Ok(value) => value,
        Err(_) => {
            return failure(
                "Claude Code",
                Protocol::Anthropic,
                source,
                "Claude settings.json 格式无效",
                raw,
            )
        }
    };
    if !value.is_object() {
        return failure(
            "Claude Code",
            Protocol::Anthropic,
            source,
            "Claude 配置必须为 JSON 对象",
            raw,
        );
    }
    let mut result = candidate("Claude Code", Protocol::Anthropic, source, raw);
    let env = value.get("env").and_then(serde_json::Value::as_object);
    let env_str = |key: &str| {
        env.and_then(|env| env.get(key))
            .and_then(serde_json::Value::as_str)
            .filter(|s| !s.is_empty())
    };
    result.base_url = env_str("ANTHROPIC_BASE_URL")
        .unwrap_or("https://api.anthropic.com")
        .into();
    result.model = env_str("ANTHROPIC_MODEL")
        .or_else(|| value.get("model").and_then(serde_json::Value::as_str))
        .unwrap_or("")
        .into();
    match claude_models(&value, &result.model) {
        Ok((selected, models)) => {
            result.model = selected;
            result.models = models;
        }
        Err(message) => {
            result.status = DiscoveryStatus::Unsupported;
            result.message = message;
        }
    }
    let api_key = env_str("ANTHROPIC_API_KEY");
    let auth_token = env_str("ANTHROPIC_AUTH_TOKEN");
    if api_key.is_some() && auth_token.is_some() {
        result.message =
            "同时存在 API_KEY 与 AUTH_TOKEN，无法确定有效认证方式；请手动创建配置".into();
        return finish(result, raw);
    }
    result.auth_kind = if auth_token.is_some() {
        AuthKind::Bearer
    } else {
        AuthKind::ApiKey
    };
    result.api_key = api_key.or(auth_token).map(String::from);
    if result.api_key.is_none() && value.get("apiKeyHelper").is_some() {
        result.status = DiscoveryStatus::Unsupported;
        result.message = "检测到 apiKeyHelper；为避免执行本地命令，请手动填写 API 凭据".into();
    }
    finish(result, raw)
}
