use super::parsing::{nonempty, parse_model_page};
use crate::model::{AuthKind, ModelOption, Protocol, Provider, MAX_MODELS_PER_PROVIDER};
use futures_util::StreamExt;
use reqwest::{Client, RequestBuilder, Response};
use serde_json::Value;
use std::{collections::HashSet, time::Duration};

const MAX_CATALOG_BYTES: usize = 1024 * 1024;
const FETCH_TIMEOUT: Duration = Duration::from_secs(15);
const MAX_PAGES: usize = 20;

/// 在当前 provider 的地址和凭据下读取候选目录；整个分页过程共享时限及字节预算。
///
/// 只沿用本地构造的 URL 和经验证的游标，不跟随服务端分页 URL，也不修改已有模型配置。
pub async fn fetch(
    client: &Client,
    provider: &Provider,
    secret: Option<&str>,
) -> Result<Vec<ModelOption>, String> {
    tokio::time::timeout(FETCH_TIMEOUT, fetch_pages(client, provider, secret))
        .await
        .map_err(|_| "读取模型列表超时，现有模型未修改".to_string())?
}

async fn fetch_pages(
    client: &Client,
    provider: &Provider,
    secret: Option<&str>,
) -> Result<Vec<ModelOption>, String> {
    let request = catalog_request(client, provider, secret)?;
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
        let value = read_page(response, &mut consumed_bytes).await?;
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
        // Anthropic 支持分页；始终复用本地地址，绝不跟随服务端提供的 URL。
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
        if !seen_cursors.insert(cursor.to_string()) || seen_cursors.len() > MAX_PAGES {
            return Err("模型列表分页重复或超过上限".into());
        }
        after = Some(cursor.to_string());
    }
}

fn catalog_request(
    client: &Client,
    provider: &Provider,
    secret: Option<&str>,
) -> Result<RequestBuilder, String> {
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
    Ok(request)
}

/// 同时检查声明长度和流式实际长度，防止缺少 Content-Length 的响应绕过总预算。
async fn read_page(response: Response, consumed_bytes: &mut usize) -> Result<Value, String> {
    if !response.status().is_success() {
        return Err(status_error(response.status().as_u16()).into());
    }
    if response
        .content_length()
        .is_some_and(|size| size > (MAX_CATALOG_BYTES - *consumed_bytes) as u64)
    {
        return Err("模型列表超过 1 MiB 上限".into());
    }
    let mut bytes = Vec::new();
    let mut stream = response.bytes_stream();
    while let Some(chunk) = stream.next().await {
        let chunk = chunk.map_err(|_| "读取模型列表失败")?;
        *consumed_bytes += chunk.len();
        if *consumed_bytes > MAX_CATALOG_BYTES {
            return Err("模型列表超过 1 MiB 上限".into());
        }
        bytes.extend_from_slice(&chunk);
    }
    serde_json::from_slice(&bytes).map_err(|_| "模型列表不是有效 JSON".into())
}

fn status_error(status: u16) -> &'static str {
    match status {
        401 | 403 => "模型列表认证失败，请检查当前服务的凭据和权限",
        404 | 405 => "此服务不提供模型列表接口，请手动配置模型 ID 或导入本地模型目录",
        429 => "模型列表请求过于频繁，请稍后重试",
        300..=399 => "模型列表接口发生重定向；为保护凭据，请直接配置服务地址",
        _ => "模型列表接口返回错误，现有模型未修改",
    }
}
