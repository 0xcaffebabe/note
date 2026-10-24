//! Read-only model discovery using the selected provider's endpoint and credentials.
//! A catalog is only a set of candidates: native UI selection and save make models available.
use crate::{
    model::{
        AuthKind, ModelOption, Protocol, Provider, MAX_CONTEXT_WINDOW_TOKENS,
        MAX_MODELS_PER_PROVIDER, MAX_OUTPUT_TOKENS, MIN_CONTEXT_WINDOW_TOKENS, MIN_OUTPUT_TOKENS,
    },
    protocol::Effort,
};
use futures_util::StreamExt;
use serde_json::Value;
use std::{collections::HashSet, time::Duration};

const MAX_CATALOG_BYTES: usize = 1024 * 1024;
const FETCH_TIMEOUT: Duration = Duration::from_secs(15);

pub async fn fetch(
    client: &reqwest::Client,
    provider: &Provider,
    secret: Option<&str>,
) -> Result<Vec<ModelOption>, String> {
    tokio::time::timeout(FETCH_TIMEOUT, fetch_inner(client, provider, secret))
        .await
        .map_err(|_| "读取模型列表超时，现有模型未修改".to_string())?
}

async fn fetch_inner(
    client: &reqwest::Client,
    provider: &Provider,
    secret: Option<&str>,
) -> Result<Vec<ModelOption>, String> {
    let base = provider.base_url.trim_end_matches('/');
    let suffix = if provider.protocol == Protocol::Anthropic && !base.ends_with("/v1") {
        "/v1/models"
    } else {
        "/models"
    };
    let mut request = client
        .get(format!("{base}{suffix}"))
        .header("accept", "application/json");
    if provider.protocol == Protocol::Anthropic {
        request = request.header("anthropic-version", "2023-06-01");
    }
    if provider.auth_kind != AuthKind::None {
        let secret = secret.ok_or("请先配置服务凭据")?;
        request =
            if provider.protocol == Protocol::Anthropic && provider.auth_kind == AuthKind::ApiKey {
                request.header("x-api-key", secret)
            } else {
                request.bearer_auth(secret)
            };
    }
    let mut after: Option<String> = None;
    let mut seen_cursors = HashSet::new();
    let mut models = Vec::new();
    let mut consumed_bytes = 0;
    loop {
        let mut page = request.try_clone().ok_or("无法初始化模型列表请求")?;
        if let Some(after) = &after {
            page = page.query(&[("after_id", after)]);
        }
        let response = page
            .send()
            .await
            .map_err(|_| "无法连接模型列表接口，现有模型未修改")?;
        if !response.status().is_success() {
            return Err(match response.status().as_u16() {
                401 | 403 => "模型列表认证失败，请检查当前服务的凭据和权限",
                404 | 405 => "此服务不提供模型列表接口，请手动配置模型 ID 或导入本地模型目录",
                429 => "模型列表请求过于频繁，请稍后重试",
                300..=399 => "模型列表接口发生重定向；为保护凭据，请直接配置服务地址",
                _ => "模型列表接口返回错误，现有模型未修改",
            }
            .into());
        }
        if response
            .content_length()
            .is_some_and(|size| size > (MAX_CATALOG_BYTES - consumed_bytes) as u64)
        {
            return Err("模型列表超过 1 MiB 上限".into());
        }
        let mut bytes = Vec::new();
        let mut stream = response.bytes_stream();
        while let Some(chunk) = stream.next().await {
            let chunk = chunk.map_err(|_| "读取模型列表失败")?;
            consumed_bytes += chunk.len();
            if consumed_bytes > MAX_CATALOG_BYTES {
                return Err("模型列表超过 1 MiB 上限".into());
            }
            bytes.extend_from_slice(&chunk);
        }
        let value: Value = serde_json::from_slice(&bytes).map_err(|_| "模型列表不是有效 JSON")?;
        for model in parse_model_page(&value)? {
            if !models
                .iter()
                .any(|existing: &ModelOption| existing.id == model.id)
            {
                models.push(model);
            }
            if models.len() == MAX_MODELS_PER_PROVIDER {
                return Ok(models);
            }
        }
        // Anthropic's public list API paginates; never follow server-provided URLs.
        if provider.protocol != Protocol::Anthropic
            || value.get("has_more") != Some(&Value::Bool(true))
        {
            return nonempty(models);
        }
        let cursor = value
            .get("last_id")
            .and_then(Value::as_str)
            .filter(|id| !id.is_empty() && id.len() <= 256 && !id.chars().any(char::is_control))
            .ok_or("模型列表分页标识无效")?;
        if !seen_cursors.insert(cursor.to_string()) || seen_cursors.len() > 20 {
            return Err("模型列表分页重复或超过上限".into());
        }
        after = Some(cursor.to_string());
    }
}

