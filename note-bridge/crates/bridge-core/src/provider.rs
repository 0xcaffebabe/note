//! Native model-settings utilities. Agent generation is owned exclusively by the Pi worker.
use crate::{
    model::{AuthKind, Protocol, Provider},
    protocol::Effort,
};
use reqwest::Client;
use serde_json::json;
use std::time::Duration;
pub fn client() -> Result<Client, String> {
    Client::builder()
        .redirect(reqwest::redirect::Policy::none())
        .connect_timeout(Duration::from_secs(15))
        .timeout(Duration::from_secs(30))
        .build()
        .map_err(|_| "无法初始化模型连接".into())
}
pub fn supported_efforts(provider: &Provider) -> Vec<Effort> {
    provider
        .model_options()
        .into_iter()
        .find(|m| m.id == provider.model)
        .map(|m| m.efforts)
        .unwrap_or_else(|| vec![Effort::Default])
}
/// Explicit native UI connectivity probe, one bounded request with no tools or agent loop.
pub async fn probe(
    client: &Client,
    provider: &Provider,
    secret: Option<&str>,
) -> Result<(), String> {
    let base = provider.base_url.trim_end_matches('/');
    let (suffix, body) = match provider.protocol {
        Protocol::Anthropic => (
            if base.ends_with("/v1") {
                "/messages"
            } else {
                "/v1/messages"
            },
            json!({"model":provider.model,"max_tokens":16,"messages":[{"role":"user","content":"Reply OK."}]}),
        ),
        Protocol::Responses => (
            "/responses",
            json!({"model":provider.model,"max_output_tokens":16,"input":"Reply OK.","store":false}),
        ),
        Protocol::ChatCompletions => (
            "/chat/completions",
            json!({"model":provider.model,"max_tokens":16,"messages":[{"role":"user","content":"Reply OK."}]}),
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
