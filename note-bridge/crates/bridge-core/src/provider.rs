//! Text-only upstream adapters. Never return upstream response bodies or URLs in errors.
use crate::{
    model::{AuthKind, Protocol, Provider},
    protocol::ChatRequest,
};
use futures_util::StreamExt;
use reqwest::{header, Client};
use serde_json::{json, Value};
use std::time::Duration;
use tokio::sync::mpsc;
use tokio_util::sync::CancellationToken;

#[derive(Debug)]
pub struct UpstreamError {
    pub code: &'static str,
    pub message: &'static str,
}

impl UpstreamError {
    fn new(code: &'static str, message: &'static str) -> Self {
        Self { code, message }
    }
}

pub fn client() -> Result<Client, String> {
    Client::builder()
        .redirect(reqwest::redirect::Policy::none())
        .connect_timeout(Duration::from_secs(15))
        .timeout(Duration::from_secs(180))
        .build()
        .map_err(|_| "无法初始化模型连接".into())
}

fn payload(provider: &Provider, chat: &ChatRequest) -> Value {
    let system = chat.instructions();
    match provider.protocol {
        Protocol::Anthropic => {
            json!({"model":provider.model, "stream":true, "max_tokens":chat.max_output_tokens, "system":system, "messages":chat.messages})
        }
        Protocol::Responses => {
            json!({"model":provider.model, "stream":true, "max_output_tokens":chat.max_output_tokens, "instructions":system, "input":chat.messages, "store":false})
        }
        Protocol::ChatCompletions => {
            let mut messages = vec![json!({"role":"system", "content":system})];
            messages.extend(chat.messages.iter().map(|message| json!(message)));
            json!({"model":provider.model, "stream":true, "max_tokens":chat.max_output_tokens, "messages":messages})
        }
    }
}

fn endpoint(provider: &Provider) -> String {
    // baseUrl is the API prefix, e.g. https://gateway.example/v1. Anthropic's default
    // root is special-cased for the standard /v1/messages endpoint.
    let base = provider.base_url.trim_end_matches('/');
    let suffix = match provider.protocol {
        Protocol::Anthropic if !base.ends_with("/v1") => "/v1/messages",
        Protocol::Anthropic => "/messages",
        Protocol::Responses => "/responses",
        Protocol::ChatCompletions => "/chat/completions",
    };
    format!("{base}{suffix}")
}

pub async fn generate(
    client: &Client,
    provider: &Provider,
    secret: Option<&str>,
    chat: &ChatRequest,
    output: mpsc::Sender<String>,
    cancel: CancellationToken,
) -> Result<(), UpstreamError> {
    let mut request = client
        .post(endpoint(provider))
        .header(header::ACCEPT, "text/event-stream")
        .json(&payload(provider, chat));
    if provider.protocol == Protocol::Anthropic {
        request = request.header("anthropic-version", "2023-06-01");
    }
    if provider.auth_kind != AuthKind::None {
        let key = secret.ok_or_else(|| {
            UpstreamError::new("missing_credential", "模型凭据缺失，请在桌面端重新配置")
        })?;
        request =
            if provider.protocol == Protocol::Anthropic && provider.auth_kind == AuthKind::ApiKey {
                request.header("x-api-key", key)
            } else {
                request.bearer_auth(key)
            };
    }
    let response = tokio::select! {
        _ = cancel.cancelled() => return Ok(()),
        response = request.send() => response.map_err(|_| UpstreamError::new("upstream_connection", "模型服务连接失败或超时"))?,
    };
    let status = response.status();
    if !status.is_success() {
        return Err(match status.as_u16() {
            401 | 403 => UpstreamError::new("upstream_auth", "模型服务拒绝认证，请检查凭据及权限"),
            429 => UpstreamError::new("upstream_rate_limit", "模型服务限流或额度不足，请稍后重试"),
            300..=399 => UpstreamError::new(
                "upstream_redirect",
                "模型地址发生重定向，请在桌面端填写最终 API 地址",
            ),
            _ => UpstreamError::new(
                "upstream_error",
                "模型服务返回错误，请检查协议、模型及服务状态",
            ),
        });
    }
    if !response
        .headers()
        .get(header::CONTENT_TYPE)
        .and_then(|h| h.to_str().ok())
        .is_some_and(|v| v.starts_with("text/event-stream"))
    {
        return Err(UpstreamError::new(
            "upstream_protocol",
            "模型服务未返回预期的流式响应",
        ));
    }
    let mut stream = response.bytes_stream();
    let mut decoder = SseDecoder::default();
    let mut output_bytes = 0usize;
    loop {
        let chunk = tokio::select! {
            _ = cancel.cancelled() => return Ok(()),
            next = tokio::time::timeout(Duration::from_secs(45), stream.next()) => next.map_err(|_| UpstreamError::new("upstream_timeout", "模型响应超时"))?,
        };
        let Some(chunk) = chunk else {
            return Err(UpstreamError::new(
                "upstream_incomplete",
                "模型连接中断，回答可能不完整",
            ));
        };
        let chunk = chunk.map_err(|_| UpstreamError::new("upstream_connection", "模型连接中断"))?;
        for data in decoder.push(&chunk)? {
            match decode_event(provider.protocol, &data)? {
                StreamEvent::Text(text) => {
                    output_bytes += text.len();
                    if output_bytes > 512 * 1024 {
                        return Err(UpstreamError::new("output_limit", "模型输出超出长度上限"));
                    }
                    tokio::select! {
                        _ = cancel.cancelled() => return Ok(()),
                        result = output.send(text) => if result.is_err() { return Ok(()); },
                    }
                }
                StreamEvent::Done => return Ok(()),
                StreamEvent::Ignore => {}
            }
        }
    }
}

