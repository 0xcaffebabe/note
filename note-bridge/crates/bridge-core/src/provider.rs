//! Bounded streaming adapters. Document tools execute in the authenticated website only.
//! Never return upstream response bodies, credentials, URLs or private reasoning in errors.
use crate::{
    model::{AuthKind, Protocol, Provider},
    protocol::{ChatRequest, Effort, MAX_TOOL_ARGUMENT_BYTES, MAX_TOOL_RESULT_BYTES},
};
use futures_util::StreamExt;
use reqwest::{header, Client};
use serde_json::{json, Value};
use std::{
    collections::{BTreeMap, HashSet},
    time::Duration,
};
use tokio::sync::{mpsc, oneshot};
use tokio_util::sync::CancellationToken;

pub const TOOL_TIMEOUT: Duration = Duration::from_secs(30);
pub const GENERATION_TIMEOUT: Duration = Duration::from_secs(180);
const MAX_ROUNDS: usize = 8;
const MAX_TOOL_CALLS: usize = 16;
const MAX_TRANSCRIPT_BYTES: usize = 2 * 1024 * 1024;

#[derive(Debug)]
pub struct UpstreamError {
    pub code: &'static str,
    pub message: &'static str,
}

impl UpstreamError {
    pub(crate) fn new(code: &'static str, message: &'static str) -> Self {
        Self { code, message }
    }
}

pub struct ToolResult {
    pub result: Value,
    pub is_error: bool,
}

pub enum GenerationEvent {
    Text(String),
    ToolCall {
        call_id: String,
        name: String,
        arguments: Value,
        reply: oneshot::Sender<Result<ToolResult, UpstreamError>>,
    },
}

pub fn validate_tool_result(result: &Value, is_error: bool) -> Result<(), UpstreamError> {
    if result.to_string().len() > MAX_TOOL_RESULT_BYTES {
        return Err(UpstreamError::new(
            "tool_result_limit",
            "工具结果超过 64 KiB 上限",
        ));
    }
    if !result.is_object() || (!is_error && result.get("data").is_none()) {
        return Err(UpstreamError::new(
            "tool_result_invalid",
            "工具结果必须为包含 data 的 JSON 对象",
        ));
    }
    if let Some(sources) = result.get("sources") {
        let Some(sources) = sources.as_array() else {
            return Err(UpstreamError::new(
                "tool_result_invalid",
                "工具来源格式无效",
            ));
        };
        if sources.len() > 256
            || sources.iter().any(|source| {
                ["sourceId", "title", "url"]
                    .iter()
                    .any(|key| !source[*key].is_string())
                    || source["sourceId"].as_str().is_none_or(|id| {
                        id.is_empty()
                            || id.len() > 100
                            || !id
                                .bytes()
                                .all(|b| b.is_ascii_alphanumeric() || b"_-:.".contains(&b))
                    })
            })
        {
            return Err(UpstreamError::new(
                "tool_result_invalid",
                "工具来源格式无效",
            ));
        }
    }
    Ok(())
}

pub fn client() -> Result<Client, String> {
    Client::builder()
        .redirect(reqwest::redirect::Policy::none())
        .connect_timeout(Duration::from_secs(15))
        .timeout(GENERATION_TIMEOUT)
        .build()
        .map_err(|_| "无法初始化模型连接".into())
}

// Top-level efforts keep older clients compatible. New selectors use each model's explicit
// capabilities; unknown models only offer default, which omits the upstream parameter.
pub fn supported_efforts(provider: &Provider) -> Vec<Effort> {
    provider
        .model_options()
        .into_iter()
        .find(|model| model.id == provider.model)
        .map(|model| model.efforts)
        .unwrap_or_else(|| vec![Effort::Default])
}

