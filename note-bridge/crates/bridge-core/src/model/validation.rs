use super::endpoint::validate_base_url;
use super::limits::{validate_token_budgets, MAX_MODELS_PER_PROVIDER};
use super::option::ModelOption;
use super::provider::{AuthKind, Provider, ProviderInput};
use crate::protocol::Effort;
use std::collections::HashSet;

/// 校验目录容量、模型唯一性和默认模型归属；空列表保留单模型配置的既有语义。
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

/// 校验标准小写 UUID，防止任意字符串成为系统凭据库条目名称。
pub fn validate_id(id: &str) -> Result<(), String> {
    let parsed = uuid::Uuid::parse_str(id).map_err(|_| "配置 ID 无效".to_string())?;
    if parsed.to_string() != id {
        return Err("配置 ID 必须为标准 UUID".into());
    }
    Ok(())
}

/// 验证凭据大小和控制字符；错误信息不包含凭据原文。
pub fn validate_secret(secret: &str) -> Result<(), String> {
    if secret.trim().is_empty() || secret.len() > 16_384 || secret.chars().any(char::is_control) {
        return Err("凭据为空、过长或包含控制字符".into());
    }
    Ok(())
}

pub(super) fn validate_model_option(model: &ModelOption) -> Result<(), String> {
    validate_token_budgets(
        model.effective_context_window_tokens(),
        model.effective_max_output_tokens(),
    )?;
    for (value, limit) in [(&model.id, 256), (&model.name, 120)] {
        if value.trim().is_empty()
            || value.trim() != value
            || value.len() > limit
            || value.chars().any(char::is_control)
        {
            return Err("模型 ID 或名称为空、过长或含非法字符".into());
        }
    }
    if model.efforts.len() > 9
        || model
            .efforts
            .iter()
            .enumerate()
            .any(|(i, value)| model.efforts[..i].contains(value))
    {
        return Err("模型思考强度列表无效".into());
    }
    if model
        .default_effort
        .is_some_and(|effort| effort != Effort::Default && !model.efforts.contains(&effort))
    {
        return Err("模型默认思考强度不在可用列表中".into());
    }
    Ok(())
}

pub(super) fn validate_provider(provider: &Provider) -> Result<(), String> {
    validate_id(&provider.id)?;
    validate_models(&provider.models, &provider.model)?;
    validate_fields(
        &provider.name,
        &provider.base_url,
        &provider.model,
        provider.source.as_deref(),
    )
}

pub(super) fn validate_provider_input(input: &ProviderInput) -> Result<(), String> {
    if let Some(id) = &input.id {
        validate_id(id)?;
    }
    validate_models(&input.models, &input.model)?;
    validate_fields(
        &input.name,
        &input.base_url,
        &input.model,
        input.source.as_deref(),
    )?;
    if let Some(key) = &input.api_key {
        validate_secret(key)?;
        if input.auth_kind == AuthKind::None {
            return Err("无需认证的配置不能包含凭据".into());
        }
    }
    Ok(())
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
