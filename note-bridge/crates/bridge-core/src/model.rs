use crate::protocol::Effort;
use serde::{Deserialize, Serialize};
use std::collections::HashSet;
use url::{Host, Url};

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum Protocol {
    Anthropic,
    Responses,
    ChatCompletions,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum AuthKind {
    ApiKey,
    Bearer,
    None,
}

pub const MAX_MODELS_PER_PROVIDER: usize = 200;
pub const MAX_MODELS_TOTAL: usize = 400;

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct ModelOption {
    pub id: String,
    pub name: String,
    #[serde(default)]
    pub efforts: Vec<Effort>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub default_effort: Option<Effort>,
}

impl ModelOption {
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
        }
    }

    pub fn validate(&self) -> Result<(), String> {
        for (value, limit) in [(&self.id, 256), (&self.name, 120)] {
            if value.trim().is_empty()
                || value.trim() != value
                || value.len() > limit
                || value.chars().any(char::is_control)
            {
                return Err("模型 ID 或名称为空、过长或含非法字符".into());
            }
        }
        if self.efforts.len() > 9
            || self
                .efforts
                .iter()
                .enumerate()
                .any(|(i, value)| self.efforts[..i].contains(value))
        {
            return Err("模型思考强度列表无效".into());
        }
        if self
            .default_effort
            .is_some_and(|effort| effort != Effort::Default && !self.efforts.contains(&effort))
        {
            return Err("模型默认思考强度不在可用列表中".into());
        }
        Ok(())
    }

    pub fn supports_effort(&self, effort: Effort) -> bool {
        effort == Effort::Default || self.efforts.contains(&effort)
    }
}

pub fn validate_models(models: &[ModelOption], default_model: &str) -> Result<(), String> {
    if models.len() > MAX_MODELS_PER_PROVIDER {
        return Err("每个服务最多配置 200 个模型".into());
    }
    let mut ids = HashSet::new();
    for model in models {
        model.validate()?;
        if !ids.insert(&model.id) {
            return Err("模型 ID 不能重复".into());
        }
    }
    if !models.is_empty() && !models.iter().any(|model| model.id == default_model) {
        return Err("默认模型必须在模型列表中".into());
    }
    Ok(())
}

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

// Intentionally not Debug: API keys must never be included in diagnostic output.
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

    pub fn accepts_model(&self, id: &str, effort: Effort) -> bool {
        self.model_options()
            .iter()
            .any(|model| model.id == id && model.supports_effort(effort))
    }

    pub fn validate(&self) -> Result<(), String> {
        validate_id(&self.id)?;
        validate_models(&self.models, &self.model)?;
        validate_fields(
            &self.name,
            &self.base_url,
            &self.model,
            self.source.as_deref(),
        )
    }
}

impl ProviderInput {
    pub fn validate(&self) -> Result<(), String> {
        if let Some(id) = &self.id {
            validate_id(id)?;
        }
        validate_models(&self.models, &self.model)?;
        validate_fields(
            &self.name,
            &self.base_url,
            &self.model,
            self.source.as_deref(),
        )?;
        if let Some(key) = &self.api_key {
            validate_secret(key)?;
            if self.auth_kind == AuthKind::None {
                return Err("无需认证的配置不能包含凭据".into());
            }
        }
        Ok(())
    }
}

pub fn validate_id(id: &str) -> Result<(), String> {
    let parsed = uuid::Uuid::parse_str(id).map_err(|_| "配置 ID 无效".to_string())?;
    if parsed.to_string() != id {
        return Err("配置 ID 必须为标准 UUID".into());
    }
    Ok(())
}

pub fn validate_secret(secret: &str) -> Result<(), String> {
    if secret.trim().is_empty() || secret.len() > 16_384 || secret.chars().any(char::is_control) {
        return Err("凭据为空、过长或包含控制字符".into());
    }
    Ok(())
}

pub fn validate_base_url(base_url: &str) -> Result<(), String> {
    if base_url.len() > 2_048
        || base_url.trim() != base_url
        || base_url.chars().any(char::is_control)
    {
        return Err("服务地址过长或包含非法空白字符".into());
    }
    let url = Url::parse(base_url).map_err(|_| "服务地址不是有效 URL".to_string())?;
    let explicit_userinfo = base_url.split_once("://").is_some_and(|(_, rest)| {
        rest.split(['/', '?', '#'])
            .next()
            .is_some_and(|authority| authority.contains('@'))
    });
    if explicit_userinfo
        || !url.username().is_empty()
        || url.password().is_some()
        || url.query().is_some()
        || url.fragment().is_some()
    {
        return Err("服务地址不能包含用户名、密码、查询参数或片段".into());
    }
    let loopback = match url.host() {
        Some(Host::Domain(domain)) => domain.eq_ignore_ascii_case("localhost"),
        Some(Host::Ipv4(ip)) => ip.is_loopback(),
        Some(Host::Ipv6(ip)) => ip.is_loopback(),
        None => return Err("服务地址缺少主机名".into()),
    };
    match url.scheme() {
        "https" => Ok(()),
        "http" if loopback => Ok(()),
        _ => Err("远程服务必须使用 HTTPS；HTTP 仅允许本机回环地址".into()),
    }
}

fn validate_fields(
    name: &str,
    base_url: &str,
    model: &str,
    source: Option<&str>,
) -> Result<(), String> {
    for (value, label, max_len) in [(name, "名称", 120), (model, "模型", 256)] {
        if value.trim().is_empty() || value.len() > max_len || value.chars().any(char::is_control) {
            return Err(format!("{label}为空、过长或包含控制字符"));
        }
    }
    if let Some(source) = source {
        if source.len() > 4_096 || source.chars().any(char::is_control) {
            return Err("配置来源无效".into());
        }
    }
    validate_base_url(base_url)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn allows_https_and_loopback_http_only() {
        for url in [
            "https://api.example.com/v1",
            "http://127.0.0.1:1234/v1",
            "http://[::1]:1234",
            "http://localhost:8000",
        ] {
            assert!(validate_base_url(url).is_ok(), "{url}");
        }
        for url in [
            "http://example.com",
            "http://192.168.1.2",
            "ftp://localhost",
            "https://user:secret@example.com",
            "https://@example.com",
            "https://example.com?api_key=secret",
            "https://example.com#secret",
            " https://example.com",
            "https://example.com\n",
        ] {
            assert!(validate_base_url(url).is_err(), "{url}");
        }
    }

    #[test]
    fn rejects_arbitrary_keyring_identifiers_and_control_characters() {
        assert!(validate_id("00000000-0000-4000-8000-000000000001").is_ok());
        assert!(validate_id("../../other-service").is_err());
        assert!(validate_secret("test-only-key\r\nHeader: value").is_err());
    }
}