enum StreamEvent {
    Text(String),
    Done,
    Ignore,
}

fn decode_event(protocol: Protocol, data: &str) -> Result<StreamEvent, UpstreamError> {
    if data == "[DONE]" {
        return Ok(StreamEvent::Done);
    }
    let value: Value = serde_json::from_str(data)
        .map_err(|_| UpstreamError::new("upstream_protocol", "模型流式数据格式无效"))?;
    if value.get("error").is_some()
        || matches!(
            value.get("type").and_then(Value::as_str),
            Some("error" | "response.failed" | "response.incomplete")
        )
    {
        return Err(UpstreamError::new("upstream_error", "模型生成失败或未完成"));
    }
    let text = match protocol {
        Protocol::Anthropic => {
            if matches!(
                value["delta"]["stop_reason"].as_str(),
                Some("max_tokens" | "refusal" | "tool_use")
            ) {
                return Err(UpstreamError::new(
                    "upstream_incomplete",
                    "模型因长度、内容限制或工具请求而停止，回答可能不完整",
                ));
            }
            match value.get("type").and_then(Value::as_str) {
                Some("message_stop") => return Ok(StreamEvent::Done),
                Some("content_block_delta") if value["delta"]["type"] == "text_delta" => {
                    value["delta"]["text"].as_str()
                }
                _ => None,
            }
        }
        Protocol::Responses => match value.get("type").and_then(Value::as_str) {
            Some("response.completed") => return Ok(StreamEvent::Done),
            Some("response.output_text.delta") => value["delta"].as_str(),
            _ => None,
        },
        Protocol::ChatCompletions => {
            let choice = &value["choices"][0];
            if choice["finish_reason"]
                .as_str()
                .is_some_and(|reason| reason != "stop")
            {
                return Err(UpstreamError::new(
                    "upstream_incomplete",
                    "模型因长度、内容限制或工具请求而停止，回答可能不完整",
                ));
            }
            if let Some(text) = choice["delta"]["content"]
                .as_str()
                .filter(|s| !s.is_empty())
            {
                return Ok(StreamEvent::Text(text.into()));
            }
            if choice["finish_reason"].as_str().is_some() {
                return Ok(StreamEvent::Done);
            }
            None
        }
    };
    Ok(text
        .filter(|s| !s.is_empty())
        .map_or(StreamEvent::Ignore, |text| StreamEvent::Text(text.into())))
}

#[derive(Default)]
struct SseDecoder {
    pending: Vec<u8>,
    data: Vec<String>,
}

impl SseDecoder {
    fn push(&mut self, bytes: &[u8]) -> Result<Vec<String>, UpstreamError> {
        self.pending.extend_from_slice(bytes);
        if self.pending.len() + self.data.iter().map(String::len).sum::<usize>() > 1024 * 1024 {
            return Err(UpstreamError::new("upstream_protocol", "模型流式帧过大"));
        }
        let mut events = Vec::new();
        while let Some(end) = self.pending.iter().position(|b| *b == b'\n') {
            let line: Vec<u8> = self.pending.drain(..=end).collect();
            let line = std::str::from_utf8(&line[..line.len() - 1])
                .map_err(|_| UpstreamError::new("upstream_protocol", "模型返回非 UTF-8 文本"))?
                .trim_end_matches('\r');
            if line.is_empty() {
                if !self.data.is_empty() {
                    events.push(self.data.join("\n"));
                    self.data.clear();
                }
            } else if let Some(data) = line.strip_prefix("data:") {
                self.data
                    .push(data.strip_prefix(' ').unwrap_or(data).to_string());
            }
        }
        Ok(events)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn sse_handles_chunked_utf8_crlf_comments_and_multiple_events() {
        let mut parser = SseDecoder::default();
        let data = ": heartbeat\r\ndata: 你好\r\n\r\ndata: [DONE]\n\n".as_bytes();
        let mut events = vec![];
        for byte in data {
            events.extend(parser.push(&[*byte]).unwrap());
        }
        assert_eq!(events, ["你好", "[DONE]"]);
    }
    #[test]
    fn decodes_text_only_across_all_three_protocols() {
        for (protocol, payload) in [
            (
                Protocol::Anthropic,
                r#"{"type":"content_block_delta","delta":{"type":"text_delta","text":"answer"}}"#,
            ),
            (
                Protocol::Responses,
                r#"{"type":"response.output_text.delta","delta":"answer"}"#,
            ),
            (
                Protocol::ChatCompletions,
                r#"{"choices":[{"delta":{"content":"answer"}}]}"#,
            ),
        ] {
            assert!(
                matches!(decode_event(protocol, payload).unwrap(), StreamEvent::Text(t) if t == "answer")
            );
        }
        assert!(matches!(decode_event(Protocol::Anthropic, r#"{"type":"content_block_delta","delta":{"type":"thinking_delta","thinking":"private"}}"#).unwrap(), StreamEvent::Ignore));
    }
    #[test]
    fn upstream_error_body_is_not_reflected() {
        let error = decode_event(
            Protocol::Responses,
            r#"{"type":"error","error":{"message":"test-secret-prompt"}}"#,
        )
        .err()
        .unwrap();
        assert!(!format!("{error:?}").contains("test-secret"));
    }
    #[test]
    fn truncated_answers_are_not_reported_as_complete() {
        assert!(decode_event(
            Protocol::ChatCompletions,
            r#"{"choices":[{"delta":{},"finish_reason":"length"}]}"#
        )
        .is_err());
        assert!(decode_event(
            Protocol::Anthropic,
            r#"{"type":"message_delta","delta":{"stop_reason":"max_tokens"}}"#
        )
        .is_err());
    }
}
