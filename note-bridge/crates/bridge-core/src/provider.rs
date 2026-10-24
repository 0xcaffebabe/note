//! 原生模型设置的连接能力。这里只执行显式探测，Agent 生成循环完全由 Pi worker 拥有。
use crate::{
    model::{AuthKind, Protocol, Provider},
    protocol::Effort,
};
use reqwest::{Client, RequestBuilder};
use serde_json::json;
use std::time::Duration;

/// 创建原生设置使用的 HTTP 客户端；拒绝重定向，避免凭据被转发到其他主机。
pub fn client() -> Result<Client, String> {
    Client::builder()
        .redirect(reqwest::redirect::Policy::none())
        .connect_timeout(Duration::from_secs(15))
        .timeout(Duration::from_secs(30))
        .build()
        .map_err(|_| "无法初始化模型连接".into())
}

/// 返回当前默认模型已配置的 effort；不根据模型名称推断服务能力。
pub fn supported_efforts(provider: &Provider) -> Vec<Effort> {
    provider
        .model_options()
        .into_iter()
        .find(|m| m.id == provider.model)
        .map(|m| m.efforts)
        .unwrap_or_else(|| vec![Effort::Default])
}

/// 原生界面显式触发的一次连接探测，无工具和 Agent 循环。
///
/// 只返回固定安全错误文案，不把上游响应正文或凭据回显给界面。
pub async fn probe(
    client: &Client,
    provider: &Provider,
    secret: Option<&str>,
) -> Result<(), String> {
    let request = probe_request(client, provider, secret)?;
    let response = request
        .send()
        .await
        .map_err(|_| "模型连接测试失败，请检查服务地址与网络")?;
    if response.status().is_success() {
        Ok(())
    } else {
        Err("模型连接测试失败，请检查凭据、模型与接口协议".into())
    }
}

fn probe_request(
    client: &Client,
    provider: &Provider,
    secret: Option<&str>,
) -> Result<RequestBuilder, String> {
    let base = provider.base_url.trim_end_matches('/');
    let (suffix, body) = match provider.protocol {
        Protocol::Anthropic => (
            if base.ends_with("/v1") {
                "/messages"
            } else {
                "/v1/messages"
            },
            json!({
                "model": provider.model,
                "max_tokens": 16,
                "messages": [{ "role": "user", "content": "Reply OK." }],
            }),
        ),
        Protocol::Responses => (
            "/responses",
            json!({
                "model": provider.model,
                "max_output_tokens": 16,
                "input": "Reply OK.",
                "store": false,
            }),
        ),
        Protocol::ChatCompletions => (
            "/chat/completions",
            json!({
                "model": provider.model,
                "max_tokens": 16,
                "messages": [{ "role": "user", "content": "Reply OK." }],
            }),
        ),
    };
    let mut request = client.post(format!("{base}{suffix}")).json(&body);
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
