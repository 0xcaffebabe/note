//! Claude 模型别名、选择器与允许列表的静态解析规则。

use crate::model::{ModelOption, MAX_MODELS_PER_PROVIDER};

/// 只从本地配置快照解析模型，不调用 CLI 或推测账户策略；别名必须显式映射。
pub(super) fn claude_models(
    value: &serde_json::Value,
    selected: &str,
) -> Result<(String, Vec<ModelOption>), String> {
    let get = |key: &str| {
        value
            .get("env")
            .and_then(|env| env.get(key))
            .and_then(serde_json::Value::as_str)
    };
    let resolve = |id: &str| resolve_claude_model(id, value);
    let mut models = Vec::new();
    let picker = value.get("modelPicker");
    let replace = picker
        .and_then(|picker| picker.get("replaceBuiltInOptions"))
        .and_then(serde_json::Value::as_bool)
        .unwrap_or(false);
    let selected = if selected.is_empty() {
        get("ANTHROPIC_DEFAULT_MODEL").unwrap_or("")
    } else {
        selected
    };
    let mut selected = if selected.is_empty() {
        String::new()
    } else {
        resolve(selected).ok_or("Claude 模型别名没有明确的本地映射；请填写服务支持的完整模型 ID")?
    };
    if !selected.is_empty() {
        push_named_model(&mut models, &selected, None)?;
    }
    if !replace {
        for family in ["SONNET", "OPUS", "HAIKU", "FABLE"] {
            let field = format!("ANTHROPIC_DEFAULT_{family}_MODEL");
            if let Some(id) = get(&field).and_then(resolve) {
                push_named_model(&mut models, &id, get(&format!("{field}_NAME")))?;
            }
        }
        for field in [
            "ANTHROPIC_SMALL_FAST_MODEL",
            "CLAUDE_CODE_SUBAGENT_MODEL",
            "ANTHROPIC_CUSTOM_MODEL_OPTION",
        ] {
            if let Some(id) = get(field).and_then(resolve) {
                let name = if field == "ANTHROPIC_CUSTOM_MODEL_OPTION" {
                    get("ANTHROPIC_CUSTOM_MODEL_OPTION_NAME")
                } else {
                    None
                };
                push_named_model(&mut models, &id, name)?;
            }
        }
        if let Some(overrides) = value
            .get("modelOverrides")
            .and_then(serde_json::Value::as_object)
        {
            if overrides.len() > MAX_MODELS_PER_PROVIDER {
                return Err("Claude 模型映射数量超过限制".into());
            }
            for id in overrides
                .values()
                .filter_map(serde_json::Value::as_str)
                .filter_map(resolve)
            {
                push_named_model(&mut models, &id, None)?;
            }
        }
    }
    if let Some(options) = picker.and_then(|picker| picker.get("options")) {
        let options = options
            .as_array()
            .ok_or("Claude modelPicker.options 必须为数组")?;
        if options.len() > MAX_MODELS_PER_PROVIDER {
            return Err("Claude 模型列表数量超过限制".into());
        }
        for row in options {
            if let Some(id) = row
                .get("model")
                .and_then(serde_json::Value::as_str)
                .and_then(resolve)
            {
                push_named_model(
                    &mut models,
                    &id,
                    row.get("label").and_then(serde_json::Value::as_str),
                )?;
            }
        }
    }
    // availableModels restricts entries; it does not enumerate deployments.
    if let Some(allowed) = value.get("availableModels") {
        let allowed = allowed
            .as_array()
            .ok_or("Claude availableModels 必须为数组")?;
        if allowed.len() > MAX_MODELS_PER_PROVIDER || allowed.iter().any(|entry| !entry.is_string())
        {
            return Err("Claude availableModels 格式无效或数量超过限制".into());
        }
        models.retain(|model| {
            allowed
                .iter()
                .filter_map(serde_json::Value::as_str)
                .any(|entry| claude_allowed(entry, &model.id))
        });
        if !selected.is_empty() && !models.iter().any(|model| model.id == selected) {
            return Err(
                "当前 Claude 模型不在此配置的 availableModels 范围内；请确认后手动配置".into(),
            );
        }
    }
    if selected.is_empty() {
        selected = models
            .first()
            .map(|model| model.id.clone())
            .unwrap_or_default();
    }
    Ok((selected, models))
}

/// 将别名解析到同文件的明确模型 ID，拒绝无法静态确定的动态别名。
pub(super) fn resolve_claude_model(id: &str, value: &serde_json::Value) -> Option<String> {
    let id = strip_context_marker(id.trim());
    let field = match id {
        "sonnet" => Some("ANTHROPIC_DEFAULT_SONNET_MODEL"),
        "opus" => Some("ANTHROPIC_DEFAULT_OPUS_MODEL"),
        "haiku" => Some("ANTHROPIC_DEFAULT_HAIKU_MODEL"),
        "fable" => Some("ANTHROPIC_DEFAULT_FABLE_MODEL"),
        "default" | "best" | "opusplan" | "inherit" => return None,
        _ => None,
    };
    let resolved = match field {
        Some(field) => value.get("env")?.get(field)?.as_str()?,
        None => id,
    };
    let resolved = strip_context_marker(resolved.trim());
    let resolved = value
        .get("modelOverrides")
        .and_then(|overrides| overrides.get(resolved))
        .and_then(serde_json::Value::as_str)
        .map(|model| strip_context_marker(model.trim()))
        .unwrap_or(resolved);
    if resolved.is_empty()
        || matches!(
            resolved,
            "sonnet" | "opus" | "haiku" | "fable" | "default" | "best" | "opusplan" | "inherit"
        )
    {
        return None;
    }
    Some(resolved.into())
}

/// 移除展示用的 [1m] 后缀，保留服务实际接受的模型 ID。
pub(super) fn strip_context_marker(id: &str) -> &str {
    if id
        .get(id.len().saturating_sub(4)..)
        .is_some_and(|marker| marker.eq_ignore_ascii_case("[1m]"))
    {
        id[..id.len() - 4].trim_end()
    } else {
        id
    }
}

/// availableModels 仅限制已发现模型，不用来推断服务端部署列表。
pub(super) fn claude_allowed(entry: &str, id: &str) -> bool {
    let id = strip_context_marker(id);
    let entry = strip_context_marker(entry);
    if matches!(entry, "sonnet" | "opus" | "haiku" | "fable") {
        return id.contains(&format!("claude-{entry}-"))
            || id.contains(&format!("claude-{entry}."));
    }
    id == entry
        || id
            .strip_prefix(entry)
            .is_some_and(|rest| rest.starts_with('-'))
}

fn push_named_model(
    models: &mut Vec<ModelOption>,
    id: &str,
    name: Option<&str>,
) -> Result<(), String> {
    let mut model = ModelOption::configured(id.to_string());
    if let Some(name) = name.filter(|name| !name.trim().is_empty()) {
        model.name = name.trim().into();
    }
    model.validate()?;
    if let Some(previous) = models.iter_mut().find(|previous| previous.id == model.id) {
        if previous.name == previous.id && model.name != model.id {
            previous.name = model.name;
        }
        return Ok(());
    }
    if models.len() >= MAX_MODELS_PER_PROVIDER {
        return Err("配置中的模型数量超过 200 个".into());
    }
    models.push(model);
    Ok(())
}
