use crate::{
    model::{
        ModelOption, MAX_CONTEXT_WINDOW_TOKENS, MAX_MODELS_PER_PROVIDER, MAX_OUTPUT_TOKENS,
        MIN_CONTEXT_WINDOW_TOKENS, MIN_OUTPUT_TOKENS,
    },
    protocol::Effort,
};
use serde_json::Value;
use std::collections::HashSet;

/// 解析 OpenAI/Anthropic 列表或本地 Codex 目录；只接受明确声明且满足预算约束的能力。
///
/// 不推断自定义模型的 effort 或价格，去重、过滤无效条目并限制返回数量。
pub fn parse_models(value: &Value) -> Result<Vec<ModelOption>, String> {
    nonempty(parse_model_page(value)?)
}

pub(super) fn nonempty(models: Vec<ModelOption>) -> Result<Vec<ModelOption>, String> {
    if models.is_empty() {
        Err("服务未返回可用的模型 ID，请手动配置或导入本地目录".into())
    } else {
        Ok(models)
    }
}

pub(super) fn parse_model_page(value: &Value) -> Result<Vec<ModelOption>, String> {
    let rows = value
        .get("data")
        .and_then(Value::as_array)
        .or_else(|| value.get("models").and_then(Value::as_array))
        .or_else(|| value.as_array())
        .ok_or("模型列表缺少 data 或 models 数组")?;
    let mut models = Vec::new();
    let mut seen = HashSet::new();
    for row in rows {
        if row.get("supported_in_api") == Some(&Value::Bool(false)) {
            continue;
        }
        if row
            .get("visibility")
            .and_then(Value::as_str)
            .is_some_and(|v| v != "list")
        {
            continue;
        }
        let Some(id) = row
            .get("slug")
            .or_else(|| row.get("id"))
            .and_then(Value::as_str)
            .map(str::trim)
        else {
            continue;
        };
        if id.is_empty() || id.len() > 256 || id.chars().any(char::is_control) || seen.contains(id)
        {
            continue;
        }
        let mut model = ModelOption::configured(id);
        apply_display_name(&mut model, row);
        apply_reasoning_capabilities(&mut model, row);
        apply_token_budgets(&mut model, row);
        if model.validate().is_ok() {
            seen.insert(id.to_string());
            models.push(model);
            if models.len() == MAX_MODELS_PER_PROVIDER {
                break;
            }
        }
    }
    Ok(models)
}

fn apply_display_name(model: &mut ModelOption, row: &Value) {
    if let Some(name) = row
        .get("display_name")
        .or_else(|| row.get("displayName"))
        .or_else(|| row.get("name"))
        .and_then(Value::as_str)
        .map(str::trim)
    {
        if !name.is_empty() && name.len() <= 120 && !name.chars().any(char::is_control) {
            model.name = name.to_string();
        }
    }
}

fn apply_reasoning_capabilities(model: &mut ModelOption, row: &Value) {
    if let Some(efforts) = row
        .get("supported_reasoning_levels")
        .or_else(|| row.get("reasoningLevels"))
        .or_else(|| row.get("efforts"))
        .and_then(Value::as_array)
    {
        for entry in efforts {
            if let Ok(effort) =
                serde_json::from_value::<Effort>(entry.get("effort").unwrap_or(entry).clone())
            {
                if !model.efforts.contains(&effort) {
                    model.efforts.push(effort);
                }
            }
        }
    }
    model.default_effort = row
        .get("default_reasoning_level")
        .or_else(|| row.get("defaultReasoningLevel"))
        .or_else(|| row.get("defaultEffort"))
        .and_then(|value| serde_json::from_value::<Effort>(value.clone()).ok())
        .filter(|effort| model.supports_effort(*effort));
}

fn apply_token_budgets(model: &mut ModelOption, row: &Value) {
    model.context_window_tokens = row
        .get("context_window")
        .or_else(|| row.get("context_length"))
        .or_else(|| row.get("contextWindowTokens"))
        .and_then(Value::as_u64)
        .and_then(|value| u32::try_from(value).ok())
        .filter(|value| (MIN_CONTEXT_WINDOW_TOKENS..=MAX_CONTEXT_WINDOW_TOKENS).contains(value));
    model.max_output_tokens = row
        .get("max_output_tokens")
        .or_else(|| row.get("maxOutputTokens"))
        .and_then(Value::as_u64)
        .and_then(|value| u32::try_from(value).ok())
        .filter(|value| {
            (MIN_OUTPUT_TOKENS..=MAX_OUTPUT_TOKENS).contains(value)
                && *value <= model.effective_context_window_tokens() / 2
        });
}
