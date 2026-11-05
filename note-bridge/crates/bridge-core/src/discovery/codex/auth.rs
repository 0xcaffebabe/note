//! Codex 认证来源判定，避免把凭据配对到无关服务。

use super::super::contracts::{CodexAuth, DiscoveredProvider, DiscoveryStatus};
use crate::model::AuthKind;

/// 区分 API key、缺失、OAuth 与非法认证配置；不会从 OAuth 对象提取凭据。
pub(in crate::discovery) fn parse_codex_auth(raw: Option<&str>) -> CodexAuth {
    let Some(raw) = raw else {
        return CodexAuth::Missing;
    };
    let Ok(value) = serde_json::from_str::<serde_json::Value>(raw) else {
        return CodexAuth::Invalid;
    };
    let mode = value.get("auth_mode").and_then(serde_json::Value::as_str);
    if matches!(mode, Some("chatgpt" | "chatgptAuthTokens"))
        || value.get("tokens").is_some_and(|tokens| !tokens.is_null())
    {
        return CodexAuth::OAuth;
    }
    if mode.is_some() && mode != Some("apikey") {
        return CodexAuth::Invalid;
    }
    match value
        .get("OPENAI_API_KEY")
        .and_then(serde_json::Value::as_str)
        .filter(|key| !key.trim().is_empty())
    {
        Some(key) => CodexAuth::Key(key.into()),
        None => CodexAuth::Missing,
    }
}

/// 为已确定端点的候选解析凭据，保留显式 token、env_key、OpenAI 认证的优先顺序。
/// 自定义端点必须显式选择认证来源，OAuth 永远不会复用到直连 API。
pub(super) fn apply_credentials(
    provider_id: &str,
    provider: Option<&toml::Value>,
    auth: &CodexAuth,
    env: &dyn Fn(&str) -> Option<String>,
    result: &mut DiscoveredProvider,
) {
    let get = |key: &str| {
        provider
            .and_then(|provider| provider.get(key))
            .and_then(toml::Value::as_str)
    };
    let default_openai_endpoint = provider_id == "openai"
        && result.base_url.trim_end_matches('/') == "https://api.openai.com/v1";
    let requires_openai_auth = provider
        .and_then(|provider| provider.get("requires_openai_auth"))
        .and_then(toml::Value::as_bool)
        .unwrap_or(default_openai_endpoint);
    if let Some(token) = get("experimental_bearer_token") {
        // cc-switch 的 PROXY_MANAGED token 只配对同一 provider 的代理 URL。
        if get("env_key").is_some() || requires_openai_auth {
            result.status = DiscoveryStatus::Unsupported;
            result.message = "显式 bearer token 与其他认证来源冲突；请手动确认认证方式".into();
        } else if crate::model::validate_secret(token).is_err() {
            result.message = "显式 bearer token 格式无效".into();
        } else {
            result.api_key = Some(token.into());
            result.auth_kind = AuthKind::Bearer;
        }
    } else if let Some(env_key) = get("env_key") {
        if env_key.is_empty()
            || env_key.len() > 256
            || !env_key
                .chars()
                .all(|c| c.is_ascii_alphanumeric() || c == '_')
        {
            result.message = "env_key 不是有效的环境变量名".into();
        } else {
            result.api_key = env(env_key).filter(|key| !key.trim().is_empty());
        }
    } else if requires_openai_auth {
        // 自定义端点必须显式开启 requires_openai_auth，才能使用 auth.json。
        match auth {
            CodexAuth::Key(key) => result.api_key = Some(key.clone()),
            CodexAuth::Missing if provider_id == "openai" => {
                result.api_key = env("OPENAI_API_KEY").filter(|key| !key.trim().is_empty())
            }
            CodexAuth::Missing => {}
            CodexAuth::OAuth => {
                result.status = DiscoveryStatus::Unsupported;
                result.message =
                    "检测到 Codex ChatGPT/OAuth 登录；不会提取或复用登录令牌，请配置 API key"
                        .into();
            }
            CodexAuth::Invalid => result.message = "auth.json 无效或认证模式无法安全识别".into(),
        }
    } else {
        // 仅本机回环端点允许明确不使用凭据；远端缺少 env_key 需要手动配置。
        if result.base_url.starts_with("http://")
            && crate::model::validate_base_url(&result.base_url).is_ok()
        {
            result.auth_kind = AuthKind::None;
        }
    }
}