fn payload(provider: &Provider, chat: &ChatRequest) -> Value {
    let system = chat.instructions();
    let mut body = match provider.protocol {
        Protocol::Anthropic => {
            json!({"model":chat.model,"stream":true,"max_tokens":chat.max_output_tokens,"system":system,"messages":chat.messages})
        }
        Protocol::Responses => {
            json!({"model":chat.model,"stream":true,"max_output_tokens":chat.max_output_tokens,"instructions":system,"input":chat.messages,"store":false})
        }
        Protocol::ChatCompletions => {
            let mut messages = vec![json!({"role":"system","content":system})];
            messages.extend(chat.messages.iter().map(|message| json!(message)));
            let mut body = json!({"model":chat.model,"stream":true,"messages":messages});
            // Keep the original text-only gateway contract; reasoning/tool requests use
            // the current field that includes both visible and reasoning output tokens.
            let limit = if chat.tools.is_empty() && chat.effort == Effort::Default {
                "max_tokens"
            } else {
                "max_completion_tokens"
            };
            body[limit] = json!(chat.max_output_tokens);
            body
        }
    };
    if !chat.tools.is_empty() {
        body["tools"] = Value::Array(chat.tools.iter().map(|tool| match provider.protocol {
            Protocol::Anthropic => json!({"name":tool.name,"description":tool.description,"input_schema":tool.input_schema}),
            Protocol::Responses => json!({"type":"function","name":tool.name,"description":tool.description,"parameters":tool.input_schema,"strict":false}),
            Protocol::ChatCompletions => json!({"type":"function","function":{"name":tool.name,"description":tool.description,"parameters":tool.input_schema,"strict":false}}),
        }).collect());
        if provider.protocol == Protocol::Responses {
            // Preserve opaque reasoning across stateless tool rounds without storing server state.
            body["include"] = json!(["reasoning.encrypted_content"]);
        }
    }
    if chat.effort != Effort::Default {
        match provider.protocol {
            Protocol::Anthropic => body["output_config"] = json!({"effort":chat.effort}),
            Protocol::Responses => body["reasoning"] = json!({"effort":chat.effort}),
            Protocol::ChatCompletions => body["reasoning_effort"] = json!(chat.effort),
        }
    }
    body
}

fn endpoint(provider: &Provider) -> String {
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
    output: mpsc::Sender<GenerationEvent>,
    cancel: CancellationToken,
) -> Result<(), UpstreamError> {
    tokio::select! {
        biased;
        _ = cancel.cancelled() => Ok(()),
        result = tokio::time::timeout(GENERATION_TIMEOUT, generate_rounds(client, provider, secret, chat, output)) =>
            result.unwrap_or_else(|_| Err(UpstreamError::new("generation_timeout", "回答生成超过三分钟上限"))),
    }
}