pub fn parse_models(value: &Value) -> Result<Vec<ModelOption>, String> {
    nonempty(parse_model_page(value)?)
}

fn nonempty(models: Vec<ModelOption>) -> Result<Vec<ModelOption>, String> {
    if models.is_empty() {
        Err("服务未返回可用的模型 ID，请手动配置或导入本地目录".into())
    } else {
        Ok(models)
    }
}

fn parse_model_page(value: &Value) -> Result<Vec<ModelOption>, String> {
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
        model.context_window_tokens = row
            .get("context_window")
            .or_else(|| row.get("context_length"))
            .or_else(|| row.get("contextWindowTokens"))
            .and_then(Value::as_u64)
            .and_then(|value| u32::try_from(value).ok())
            .filter(|value| {
                (MIN_CONTEXT_WINDOW_TOKENS..=MAX_CONTEXT_WINDOW_TOKENS).contains(value)
            });
        model.max_output_tokens = row
            .get("max_output_tokens")
            .or_else(|| row.get("maxOutputTokens"))
            .and_then(Value::as_u64)
            .and_then(|value| u32::try_from(value).ok())
            .filter(|value| {
                (MIN_OUTPUT_TOKENS..=MAX_OUTPUT_TOKENS).contains(value)
                    && *value <= model.effective_context_window_tokens() / 2
            });
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

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    #[test]
    fn parses_vendor_ids_without_inventing_effort_and_preserves_catalog_capabilities() {
        let ordinary = parse_models(&json!({"data":[{"id":"vendor/custom-alias","display_name":"My model"},{"id":"vendor/custom-alias"}]})).unwrap();
        assert_eq!(ordinary.len(), 1);
        assert_eq!(ordinary[0].efforts, vec![Effort::Default]);
        let catalog = parse_models(&json!({"models":[
            {"slug":"hidden","visibility":"hide"},
            {"slug":"relay/model","display_name":"Relay","visibility":"list","supported_reasoning_levels":[{"effort":"low"},{"effort":"xhigh"},{"effort":"nonsense"}],"default_reasoning_level":"xhigh"}
        ]})).unwrap();
        assert_eq!(catalog[0].id, "relay/model");
        assert_eq!(
            catalog[0].efforts,
            vec![Effort::Default, Effort::Low, Effort::Xhigh]
        );
        assert_eq!(catalog[0].default_effort, Some(Effort::Xhigh));
    }

    #[test]
    fn imports_known_budget_metadata_without_inventing_or_trusting_invalid_limits() {
        let models = parse_models(&json!({"models":[
            {"slug":"large","context_window":1_000_000,"max_output_tokens":32_768},
            {"id":"small","context_length":16_384},
            {"id":"inconsistent","context_window":32_768,"max_output_tokens":65_536},
            {"id":"invalid","context_window":-1,"max_output_tokens":1.5},
            {"id":"oversize","context_window":4_294_967_296_u64,"max_output_tokens":100_000},
            {"id":"unknown"}
        ]}))
        .unwrap();
        assert_eq!(models.len(), 6);
        assert_eq!(models[0].context_window_tokens, Some(1_000_000));
        assert_eq!(models[0].max_output_tokens, Some(32_768));
        assert_eq!(models[1].context_window_tokens, Some(16_384));
        assert_eq!(models[1].max_output_tokens, None);
        assert_eq!(models[1].effective_max_output_tokens(), 8_192);
        assert_eq!(models[2].context_window_tokens, Some(32_768));
        assert_eq!(models[2].max_output_tokens, None);
        for model in &models[3..] {
            assert_eq!(model.context_window_tokens, None);
            assert_eq!(model.max_output_tokens, None);
        }
    }

    #[test]
    fn bounds_and_validates_untrusted_catalog_rows() {
        assert!(parse_models(&json!({"data":[{"id":"bad\nmodel"},{"id":""}]})).is_err());
        let rows: Vec<_> = (0..1000)
            .map(|id| json!({"id":format!("vendor-{id}")}))
            .collect();
        assert_eq!(
            parse_models(&json!({"data":rows})).unwrap().len(),
            MAX_MODELS_PER_PROVIDER
        );
    }
}