async fn generate_rounds(
    client: &Client,
    provider: &Provider,
    secret: Option<&str>,
    chat: &ChatRequest,
    output: mpsc::Sender<GenerationEvent>,
) -> Result<(), UpstreamError> {
    let mut body = payload(provider, chat);
    let mut output_bytes = 0;
    let mut received_bytes = 0;
    let mut tool_calls = 0;
    for round_index in 0..MAX_ROUNDS {
        let mut request = client
            .post(endpoint(provider))
            .header(header::ACCEPT, "text/event-stream")
            .json(&body);
        if provider.protocol == Protocol::Anthropic {
            request = request.header("anthropic-version", "2023-06-01");
        }
        if provider.auth_kind != AuthKind::None {
            let key = secret.ok_or_else(|| {
                UpstreamError::new("missing_credential", "模型凭据缺失，请在桌面端重新配置")
            })?;
            request = if provider.protocol == Protocol::Anthropic
                && provider.auth_kind == AuthKind::ApiKey
            {
                request.header("x-api-key", key)
            } else {
                request.bearer_auth(key)
            };
        }
        let response = request
            .send()
            .await
            .map_err(|_| UpstreamError::new("upstream_connection", "模型服务连接失败或超时"))?;
        if !response.status().is_success() {
            return Err(match response.status().as_u16() {
                401 | 403 => UpstreamError::new("upstream_auth", "模型服务拒绝认证，请检查凭据及权限"),
                429 => UpstreamError::new("upstream_rate_limit", "模型服务限流或额度不足，请稍后重试"),
                300..=399 => UpstreamError::new("upstream_redirect", "模型地址发生重定向，请在桌面端填写最终 API 地址"),
                400 | 422 => UpstreamError::new("upstream_parameters", "模型服务拒绝请求参数，请检查模型是否支持工具和所选 effort，或将 effort 改为默认"),
                _ => UpstreamError::new("upstream_error", "模型服务返回错误，请检查协议、模型及服务状态"),
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
        let mut round = Round::default();
        'stream: loop {
            let chunk = tokio::time::timeout(Duration::from_secs(45), stream.next())
                .await
                .map_err(|_| UpstreamError::new("upstream_timeout", "模型响应超时"))?
                .ok_or_else(|| {
                    UpstreamError::new("upstream_incomplete", "模型连接中断，回答可能不完整")
                })?
                .map_err(|_| UpstreamError::new("upstream_connection", "模型连接中断"))?;
            received_bytes += chunk.len();
            if received_bytes > 8 * 1024 * 1024 {
                return Err(UpstreamError::new("output_limit", "模型输出超出长度上限"));
            }
            for data in decoder.push(&chunk)? {
                if let Some(text) = round.consume(provider.protocol, &data)? {
                    output_bytes += text.len();
                    if output_bytes > 512 * 1024 {
                        return Err(UpstreamError::new("output_limit", "模型输出超出长度上限"));
                    }
                    output
                        .send(GenerationEvent::Text(text))
                        .await
                        .map_err(|_| UpstreamError::new("connection_closed", "网站连接已断开"))?;
                }
                if round.done {
                    break 'stream;
                }
            }
        }
        drop(stream);
        let calls = round.calls(provider.protocol)?;
        if calls.is_empty() {
            return Ok(());
        }
        tool_calls += calls.len();
        if tool_calls > MAX_TOOL_CALLS || round_index + 1 == MAX_ROUNDS {
            return Err(UpstreamError::new(
                "tool_limit",
                "工具调用次数或推理轮次达到上限，请缩小问题范围",
            ));
        }
        // Validate every call before exposing any of the round's calls to the website.
        for call in &calls {
            let tool = chat
                .tools
                .iter()
                .find(|tool| tool.name == call.name)
                .ok_or_else(|| UpstreamError::new("unknown_tool", "模型请求了未注册的文档工具"))?;
            if !tool.accepts(&call.arguments) {
                return Err(UpstreamError::new(
                    "tool_arguments",
                    "模型返回的工具参数无效或超出范围",
                ));
            }
        }
        round.append_assistant(provider.protocol, &mut body)?;
        let mut results = Vec::new();
        for call in calls {
            let (reply, receive) = oneshot::channel();
            output
                .send(GenerationEvent::ToolCall {
                    call_id: uuid::Uuid::new_v4().to_string(),
                    name: call.name,
                    arguments: call.arguments,
                    reply,
                })
                .await
                .map_err(|_| UpstreamError::new("connection_closed", "网站连接已断开"))?;
            let result = await_tool_result(receive, TOOL_TIMEOUT).await?;
            validate_tool_result(&result.result, result.is_error)?;
            let encoded = if result.is_error {
                json!({"isError":true,"result":result.result}).to_string()
            } else {
                result.result.to_string()
            };
            match provider.protocol {
                Protocol::Responses => results.push(json!({"type":"function_call_output","call_id":call.id,"output":encoded})),
                Protocol::ChatCompletions => results.push(json!({"role":"tool","tool_call_id":call.id,"content":encoded})),
                Protocol::Anthropic => results.push(json!({"type":"tool_result","tool_use_id":call.id,"content":encoded,"is_error":result.is_error})),
            }
        }
        let key = if provider.protocol == Protocol::Responses {
            "input"
        } else {
            "messages"
        };
        let transcript = body[key].as_array_mut().expect("constructed transcript");
        if provider.protocol == Protocol::Anthropic {
            transcript.push(json!({"role":"user","content":results}));
        } else {
            transcript.extend(results);
        }
        if body.to_string().len() > MAX_TRANSCRIPT_BYTES {
            return Err(UpstreamError::new(
                "context_limit",
                "工具累计上下文过长，请缩小问题范围",
            ));
        }
    }
    Err(UpstreamError::new("tool_limit", "工具推理轮次达到上限"))
}

async fn await_tool_result(
    receive: oneshot::Receiver<Result<ToolResult, UpstreamError>>,
    deadline: Duration,
) -> Result<ToolResult, UpstreamError> {
    tokio::time::timeout(deadline, receive)
        .await
        .map_err(|_| UpstreamError::new("tool_timeout", "等待网页文档工具超时，请重试"))?
        .map_err(|_| UpstreamError::new("connection_closed", "网站工具连接已断开"))?
}

struct ToolCall {
    id: String,
    name: String,
    arguments: Value,
}

#[derive(Default)]
struct Round {
    items: BTreeMap<usize, Value>,
    arguments: BTreeMap<usize, String>,
    text: String,
    done: bool,
}

fn malformed() -> UpstreamError {
    UpstreamError::new("upstream_protocol", "模型流式数据格式无效")
}

impl Round {
    fn consume(&mut self, protocol: Protocol, data: &str) -> Result<Option<String>, UpstreamError> {
        if data == "[DONE]" {
            if protocol != Protocol::ChatCompletions {
                return Err(malformed());
            }
            self.done = true;
            return Ok(None);
        }
        let value: Value = serde_json::from_str(data).map_err(|_| malformed())?;
        if value.get("error").is_some()
            || matches!(
                value["type"].as_str(),
                Some("error" | "response.failed" | "response.incomplete")
            )
        {
            return Err(UpstreamError::new("upstream_error", "模型生成失败或未完成"));
        }
        let text = match protocol {
            Protocol::Responses => self.responses(&value)?,
            Protocol::Anthropic => self.anthropic(&value)?,
            Protocol::ChatCompletions => self.chat_completions(&value)?,
        };
        if self.items.len() > 64
            || self
                .items
                .values()
                .map(|item| item.to_string().len())
                .sum::<usize>()
                > 1024 * 1024
            || self
                .arguments
                .values()
                .any(|args| args.len() > MAX_TOOL_ARGUMENT_BYTES)
        {
            return Err(UpstreamError::new(
                "output_limit",
                "模型工具或推理数据超出长度上限",
            ));
        }
        if let Some(text) = &text {
            self.text.push_str(text);
        }
        Ok(text.filter(|text| !text.is_empty()))
    }

    fn responses(&mut self, value: &Value) -> Result<Option<String>, UpstreamError> {
        let index = value["output_index"].as_u64().unwrap_or(0) as usize;
        match value["type"].as_str() {
            Some("response.output_item.added" | "response.output_item.done") => {
                self.items.insert(index, value["item"].clone());
            }
            Some("response.function_call_arguments.delta") => self
                .arguments
                .entry(index)
                .or_default()
                .push_str(value["delta"].as_str().ok_or_else(malformed)?),
            Some("response.function_call_arguments.done") => {
                self.arguments.insert(
                    index,
                    value["arguments"].as_str().ok_or_else(malformed)?.into(),
                );
            }
            Some("response.output_text.delta") => {
                return Ok(value["delta"].as_str().map(str::to_owned))
            }
            Some("response.completed") => {
                if let Some(items) = value["response"]["output"].as_array() {
                    self.items = items.iter().cloned().enumerate().collect();
                }
                if value["response"]["status"]
                    .as_str()
                    .is_some_and(|status| status != "completed")
                {
                    return Err(malformed());
                }
                for (index, item) in &mut self.items {
                    if item["type"] == "function_call"
                        && item["arguments"].as_str().is_none_or(str::is_empty)
                    {
                        if let Some(args) = self.arguments.get(index) {
                            item["arguments"] = json!(args);
                        }
                    }
                }
                self.done = true;
            }
            _ => {}
        }
        Ok(None)
    }

    fn anthropic(&mut self, value: &Value) -> Result<Option<String>, UpstreamError> {
        let index = value["index"].as_u64().unwrap_or(0) as usize;
        match value["type"].as_str() {
            Some("content_block_start") => {
                self.items.insert(index, value["content_block"].clone());
            }
            Some("content_block_delta") => match value["delta"]["type"].as_str() {
                Some("text_delta") => {
                    let text = value["delta"]["text"].as_str().ok_or_else(malformed)?;
                    let item = self
                        .items
                        .entry(index)
                        .or_insert_with(|| json!({"type":"text","text":""}));
                    append_string(item, "text", text)?;
                    return Ok(Some(text.into()));
                }
                Some("input_json_delta") => self.arguments.entry(index).or_default().push_str(
                    value["delta"]["partial_json"]
                        .as_str()
                        .ok_or_else(malformed)?,
                ),
                Some("thinking_delta" | "signature_delta") => {
                    let field = if value["delta"]["type"] == "thinking_delta" {
                        "thinking"
                    } else {
                        "signature"
                    };
                    let item = self
                        .items
                        .entry(index)
                        .or_insert_with(|| json!({"type":"thinking","thinking":"","signature":""}));
                    append_string(
                        item,
                        field,
                        value["delta"][field].as_str().ok_or_else(malformed)?,
                    )?;
                }
                _ => {}
            },
            Some("content_block_stop") => {
                if let Some(args) = self.arguments.get(&index) {
                    let item = self.items.get_mut(&index).ok_or_else(malformed)?;
                    item["input"] = serde_json::from_str(args).map_err(|_| malformed())?;
                }
            }
            Some("message_delta") => {
                if value["delta"]["stop_reason"]
                    .as_str()
                    .is_some_and(|reason| {
                        !["end_turn", "stop_sequence", "tool_use"].contains(&reason)
                    })
                {
                    return Err(UpstreamError::new(
                        "upstream_incomplete",
                        "模型因长度或内容限制而停止，回答可能不完整",
                    ));
                }
            }
            Some("message_stop") => {
                self.done = true;
            }
            _ => {}
        }
        Ok(None)
    }

    fn chat_completions(&mut self, value: &Value) -> Result<Option<String>, UpstreamError> {
        let choice = &value["choices"][0];
        if let Some(calls) = choice["delta"]["tool_calls"].as_array() {
            for call in calls {
                let index = call["index"].as_u64().ok_or_else(malformed)? as usize;
                let item = self.items.entry(index).or_insert_with(
                    || json!({"type":"function","id":"","function":{"name":"","arguments":""}}),
                );
                if let Some(id) = call["id"].as_str() {
                    append_string(item, "id", id)?;
                }
                if call["type"].as_str().is_some_and(|kind| kind != "function") {
                    return Err(malformed());
                }
                for field in ["name", "arguments"] {
                    if let Some(part) = call["function"][field].as_str() {
                        append_string(&mut item["function"], field, part)?;
                    }
                }
            }
        }
        if let Some(reason) = choice["finish_reason"].as_str() {
            if !["stop", "tool_calls"].contains(&reason) {
                return Err(UpstreamError::new(
                    "upstream_incomplete",
                    "模型因长度或内容限制而停止，回答可能不完整",
                ));
            }
            self.done = true;
        }
        Ok(choice["delta"]["content"].as_str().map(str::to_owned))
    }

    fn calls(&self, protocol: Protocol) -> Result<Vec<ToolCall>, UpstreamError> {
        let mut calls = Vec::new();
        let mut ids = HashSet::new();
        for item in self.items.values() {
            let (id, name, args) = match protocol {
                Protocol::Responses if item["type"] == "function_call" => {
                    (&item["call_id"], &item["name"], &item["arguments"])
                }
                Protocol::ChatCompletions => (
                    &item["id"],
                    &item["function"]["name"],
                    &item["function"]["arguments"],
                ),
                Protocol::Anthropic if item["type"] == "tool_use" => {
                    (&item["id"], &item["name"], &item["input"])
                }
                Protocol::Responses
                    if matches!(item["type"].as_str(), Some("message" | "reasoning")) =>
                {
                    continue
                }
                Protocol::Anthropic
                    if matches!(
                        item["type"].as_str(),
                        Some("text" | "thinking" | "redacted_thinking")
                    ) =>
                {
                    continue
                }
                _ => {
                    return Err(UpstreamError::new(
                        "unknown_tool",
                        "模型请求了不支持的工具类型",
                    ))
                }
            };
            let id = id
                .as_str()
                .filter(|id| !id.is_empty() && id.len() <= 256)
                .ok_or_else(malformed)?;
            let name = name
                .as_str()
                .filter(|name| !name.is_empty() && name.len() <= 80)
                .ok_or_else(malformed)?;
            if !ids.insert(id) {
                return Err(malformed());
            }
            let arguments = if protocol == Protocol::Anthropic {
                args.clone()
            } else {
                let args = args
                    .as_str()
                    .filter(|args| args.len() <= MAX_TOOL_ARGUMENT_BYTES)
                    .ok_or_else(malformed)?;
                serde_json::from_str(args).map_err(|_| {
                    UpstreamError::new("tool_arguments", "模型返回的工具参数不是有效 JSON")
                })?
            };
            if !arguments.is_object() {
                return Err(UpstreamError::new(
                    "tool_arguments",
                    "工具参数必须为 JSON 对象",
                ));
            }
            calls.push(ToolCall {
                id: id.into(),
                name: name.into(),
                arguments,
            });
        }
        Ok(calls)
    }

    fn append_assistant(&self, protocol: Protocol, body: &mut Value) -> Result<(), UpstreamError> {
        let key = if protocol == Protocol::Responses {
            "input"
        } else {
            "messages"
        };
        let transcript = body[key].as_array_mut().ok_or_else(malformed)?;
        let items: Vec<_> = self.items.values().cloned().collect();
        match protocol {
            Protocol::Responses => transcript.extend(items),
            Protocol::Anthropic => transcript.push(json!({"role":"assistant","content":items})),
            Protocol::ChatCompletions => transcript.push(json!({"role":"assistant","content":if self.text.is_empty() { Value::Null } else { json!(self.text) },"tool_calls":items})),
        }
        Ok(())
    }
}

fn append_string(item: &mut Value, key: &str, part: &str) -> Result<(), UpstreamError> {
    let existing = match item.get(key) {
        Some(value) => value.as_str().ok_or_else(malformed)?,
        None if item.is_object() => "",
        None => return Err(malformed()),
    };
    item[key] = json!(format!("{existing}{part}"));
    Ok(())
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
                .map_err(|_| malformed())?
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
    fn upstream_errors_are_sanitized_and_truncated_answers_fail() {
        for (protocol, data) in [
            (
                Protocol::Responses,
                r#"{"type":"error","error":{"message":"test-secret-prompt"}}"#,
            ),
            (
                Protocol::ChatCompletions,
                r#"{"choices":[{"delta":{},"finish_reason":"length"}]}"#,
            ),
            (
                Protocol::Anthropic,
                r#"{"type":"message_delta","delta":{"stop_reason":"max_tokens"}}"#,
            ),
        ] {
            let error = Round::default().consume(protocol, data).unwrap_err();
            assert!(!format!("{error:?}").contains("test-secret"));
        }
    }

    #[tokio::test]
    async fn waiting_for_a_browser_tool_has_a_deadline() {
        let (_send, receive) = oneshot::channel();
        let error = await_tool_result(receive, Duration::from_millis(5))
            .await
            .err()
            .unwrap();
        assert_eq!(error.code, "tool_timeout");
    }

    #[test]
    fn effort_is_forwarded_explicitly_and_default_omits_all_optional_effort_fields() {
        let mut chat: ChatRequest = serde_json::from_value(json!({
            "requestId":"test","providerId":"test","model":"fixture","messages":[{"role":"user","content":"read"}],
            "context":{"documents":[]}
        })).unwrap();
        for protocol in [
            Protocol::Responses,
            Protocol::ChatCompletions,
            Protocol::Anthropic,
        ] {
            let provider = Provider {
                id: "test".into(),
                name: "test".into(),
                protocol,
                base_url: "http://127.0.0.1:1234/v1".into(),
                model: "fixture".into(),
                models: Vec::new(),
                auth_kind: AuthKind::None,
                enabled: true,
                source: None,
            };
            chat.effort = Effort::Default;
            let defaults = payload(&provider, &chat);
            for field in [
                "reasoning",
                "reasoning_effort",
                "output_config",
                "thinking",
                "tools",
            ] {
                assert!(defaults.get(field).is_none(), "{field}");
            }
            if protocol == Protocol::ChatCompletions {
                assert_eq!(defaults["max_tokens"], chat.max_output_tokens);
                assert!(defaults.get("max_completion_tokens").is_none());
            }
            for effort in [Effort::Low, Effort::Medium, Effort::High] {
                chat.effort = effort;
                let body = payload(&provider, &chat);
                let actual = match protocol {
                    Protocol::Responses => &body["reasoning"]["effort"],
                    Protocol::ChatCompletions => &body["reasoning_effort"],
                    Protocol::Anthropic => &body["output_config"]["effort"],
                };
                assert_eq!(*actual, json!(effort));
                assert!(body.get("thinking").is_none());
            }
        }
    }
}
