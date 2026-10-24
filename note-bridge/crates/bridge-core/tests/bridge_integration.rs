use axum::{
    body::{Body, Bytes},
    extract::State,
    http::{HeaderMap, StatusCode, Uri},
    response::{IntoResponse, Response},
    routing::{get, post},
    Json, Router,
};
use bridge_core::{
    model::{AuthKind, ModelOption, Protocol},
    protocol::Effort,
    storage::MemorySecretStore,
    Bridge, Provider, ProviderInput,
};
use futures_util::{SinkExt, StreamExt};
use serde_json::{json, Value};
use std::{
    collections::VecDeque,
    convert::Infallible,
    sync::{Arc, Mutex},
    time::Duration,
};
use tempfile::TempDir;
use tokio::{
    net::{TcpListener, TcpStream},
    task::JoinHandle,
    time::timeout,
};
use tokio_tungstenite::{
    connect_async,
    tungstenite::{client::IntoClientRequest, http::HeaderValue, Message},
    MaybeTlsStream, WebSocketStream,
};

const ORIGIN: &str = "http://localhost:4391";
const FAKE_KEY: &str = "fixture-integration-api-key-never-real";
const PRIVATE_PROMPT: &str = "fixture-private-user-question-never-log";
const PRIVATE_DOCUMENT: &str = "fixture-private-document-text-never-log";
type Socket = WebSocketStream<MaybeTlsStream<TcpStream>>;

#[derive(Clone)]
struct RecordedRequest {
    path: String,
    headers: HeaderMap,
    body: Value,
}

struct Upstream {
    base_url: String,
    requests: Arc<Mutex<Vec<RecordedRequest>>>,
    task: JoinHandle<()>,
}

impl Upstream {
    async fn start() -> Self {
        let listener = TcpListener::bind("127.0.0.1:0").await.unwrap();
        let port = listener.local_addr().unwrap().port();
        let requests = Arc::new(Mutex::new(Vec::new()));
        let app = Router::new()
            .route("/v1/models", get(mock_models))
            .route("/paged/v1/models", get(mock_models))
            .route("/empty-final/v1/models", get(mock_models))
            .route("/empty-middle/v1/models", get(mock_models))
            .route(
                "/redirect/v1/models",
                get(|| async { axum::response::Redirect::temporary("/v1/models") }),
            )
            .route(
                "/oversized/v1/models",
                get(|| async { "x".repeat(1024 * 1024 + 1) }),
            )
            .route("/v1/messages", post(mock_upstream))
            .route("/v1/responses", post(mock_upstream))
            .route("/v1/chat/completions", post(mock_upstream))
            .with_state(requests.clone());
        let task = tokio::spawn(async move {
            axum::serve(listener, app).await.unwrap();
        });
        Self {
            base_url: format!("http://127.0.0.1:{port}/v1"),
            requests,
            task,
        }
    }
}

impl Drop for Upstream {
    fn drop(&mut self) {
        self.task.abort();
    }
}

async fn mock_models(
    State(requests): State<Arc<Mutex<Vec<RecordedRequest>>>>,
    uri: Uri,
    headers: HeaderMap,
) -> Json<Value> {
    requests.lock().unwrap().push(RecordedRequest {
        path: uri.path().into(),
        headers,
        body: Value::Null,
    });
    if uri.path().starts_with("/empty-final/") || uri.path().starts_with("/empty-middle/") {
        return Json(match uri.query() {
            None => {
                json!({"data":[{"id":"first-page-model"}],"has_more":true,"last_id":"first-page-model"})
            }
            Some("after_id=first-page-model") if uri.path().starts_with("/empty-final/") => {
                json!({"data":[],"has_more":false})
            }
            Some("after_id=first-page-model") => {
                json!({"data":[{"id":"hidden-intermediate","visibility":"hide"}],"has_more":true,"last_id":"hidden-intermediate"})
            }
            Some("after_id=hidden-intermediate") => {
                json!({"data":[{"id":"last-page-model"}],"has_more":false})
            }
            other => panic!("unexpected model pagination cursor: {other:?}"),
        });
    }
    if uri.path().starts_with("/paged/") {
        return Json(if uri.query().is_none() {
            json!({"data":[{"id":"first-page-model"}],"has_more":true,"last_id":"first-page-model"})
        } else {
            assert_eq!(uri.query(), Some("after_id=first-page-model"));
            json!({"data":[{"id":"second-page-model"}],"has_more":false,"last_id":"second-page-model"})
        });
    }
    Json(
        json!({"data":[{"id":"fixture-alternate","display_name":"Alternate gateway model"},{"id":"vendor/other-alias"}]}),
    )
}

async fn mock_upstream(
    State(requests): State<Arc<Mutex<Vec<RecordedRequest>>>>,
    uri: Uri,
    headers: HeaderMap,
    Json(body): Json<Value>,
) -> Response {
    let slow = body["model"] == "fixture-slow-model";
    let tool_round = body.get("tools").is_some()
        && (body["model"] == "fixture-loop-tools"
            || !body.to_string().contains("fixture-tool-result-marker"));
    let unknown_tool = body["model"] == "fixture-unknown-tool";
    let multiple_tools = body["model"] == "fixture-multiple-tools";
    let needs_overview = body["model"] == "fixture-global-tools"
        && !body.to_string().contains("fixture-overview-result-marker");
    requests.lock().unwrap().push(RecordedRequest {
        path: uri.path().into(),
        headers,
        body,
    });
    if tool_round {
        let events = if needs_overview {
            named_tool_events(uri.path(), "get_knowledge_overview", json!({}))
        } else if multiple_tools {
            multiple_tool_events(uri.path())
        } else {
            tool_events(uri.path(), unknown_tool)
        };
        let text = events
            .iter()
            .map(|event| format!("data: {event}\r\n\r\n"))
            .collect::<String>();
        // Fragment the UTF-8 arguments and SSE lines at arbitrary byte boundaries.
        let chunks: Vec<_> = text
            .as_bytes()
            .chunks(3)
            .map(|chunk| Ok::<_, Infallible>(Bytes::copy_from_slice(chunk)))
            .collect();
        return Response::builder()
            .header("content-type", "text/event-stream")
            .body(Body::from_stream(futures_util::stream::iter(chunks)))
            .unwrap();
    }
    let (delta, done) = match uri.path() {
        "/v1/messages" => (
            json!({"type":"content_block_delta","delta":{"type":"text_delta","text":"fixture answer [fixture_source]"}}),
            json!({"type":"message_stop"}),
        ),
        "/v1/responses" => (
            json!({"type":"response.output_text.delta","delta":"fixture answer [fixture_source]"}),
            json!({"type":"response.completed"}),
        ),
        "/v1/chat/completions" => (
            json!({"choices":[{"delta":{"content":"fixture answer [fixture_source]"}}]}),
            json!({"choices":[{"delta":{},"finish_reason":"stop"}]}),
        ),
        _ => return StatusCode::NOT_FOUND.into_response(),
    };
    let chunks = VecDeque::from([
        (Duration::ZERO, format!("data: {delta}\n\n")),
        (
            if slow {
                Duration::from_secs(30)
            } else {
                Duration::ZERO
            },
            format!("data: {done}\n\n"),
        ),
    ]);
    let stream = futures_util::stream::unfold(chunks, |mut chunks| async move {
        let (delay, text) = chunks.pop_front()?;
        if !delay.is_zero() {
            tokio::time::sleep(delay).await;
        }
        Some((Ok::<_, Infallible>(Bytes::from(text)), chunks))
    });
    Response::builder()
        .header("content-type", "text/event-stream")
        .body(Body::from_stream(stream))
        .unwrap()
}

fn tool_events(path: &str, unknown: bool) -> Vec<Value> {
    let name = if unknown {
        "execute_shell"
    } else {
        "get_document"
    };
    named_tool_events(path, name, json!({"docId":"fixture-文档"}))
}

fn named_tool_events(path: &str, name: &str, args: Value) -> Vec<Value> {
    let args = args.to_string();
    let split = args
        .char_indices()
        .nth(8)
        .map(|(index, _)| index)
        .unwrap_or(args.len());
    let (first, second) = args.split_at(split);
    match path {
        "/v1/responses" => vec![
            json!({"type":"response.output_item.done","output_index":0,"item":{"type":"reasoning","id":"rs_fixture","summary":[],"encrypted_content":"fixture-private-opaque-reasoning"}}),
            json!({"type":"response.output_item.added","output_index":1,"item":{"type":"function_call","id":"fc_fixture","call_id":"upstream-call-1","name":name,"arguments":""}}),
            json!({"type":"response.function_call_arguments.delta","output_index":1,"delta":first}),
            json!({"type":"response.function_call_arguments.delta","output_index":1,"delta":second}),
            json!({"type":"response.completed","response":{"status":"completed"}}),
        ],
        "/v1/messages" => vec![
            json!({"type":"content_block_start","index":0,"content_block":{"type":"thinking","thinking":"","signature":""}}),
            json!({"type":"content_block_delta","index":0,"delta":{"type":"thinking_delta","thinking":"fixture-private-thinking"}}),
            json!({"type":"content_block_delta","index":0,"delta":{"type":"signature_delta","signature":"fixture-private-signature"}}),
            json!({"type":"content_block_stop","index":0}),
            json!({"type":"content_block_start","index":1,"content_block":{"type":"tool_use","id":"upstream-call-1","name":name,"input":{}}}),
            json!({"type":"content_block_delta","index":1,"delta":{"type":"input_json_delta","partial_json":first}}),
            json!({"type":"content_block_delta","index":1,"delta":{"type":"input_json_delta","partial_json":second}}),
            json!({"type":"content_block_stop","index":1}),
            json!({"type":"message_delta","delta":{"stop_reason":"tool_use"}}),
            json!({"type":"message_stop"}),
        ],
        "/v1/chat/completions" => vec![
            json!({"choices":[{"delta":{"tool_calls":[{"index":0,"id":"upstream-call-1","type":"function","function":{"name":name,"arguments":first}}]}}]}),
            json!({"choices":[{"delta":{"tool_calls":[{"index":0,"function":{"arguments":second}}]}}]}),
            json!({"choices":[{"delta":{},"finish_reason":"tool_calls"}]}),
        ],
        _ => unreachable!(),
    }
}

fn multiple_tool_events(path: &str) -> Vec<Value> {
    let first = tool_events(path, false);
    let mut second = first.clone();
    for event in &mut second {
        for key in ["output_index", "index"] {
            if let Some(index) = event[key].as_u64() {
                event[key] = json!(index + 2);
            }
        }
        if let Some(id) = event["item"]["call_id"].as_str() {
            event["item"]["call_id"] = json!(format!("{id}-second"));
        }
        if event["content_block"]["type"] == "tool_use" {
            event["content_block"]["id"] = json!("upstream-call-2");
        }
        if let Some(calls) = event
            .get_mut("choices")
            .and_then(Value::as_array_mut)
            .and_then(|choices| choices.first_mut())
            .and_then(|choice| choice.get_mut("delta"))
            .and_then(|delta| delta.get_mut("tool_calls"))
            .and_then(Value::as_array_mut)
        {
            for call in calls {
                call["index"] = json!(1);
                if call.get("id").is_some() {
                    call["id"] = json!("upstream-call-2");
                }
            }
        }
    }
    first
        .into_iter()
        .filter(|event| {
            !matches!(
                event["type"].as_str(),
                Some("response.completed" | "message_delta" | "message_stop")
            ) && event["choices"][0]["finish_reason"].is_null()
        })
        .chain(second)
        .collect()
}

struct Harness {
    _dir: TempDir,
    secrets: Arc<MemorySecretStore>,
    bridge: Bridge,
    port: u16,
    upstream: Upstream,
}

impl Harness {
    async fn new() -> Self {
        let dir = tempfile::tempdir().unwrap();
        let secrets = Arc::new(MemorySecretStore::new());
        let bridge = Bridge::with_secrets(dir.path().into(), secrets.clone()).unwrap();
        let reservation = TcpListener::bind("127.0.0.1:0").await.unwrap();
        let port = reservation.local_addr().unwrap().port();
        drop(reservation);
        bridge.start(port, vec![ORIGIN.into()]).await.unwrap();
        Self {
            _dir: dir,
            secrets,
            bridge,
            port,
            upstream: Upstream::start().await,
        }
    }

    async fn add_provider(&self, protocol: Protocol, slow: bool) -> Provider {
        self.add_model(
            protocol,
            if slow {
                "fixture-slow-model"
            } else {
                "fixture-model"
            },
        )
        .await
    }

    async fn add_model(&self, protocol: Protocol, model: &str) -> Provider {
        self.bridge
            .save_provider(ProviderInput {
                id: None,
                name: format!("Fixture {protocol:?}"),
                protocol,
                base_url: self.upstream.base_url.clone(),
                model: model.into(),
                models: Vec::new(),
                auth_kind: if protocol == Protocol::Anthropic {
                    AuthKind::ApiKey
                } else {
                    AuthKind::Bearer
                },
                enabled: true,
                api_key: Some(FAKE_KEY.into()),
                source: None,
            })
            .await
            .unwrap()
    }

    async fn connect(&self) -> Socket {
        self.connect_origin(ORIGIN).await
    }

    async fn connect_origin(&self, origin: &str) -> Socket {
        let mut request = format!("ws://127.0.0.1:{}/ws", self.port)
            .into_client_request()
            .unwrap();
        request
            .headers_mut()
            .insert("origin", HeaderValue::from_str(origin).unwrap());
        connect_async(request).await.unwrap().0
    }

    async fn authenticate(&self, token: &Value) -> (Socket, Value) {
        let mut socket = self.connect().await;
        send(&mut socket, json!({"v":1,"type":"auth","token":token})).await;
        let reply = receive(&mut socket).await;
        (socket, reply)
    }

    async fn pair(&self) -> (Socket, Value) {
        let pairing = self.bridge.open_pairing().await.unwrap();
        let (socket, auth) = self.pair_code(&pairing.code).await;
        assert_eq!(auth["type"], "auth.ok");
        assert!(!auth.to_string().contains(FAKE_KEY));
        assert!(!auth.to_string().contains(&self.upstream.base_url));
        (socket, auth)
    }

    async fn pair_code(&self, code: &str) -> (Socket, Value) {
        let mut socket = self.connect().await;
        send(&mut socket, json!({"v":1,"type":"pair","code":code})).await;
        let response = receive(&mut socket).await;
        (socket, response)
    }
}

async fn send(socket: &mut Socket, value: Value) {
    socket
        .send(Message::Text(value.to_string().into()))
        .await
        .unwrap();
}

async fn receive(socket: &mut Socket) -> Value {
    timeout(Duration::from_secs(8), async {
        loop {
            match socket
                .next()
                .await
                .expect("websocket closed")
                .expect("websocket read")
            {
                Message::Text(text) => return serde_json::from_str(&text).unwrap(),
                Message::Ping(bytes) => socket.send(Message::Pong(bytes)).await.unwrap(),
                other => panic!("unexpected websocket frame: {other:?}"),
            }
        }
    })
    .await
    .expect("bridge response timeout")
}

async fn wait_disconnected(bridge: &Bridge) {
    timeout(Duration::from_secs(5), async {
        while !bridge.snapshot().await.connections.is_empty() {
            tokio::time::sleep(Duration::from_millis(10)).await;
        }
    })
    .await
    .expect("disconnected sessions were not removed");
}

async fn assert_closed(socket: &mut Socket) {
    let end = timeout(Duration::from_secs(5), socket.next())
        .await
        .expect("revoked socket did not close");
    assert!(matches!(end, None | Some(Ok(Message::Close(_)))));
}

fn chat(provider: &Provider, id: &str) -> Value {
    json!({
        "v":1,"type":"chat.start","requestId":id,"providerId":provider.id,"model":provider.model,
        "messages":[{"role":"user","content":PRIVATE_PROMPT}],"maxOutputTokens":128,
        "context":{"documents":[{"docId":"fixture-doc","title":"Fixture document","url":"https://note.example.test/doc", "contentHash":"fixture-hash","metadata":{},"headings":[],"relatedLinks":[],
            "sources":[{"sourceId":"fixture_source","headingId":"fixture_heading","title":"Fixture section","text":PRIVATE_DOCUMENT}]}]}
    })
}

fn tool_chat(provider: &Provider, id: &str) -> Value {
    let mut request = chat(provider, id);
    request["context"]["documents"][0]["sources"] = json!([]);
    request["effort"] = json!("high");
    request["tools"] = json!([{
        "name":"get_document", "description":"Read a document section for context.",
        "inputSchema":{"type":"object","properties":{"docId":{"type":"string","maxLength":512}},"required":["docId"],"additionalProperties":false}
    }]);
    request
}

fn tool_result(event: &Value) -> Value {
    json!({"v":1,"type":"tool.result","requestId":event["requestId"],"callId":event["callId"],"result":{
        "data":{"text":"fixture-tool-result-marker private document text"},
        "sources":[{"sourceId":"fixture_source","title":"Fixture section","url":"/fixture.html#section"}]
    }})
}

#[tokio::test]
async fn global_questions_discover_then_read_without_initial_documents_for_all_protocols() {
    let harness = Harness::new().await;
    let mut providers = Vec::new();
    for protocol in [
        Protocol::Responses,
        Protocol::ChatCompletions,
        Protocol::Anthropic,
    ] {
        providers.push(harness.add_model(protocol, "fixture-global-tools").await);
    }
    let (mut socket, _) = harness.pair().await;
    for (index, provider) in providers.iter().enumerate() {
        let mut request = tool_chat(provider, &format!("global-{index}"));
        request["context"] = json!({"scope":"knowledge_base","documents":[]});
        request["tools"].as_array_mut().unwrap().push(json!({
            "name":"get_knowledge_overview","description":"Browse the whole knowledge base",
            "inputSchema":{"type":"object","properties":{},"required":[],"additionalProperties":false}
        }));
        send(&mut socket, request).await;
        let overview = receive(&mut socket).await;
        assert_eq!(overview["type"], "tool.call", "{overview}");
        assert_eq!(overview["name"], "get_knowledge_overview");
        assert_eq!(overview["arguments"], json!({}));
        send(&mut socket, json!({"v":1,"type":"tool.result","requestId":overview["requestId"],"callId":overview["callId"],"result":{
            "data":{"marker":"fixture-overview-result-marker","documents":[{"docId":"fixture-文档","title":"Discovered document"}]}
        }})).await;
        let read = receive(&mut socket).await;
        assert_eq!(read["type"], "tool.call", "{read}");
        assert_eq!(read["name"], "get_document");
        assert_eq!(read["arguments"], json!({"docId":"fixture-文档"}));
        send(&mut socket, tool_result(&read)).await;
        assert_eq!(receive(&mut socket).await["type"], "chat.delta");
        assert_eq!(receive(&mut socket).await["type"], "chat.done");
    }
    let requests = harness.upstream.requests.lock().unwrap().clone();
    assert_eq!(requests.len(), 9);
    for rounds in requests.chunks(3) {
        let first = rounds[0].body.to_string();
        assert!(first.contains("整个知识库"));
        assert!(!first.contains(PRIVATE_DOCUMENT));
        assert!(!first.contains("fixture-overview-result-marker"));
        assert!(rounds[1]
            .body
            .to_string()
            .contains("fixture-overview-result-marker"));
        assert!(rounds[2]
            .body
            .to_string()
            .contains("fixture-tool-result-marker"));
    }
    harness.bridge.stop().await;
}

#[tokio::test]
async fn tools_round_trip_through_the_browser_for_all_protocols_with_effort_and_private_reasoning()
{
    let harness = Harness::new().await;
    let mut providers = Vec::new();
    for protocol in [
        Protocol::Responses,
        Protocol::ChatCompletions,
        Protocol::Anthropic,
    ] {
        providers.push(harness.add_provider(protocol, false).await);
    }
    let (mut socket, auth) = harness.pair().await;
    for provider in auth["providers"].as_array().unwrap() {
        assert_eq!(
            provider["efforts"],
            json!(["default", "low", "medium", "high"])
        );
    }
    for (index, provider) in providers.iter().enumerate() {
        let id = format!("tool-round-{index}");
        send(&mut socket, tool_chat(provider, &id)).await;
        let tool = receive(&mut socket).await;
        assert_eq!(tool["type"], "tool.call", "{tool}");
        assert_eq!(tool["name"], "get_document");
        assert_eq!(tool["arguments"], json!({"docId":"fixture-文档"}));
        assert_eq!(tool["requestId"], id);
        assert_eq!(tool["seq"], 1);
        assert_ne!(tool["callId"], "upstream-call-1");
        assert!(!tool.to_string().contains("private"));
        send(&mut socket, tool_result(&tool)).await;
        let delta = receive(&mut socket).await;
        assert_eq!(delta["type"], "chat.delta");
        assert_eq!(delta["seq"], 2);
        assert_eq!(delta["delta"], "fixture answer [fixture_source]");
        let done = receive(&mut socket).await;
        assert_eq!(done["type"], "chat.done");
        assert_eq!(done["seq"], 3);
        assert_eq!(done["finishReason"], "stop");
    }
    let requests = harness.upstream.requests.lock().unwrap().clone();
    assert_eq!(requests.len(), 6);
    for pair in requests.chunks(2) {
        assert!(!pair[0]
            .body
            .to_string()
            .contains("fixture-tool-result-marker"));
        assert!(pair[1]
            .body
            .to_string()
            .contains("fixture-tool-result-marker"));
        assert_eq!(pair[0].body["model"], pair[1].body["model"]);
    }
    let responses = &requests[1].body;
    assert_eq!(responses["store"], false);
    assert!(responses.get("previous_response_id").is_none());
    assert_eq!(responses["include"], json!(["reasoning.encrypted_content"]));
    assert_eq!(responses["reasoning"]["effort"], "high");
    assert_eq!(
        responses["input"][1]["encrypted_content"],
        "fixture-private-opaque-reasoning"
    );
    assert_eq!(responses["input"][2]["type"], "function_call");
    assert_eq!(responses["input"][3]["type"], "function_call_output");
    assert_eq!(responses["input"][3]["call_id"], "upstream-call-1");
    let completions = &requests[3].body;
    assert_eq!(completions["reasoning_effort"], "high");
    assert_eq!(
        completions["messages"][2]["tool_calls"][0]["function"]["name"],
        "get_document"
    );
    assert_eq!(completions["messages"][3]["role"], "tool");
    assert_eq!(
        completions["messages"][3]["tool_call_id"],
        "upstream-call-1"
    );
    let anthropic = &requests[5].body;
    assert_eq!(anthropic["output_config"]["effort"], "high");
    assert!(anthropic.get("thinking").is_none());
    assert_eq!(
        anthropic["messages"][1]["content"][0]["thinking"],
        "fixture-private-thinking"
    );
    assert_eq!(
        anthropic["messages"][1]["content"][0]["signature"],
        "fixture-private-signature"
    );
    assert_eq!(anthropic["messages"][1]["content"][1]["type"], "tool_use");
    assert_eq!(
        anthropic["messages"][2]["content"][0]["type"],
        "tool_result"
    );
    assert_eq!(
        anthropic["messages"][2]["content"][0]["tool_use_id"],
        "upstream-call-1"
    );
    let logs = harness.bridge.export_logs().await;
    for forbidden in [
        "fixture-private-thinking",
        "fixture-private-signature",
        "fixture-private-opaque-reasoning",
        "fixture-tool-result-marker",
    ] {
        assert!(!logs.contains(forbidden));
    }
    harness.bridge.stop().await;
}

#[tokio::test]
async fn multiple_calls_in_one_round_keep_call_ids_and_tool_errors_in_the_upstream_transcript() {
    for protocol in [
        Protocol::Responses,
        Protocol::ChatCompletions,
        Protocol::Anthropic,
    ] {
        let harness = Harness::new().await;
        let provider = harness.add_model(protocol, "fixture-multiple-tools").await;
        let (mut socket, _) = harness.pair().await;
        send(&mut socket, tool_chat(&provider, "multiple-calls")).await;
        let first = receive(&mut socket).await;
        assert_eq!(first["type"], "tool.call");
        let mut failed = tool_result(&first);
        failed["isError"] = json!(true);
        failed["result"]["data"] = json!({"error":"fixture-tool-result-marker missing section"});
        send(&mut socket, failed).await;
        let second = receive(&mut socket).await;
        assert_eq!(second["type"], "tool.call");
        assert_ne!(first["callId"], second["callId"]);
        assert_eq!(second["seq"], 2);
        send(&mut socket, tool_result(&second)).await;
        assert_eq!(receive(&mut socket).await["type"], "chat.delta");
        assert_eq!(receive(&mut socket).await["type"], "chat.done");
        let requests = harness.upstream.requests.lock().unwrap().clone();
        assert_eq!(requests.len(), 2);
        let body = &requests[1].body;
        match protocol {
            Protocol::Responses => {
                let results: Vec<_> = body["input"]
                    .as_array()
                    .unwrap()
                    .iter()
                    .filter(|item| item["type"] == "function_call_output")
                    .collect();
                assert_eq!(results.len(), 2);
                assert_ne!(results[0]["call_id"], results[1]["call_id"]);
                assert!(results[0]["output"].as_str().unwrap().contains("isError"));
            }
            Protocol::ChatCompletions => {
                let results: Vec<_> = body["messages"]
                    .as_array()
                    .unwrap()
                    .iter()
                    .filter(|item| item["role"] == "tool")
                    .collect();
                assert_eq!(results.len(), 2);
                assert_ne!(results[0]["tool_call_id"], results[1]["tool_call_id"]);
                assert!(results[0]["content"].as_str().unwrap().contains("isError"));
            }
            Protocol::Anthropic => {
                let results = body["messages"].as_array().unwrap().last().unwrap()["content"]
                    .as_array()
                    .unwrap();
                assert_eq!(results.len(), 2);
                assert_ne!(results[0]["tool_use_id"], results[1]["tool_use_id"]);
                assert_eq!(results[0]["is_error"], true);
                assert_eq!(results[1]["is_error"], false);
            }
        }
        harness.bridge.stop().await;
    }
}

#[tokio::test]
async fn tool_results_require_the_exact_socket_request_and_pending_call_and_cannot_be_replayed() {
    let harness = Harness::new().await;
    let provider = harness.add_provider(Protocol::Responses, false).await;
    let (mut socket, auth) = harness.pair().await;
    let (mut other_socket, _) = harness.authenticate(&auth["token"]).await;
    send(&mut socket, tool_chat(&provider, "isolation-request")).await;
    let tool = receive(&mut socket).await;
    send(&mut other_socket, tool_result(&tool)).await;
    assert_eq!(
        receive(&mut other_socket).await["code"],
        "tool_result_rejected"
    );
    for (key, value) in [("requestId", "other-request"), ("callId", "other-call")] {
        let mut wrong = tool_result(&tool);
        wrong[key] = json!(value);
        send(&mut socket, wrong).await;
        assert_eq!(receive(&mut socket).await["code"], "tool_result_rejected");
        assert_eq!(harness.upstream.requests.lock().unwrap().len(), 1);
    }
    send(&mut socket, tool_result(&tool)).await;
    assert_eq!(receive(&mut socket).await["type"], "chat.delta");
    assert_eq!(receive(&mut socket).await["type"], "chat.done");
    send(&mut socket, tool_result(&tool)).await;
    assert_eq!(receive(&mut socket).await["code"], "tool_result_rejected");
    assert_eq!(harness.upstream.requests.lock().unwrap().len(), 2);
    harness.bridge.stop().await;
}

#[tokio::test]
async fn unknown_tools_and_oversized_results_end_without_another_upstream_call() {
    let harness = Harness::new().await;
    let unknown = harness
        .add_model(Protocol::Responses, "fixture-unknown-tool")
        .await;
    let valid = harness.add_provider(Protocol::Responses, false).await;
    let (mut socket, _) = harness.pair().await;
    send(&mut socket, tool_chat(&unknown, "unknown-tool-request")).await;
    let rejected = receive(&mut socket).await;
    assert_eq!(rejected["type"], "chat.error");
    assert_eq!(rejected["code"], "unknown_tool");
    send(&mut socket, tool_chat(&valid, "oversized-tool-result")).await;
    let tool = receive(&mut socket).await;
    let mut result = tool_result(&tool);
    result["result"]["data"] = json!("x".repeat(64 * 1024));
    send(&mut socket, result).await;
    let rejected = receive(&mut socket).await;
    assert_eq!(rejected["type"], "chat.error");
    assert_eq!(rejected["code"], "tool_result_limit");
    assert_eq!(harness.upstream.requests.lock().unwrap().len(), 2);
    harness.bridge.stop().await;
}

#[tokio::test]
async fn cancelling_or_revoking_during_a_tool_wait_never_resumes_upstream() {
    let harness = Harness::new().await;
    let provider = harness.add_provider(Protocol::Responses, false).await;
    let (mut socket, auth) = harness.pair().await;
    send(&mut socket, tool_chat(&provider, "cancel-tool-wait")).await;
    let tool = receive(&mut socket).await;
    send(
        &mut socket,
        json!({"v":1,"type":"chat.cancel","requestId":"cancel-tool-wait"}),
    )
    .await;
    let done = receive(&mut socket).await;
    assert_eq!(done["type"], "chat.done");
    assert_eq!(done["finishReason"], "cancelled");
    send(&mut socket, tool_result(&tool)).await;
    assert_eq!(receive(&mut socket).await["code"], "tool_result_rejected");
    send(&mut socket, tool_chat(&provider, "revoke-tool-wait")).await;
    assert_eq!(receive(&mut socket).await["type"], "tool.call");
    harness
        .bridge
        .revoke_authorization(auth["authorizationId"].as_str().unwrap().into())
        .await
        .unwrap();
    assert_closed(&mut socket).await;
    assert_eq!(harness.upstream.requests.lock().unwrap().len(), 2);
    harness.bridge.stop().await;
}

#[tokio::test]
async fn repeated_tool_calls_have_a_hard_round_limit() {
    let harness = Harness::new().await;
    let provider = harness
        .add_model(Protocol::Responses, "fixture-loop-tools")
        .await;
    let (mut socket, _) = harness.pair().await;
    send(&mut socket, tool_chat(&provider, "bounded-loop")).await;
    for _ in 0..7 {
        let tool = receive(&mut socket).await;
        assert_eq!(tool["type"], "tool.call");
        send(&mut socket, tool_result(&tool)).await;
    }
    let done = receive(&mut socket).await;
    assert_eq!(done["type"], "chat.error");
    assert_eq!(done["code"], "tool_limit");
    assert_eq!(harness.upstream.requests.lock().unwrap().len(), 8);
    harness.bridge.stop().await;
}

#[tokio::test]
async fn pairs_and_streams_all_protocols_without_exposing_keys_or_private_logs() {
    let harness = Harness::new().await;
    let mut providers = Vec::new();
    for protocol in [
        Protocol::Anthropic,
        Protocol::Responses,
        Protocol::ChatCompletions,
    ] {
        providers.push(harness.add_provider(protocol, false).await);
    }
    let (mut socket, auth) = harness.pair().await;
    assert_eq!(auth["providers"].as_array().unwrap().len(), 3);
    for (index, provider) in providers.iter().enumerate() {
        let id = format!("fixture-request-{index}");
        send(&mut socket, chat(provider, &id)).await;
        let mut text = String::new();
        let mut last_seq = 0;
        loop {
            let event = receive(&mut socket).await;
            assert_eq!(event["requestId"], id);
            let seq = event["seq"].as_u64().unwrap();
            assert!(seq > last_seq);
            last_seq = seq;
            match event["type"].as_str().unwrap() {
                "chat.delta" => text.push_str(event["delta"].as_str().unwrap()),
                "chat.done" => {
                    assert_eq!(event["finishReason"], "stop");
                    break;
                }
                _ => panic!("unexpected bridge event: {event}"),
            }
        }
        assert_eq!(text, "fixture answer [fixture_source]");
    }
    let requests = harness.upstream.requests.lock().unwrap().clone();
    assert_eq!(requests.len(), 3);
    assert_eq!(
        requests.iter().map(|r| r.path.as_str()).collect::<Vec<_>>(),
        ["/v1/messages", "/v1/responses", "/v1/chat/completions"]
    );
    assert_eq!(requests[0].headers["x-api-key"], FAKE_KEY);
    assert_eq!(requests[0].headers["anthropic-version"], "2023-06-01");
    assert!(!requests[0].headers.contains_key("authorization"));
    for request in &requests[1..] {
        assert_eq!(
            request.headers["authorization"],
            format!("Bearer {FAKE_KEY}")
        );
    }
    for request in requests {
        assert_eq!(request.body["model"], "fixture-model");
        assert_eq!(request.body["stream"], true);
        assert!(request.body.to_string().contains(PRIVATE_DOCUMENT));
        assert!(request.body.to_string().contains(PRIVATE_PROMPT));
    }
    let logs = harness.bridge.export_logs().await;
    let disk = std::fs::read_to_string(harness._dir.path().join("providers.json")).unwrap();
    let grants = std::fs::read_to_string(harness._dir.path().join("authorizations.json")).unwrap();
    let snapshot = serde_json::to_string(&harness.bridge.snapshot().await).unwrap();
    let token = auth["token"].as_str().unwrap();
    assert_eq!(token.len(), 64);
    for stored in [&logs, &disk, &grants, &snapshot] {
        assert!(!stored.contains(token));
    }
    assert!(!snapshot.contains("tokenHash"));
    for private in [FAKE_KEY, PRIVATE_PROMPT, PRIVATE_DOCUMENT] {
        assert!(!logs.contains(private));
        assert!(!disk.contains(private));
        assert!(!auth.to_string().contains(private));
    }
    socket.close(None).await.unwrap();
    harness.bridge.stop().await;
}

#[tokio::test]
async fn rejects_wrong_origin_host_missing_origin_and_unauthenticated_generation() {
    let harness = Harness::new().await;
    let provider = harness.add_provider(Protocol::Responses, false).await;
    for (origin, host) in [
        (Some("https://untrusted.example.test"), None),
        (None, None),
        (Some(ORIGIN), Some("untrusted.example.test")),
    ] {
        let mut request = format!("ws://127.0.0.1:{}/ws", harness.port)
            .into_client_request()
            .unwrap();
        if let Some(origin) = origin {
            request
                .headers_mut()
                .insert("origin", HeaderValue::from_str(origin).unwrap());
        }
        if let Some(host) = host {
            request
                .headers_mut()
                .insert("host", HeaderValue::from_str(host).unwrap());
        }
        let result = connect_async(request).await;
        match result {
            Err(tokio_tungstenite::tungstenite::Error::Http(response)) => {
                assert_eq!(response.status().as_u16(), 403)
            }
            _ => panic!("untrusted websocket handshake was not rejected"),
        }
    }
    let mut socket = harness.connect().await;
    send(&mut socket, chat(&provider, "unauthenticated-request")).await;
    assert_eq!(receive(&mut socket).await["code"], "auth_required");
    let mut invalid_token_socket = harness.connect().await;
    send(
        &mut invalid_token_socket,
        json!({"v":1,"type":"auth","token":"fixture-invalid-token"}),
    )
    .await;
    assert_eq!(
        receive(&mut invalid_token_socket).await["code"],
        "auth_failed"
    );
    assert!(harness.upstream.requests.lock().unwrap().is_empty());
    harness.bridge.stop().await;
}

#[tokio::test]
async fn cancel_is_terminal_duplicate_request_is_not_replayed_and_revocation_invalidates_token() {
    let harness = Harness::new().await;
    let provider = harness.add_provider(Protocol::Responses, true).await;
    let (mut socket, auth) = harness.pair().await;
    send(&mut socket, chat(&provider, "cancel-request")).await;
    assert_eq!(receive(&mut socket).await["type"], "chat.delta");
    send(
        &mut socket,
        json!({"v":1,"type":"chat.cancel","requestId":"cancel-request"}),
    )
    .await;
    let terminal = receive(&mut socket).await;
    assert_eq!(terminal["type"], "chat.done");
    assert_eq!(terminal["finishReason"], "cancelled");
    send(&mut socket, chat(&provider, "cancel-request")).await;
    assert_eq!(receive(&mut socket).await["code"], "request_rejected");
    assert_eq!(harness.upstream.requests.lock().unwrap().len(), 1);
    harness
        .bridge
        .revoke_connection(auth["connectionId"].as_str().unwrap().into())
        .await
        .unwrap();
    let mut reconnect = harness.connect().await;
    send(
        &mut reconnect,
        json!({"v":1,"type":"auth","token":auth["token"]}),
    )
    .await;
    assert_eq!(receive(&mut reconnect).await["code"], "auth_failed");
    assert_eq!(harness.upstream.requests.lock().unwrap().len(), 1);
    harness.bridge.stop().await;
}

#[tokio::test]
async fn disconnect_cancels_active_generation_without_replaying_it_on_reconnect() {
    let harness = Harness::new().await;
    let provider = harness.add_provider(Protocol::Anthropic, true).await;
    let (mut socket, auth) = harness.pair().await;
    send(&mut socket, chat(&provider, "disconnect-request")).await;
    assert_eq!(receive(&mut socket).await["type"], "chat.delta");
    socket.close(None).await.unwrap();
    wait_disconnected(&harness.bridge).await;
    let snapshot = harness.bridge.snapshot().await;
    assert_eq!(snapshot.authorizations.len(), 1);
    assert!(!snapshot.authorizations[0].connected);
    let mut reconnect = harness.connect().await;
    send(
        &mut reconnect,
        json!({"v":1,"type":"auth","token":auth["token"]}),
    )
    .await;
    let resumed = receive(&mut reconnect).await;
    assert_eq!(resumed["type"], "auth.ok");
    assert_eq!(resumed["token"], auth["token"]);
    assert_eq!(resumed["authorizationId"], auth["authorizationId"]);
    assert_ne!(resumed["connectionId"], auth["connectionId"]);
    assert_eq!(harness.upstream.requests.lock().unwrap().len(), 1);
    harness.bridge.stop().await;
}

#[tokio::test]
async fn same_grant_supports_multiple_sockets_and_connection_revoke_closes_them_all() {
    let harness = Harness::new().await;
    let (mut original_socket, initial_auth) = harness.pair().await;
    let mut replacement = harness.connect().await;
    send(
        &mut replacement,
        json!({"v":1,"type":"auth","token":initial_auth["token"]}),
    )
    .await;
    let resumed = receive(&mut replacement).await;
    assert_eq!(resumed["type"], "auth.ok");
    assert_ne!(resumed["connectionId"], initial_auth["connectionId"]);
    assert_eq!(resumed["authorizationId"], initial_auth["authorizationId"]);
    assert_eq!(resumed["token"], initial_auth["token"]);
    send(&mut original_socket, json!({"v":1,"type":"ping"})).await;
    assert_eq!(receive(&mut original_socket).await["type"], "pong");
    let snapshot = harness.bridge.snapshot().await;
    assert_eq!(snapshot.connections.len(), 2);
    assert_eq!(snapshot.authorizations.len(), 1);
    assert!(snapshot.authorizations[0].connected);
    harness
        .bridge
        .revoke_connection(initial_auth["connectionId"].as_str().unwrap().into())
        .await
        .unwrap();
    assert_closed(&mut original_socket).await;
    assert_closed(&mut replacement).await;
    let mut reconnect = harness.connect().await;
    send(
        &mut reconnect,
        json!({"v":1,"type":"auth","token":resumed["token"]}),
    )
    .await;
    assert_eq!(receive(&mut reconnect).await["code"], "auth_failed");
    assert!(harness.upstream.requests.lock().unwrap().is_empty());
    harness.bridge.stop().await;
}

#[tokio::test]
async fn authorization_survives_service_and_bridge_restart_then_offline_revoke_persists() {
    let mut harness = Harness::new().await;
    let (mut initial, auth) = harness.pair().await;
    harness.bridge.stop().await;
    assert_closed(&mut initial).await;
    assert!(!harness.bridge.snapshot().await.authorizations[0].connected);
    harness
        .bridge
        .start(harness.port, vec![ORIGIN.into()])
        .await
        .unwrap();
    let (mut after_stop, reply) = harness.authenticate(&auth["token"]).await;
    assert_eq!(reply["type"], "auth.ok");
    assert_eq!(reply["token"], auth["token"]);
    assert_eq!(reply["authorizationId"], auth["authorizationId"]);
    harness.bridge.stop().await;
    assert_closed(&mut after_stop).await;
    harness.bridge =
        Bridge::with_secrets(harness._dir.path().into(), harness.secrets.clone()).unwrap();
    assert_eq!(harness.bridge.snapshot().await.authorizations.len(), 1);
    harness
        .bridge
        .start(harness.port, vec![ORIGIN.into()])
        .await
        .unwrap();
    let (mut after_restart, reply) = harness.authenticate(&auth["token"]).await;
    assert_eq!(reply["type"], "auth.ok");
    assert_eq!(reply["authorizationId"], auth["authorizationId"]);
    after_restart.close(None).await.unwrap();
    wait_disconnected(&harness.bridge).await;
    harness
        .bridge
        .revoke_authorization(auth["authorizationId"].as_str().unwrap().into())
        .await
        .unwrap();
    harness.bridge.stop().await;
    harness.bridge =
        Bridge::with_secrets(harness._dir.path().into(), harness.secrets.clone()).unwrap();
    assert!(harness.bridge.snapshot().await.authorizations.is_empty());
    harness
        .bridge
        .start(harness.port, vec![ORIGIN.into()])
        .await
        .unwrap();
    let (_, denied) = harness.authenticate(&auth["token"]).await;
    assert_eq!(denied["code"], "auth_failed");
    assert!(denied.get("providers").is_none());
    harness.bridge.stop().await;
}

#[tokio::test]
async fn saved_authorization_requires_its_exact_origin_even_when_both_origins_are_allowed() {
    let harness = Harness::new().await;
    let (_, auth) = harness.pair().await;
    harness.bridge.stop().await;
    let other = "http://localhost:4392";
    harness
        .bridge
        .start(harness.port, vec![ORIGIN.into(), other.into()])
        .await
        .unwrap();
    let mut socket = harness.connect_origin(other).await;
    send(
        &mut socket,
        json!({"v":1,"type":"auth","token":auth["token"]}),
    )
    .await;
    let denied = receive(&mut socket).await;
    assert_eq!(denied["code"], "auth_failed");
    assert!(denied.get("providers").is_none());
    assert!(harness.bridge.snapshot().await.connections.is_empty());
    let (_, reply) = harness.authenticate(&auth["token"]).await;
    assert_eq!(reply["type"], "auth.ok");
    harness.bridge.stop().await;
}

#[tokio::test]
async fn website_forget_revokes_only_its_authenticated_grant_and_all_its_sockets() {
    let harness = Harness::new().await;
    let (mut first, first_auth) = harness.pair().await;
    let (mut same_grant, _) = harness.authenticate(&first_auth["token"]).await;
    let (mut other, other_auth) = harness.pair().await;
    let mut unauthenticated = harness.connect().await;
    send(
        &mut unauthenticated,
        json!({"v":1,"type":"auth.forget","authorizationId":other_auth["authorizationId"]}),
    )
    .await;
    assert_eq!(receive(&mut unauthenticated).await["code"], "auth_required");
    send(
        &mut first,
        json!({"v":1,"type":"auth.forget","authorizationId":other_auth["authorizationId"]}),
    )
    .await;
    assert_closed(&mut first).await;
    assert_closed(&mut same_grant).await;
    let snapshot = harness.bridge.snapshot().await;
    assert_eq!(snapshot.authorizations.len(), 1);
    assert_eq!(
        snapshot.authorizations[0].id,
        other_auth["authorizationId"].as_str().unwrap()
    );
    send(&mut other, json!({"v":1,"type":"ping"})).await;
    assert_eq!(receive(&mut other).await["type"], "pong");
    let (_, denied) = harness.authenticate(&first_auth["token"]).await;
    assert_eq!(denied["code"], "auth_failed");
    let (_, accepted) = harness.authenticate(&other_auth["token"]).await;
    assert_eq!(accepted["type"], "auth.ok");
    harness.bridge.stop().await;
}

#[tokio::test]
async fn failed_pair_persistence_never_issues_a_token_or_registers_a_session() {
    let harness = Harness::new().await;
    std::fs::create_dir(harness._dir.path().join("authorizations.json")).unwrap();
    let code = harness.bridge.open_pairing().await.unwrap().code;
    let mut socket = harness.connect().await;
    send(&mut socket, json!({"v":1,"type":"pair","code":code})).await;
    let failed = receive(&mut socket).await;
    assert_eq!(failed["code"], "authorization_unavailable");
    assert!(failed.get("token").is_none());
    assert!(failed.get("providers").is_none());
    let snapshot = harness.bridge.snapshot().await;
    assert!(snapshot.authorizations.is_empty());
    assert!(snapshot.connections.is_empty());
    harness.bridge.stop().await;
}

#[tokio::test]
async fn concurrent_auth_and_revoke_cannot_restore_a_revoked_grant() {
    let harness = Harness::new().await;
    let (_, auth) = harness.pair().await;
    let id = auth["authorizationId"].as_str().unwrap().to_owned();
    let mut reconnect = harness.connect().await;
    let (_, revoked) = tokio::join!(
        send(
            &mut reconnect,
            json!({"v":1,"type":"auth","token":auth["token"]})
        ),
        harness.bridge.revoke_authorization(id),
    );
    revoked.unwrap();
    let snapshot = harness.bridge.snapshot().await;
    assert!(snapshot.authorizations.is_empty());
    assert!(snapshot.connections.is_empty());
    let (_, denied) = harness.authenticate(&auth["token"]).await;
    assert_eq!(denied["code"], "auth_failed");
    harness.bridge.stop().await;
}

#[tokio::test]
async fn correct_code_authenticates_immediately_and_wrong_or_replayed_codes_cannot_add_grants() {
    let harness = Harness::new().await;
    let pairing = harness.bridge.open_pairing().await.unwrap();
    let wrong = if pairing.code == "000000" {
        "000001"
    } else {
        "000000"
    };
    let (_, denied) = harness.pair_code(wrong).await;
    assert_eq!(denied["code"], "pairing_failed");
    assert!(denied.get("token").is_none());
    assert!(harness.bridge.snapshot().await.authorizations.is_empty());
    assert!(!harness._dir.path().join("authorizations.json").exists());

    let (mut socket, accepted) = harness.pair_code(&pairing.code).await;
    assert_eq!(accepted["type"], "auth.ok");
    let snapshot = harness.bridge.snapshot().await;
    assert_eq!(snapshot.authorizations.len(), 1);
    assert_eq!(snapshot.authorizations[0].origin, ORIGIN);
    assert!(snapshot.pairing.is_none());
    let before = std::fs::read(harness._dir.path().join("authorizations.json")).unwrap();
    let (_, replayed) = harness.pair_code(&pairing.code).await;
    assert_eq!(replayed["code"], "pairing_failed");
    assert!(replayed.get("token").is_none());
    assert_eq!(harness.bridge.snapshot().await.authorizations.len(), 1);
    assert_eq!(
        std::fs::read(harness._dir.path().join("authorizations.json")).unwrap(),
        before
    );
    socket.close(None).await.unwrap();
    harness.bridge.stop().await;
}

#[tokio::test]
async fn ten_failed_pairing_attempts_invalidate_the_code_until_a_new_window_is_opened() {
    let harness = Harness::new().await;
    let pairing = harness.bridge.open_pairing().await.unwrap();
    let wrong = if pairing.code == "000000" {
        "000001"
    } else {
        "000000"
    };
    for _ in 0..10 {
        let (_, denied) = harness.pair_code(wrong).await;
        assert_eq!(denied["code"], "pairing_failed");
    }
    assert!(harness.bridge.snapshot().await.pairing.is_none());
    let (_, denied) = harness.pair_code(&pairing.code).await;
    assert_eq!(denied["code"], "pairing_failed");
    assert!(harness.bridge.snapshot().await.authorizations.is_empty());
    assert!(!harness._dir.path().join("authorizations.json").exists());
    let (_, accepted) = harness.pair().await;
    assert_eq!(accepted["type"], "auth.ok");
    harness.bridge.stop().await;
}

#[tokio::test]
async fn model_candidates_are_read_only_then_saved_choices_update_live_and_drive_actual_requests() {
    let harness = Harness::new().await;
    for (index, protocol) in [
        Protocol::Responses,
        Protocol::ChatCompletions,
        Protocol::Anthropic,
    ]
    .into_iter()
    .enumerate()
    {
        let provider = harness.add_provider(protocol, false).await;
        let before = harness.bridge.snapshot().await.providers;
        let fetched = harness
            .bridge
            .fetch_provider_models(provider.id.clone())
            .await
            .unwrap();
        assert_eq!(fetched[0].id, "fixture-alternate");
        assert_eq!(fetched[0].efforts, vec![Effort::Default]);
        assert_eq!(harness.bridge.snapshot().await.providers, before);
        let request = harness
            .upstream
            .requests
            .lock()
            .unwrap()
            .last()
            .unwrap()
            .clone();
        assert_eq!(request.path, "/v1/models");
        if protocol == Protocol::Anthropic {
            assert_eq!(request.headers["x-api-key"], FAKE_KEY);
            assert_eq!(request.headers["anthropic-version"], "2023-06-01");
            assert!(!request.headers.contains_key("authorization"));
        } else {
            assert_eq!(
                request.headers["authorization"],
                format!("Bearer {FAKE_KEY}")
            );
        }
        let (mut socket, auth) = harness.pair().await;
        assert!(auth["providers"]
            .as_array()
            .unwrap()
            .iter()
            .all(|value| value["models"].is_array()));
        let mut alternate = fetched[0].clone();
        alternate.efforts.push(Effort::Xhigh);
        alternate.default_effort = Some(Effort::Xhigh);
        let updated = harness
            .bridge
            .save_provider(ProviderInput {
                id: Some(provider.id.clone()),
                name: provider.name.clone(),
                protocol,
                base_url: provider.base_url.clone(),
                model: provider.model.clone(),
                models: vec![ModelOption::configured(provider.model.clone()), alternate],
                auth_kind: provider.auth_kind,
                enabled: true,
                api_key: None,
                source: Some("fixture-private-config-path".into()),
            })
            .await
            .unwrap();
        let event = receive(&mut socket).await;
        assert_eq!(event["type"], "providers.updated");
        assert!(!event.to_string().contains(FAKE_KEY));
        assert!(!event.to_string().contains("fixture-private-config-path"));
        assert!(!event.to_string().contains(&provider.base_url));
        let listed = event["providers"]
            .as_array()
            .unwrap()
            .iter()
            .find(|value| value["id"] == provider.id)
            .unwrap();
        assert_eq!(listed["models"][1]["defaultEffort"], "xhigh");
        let mut request = chat(&updated, &format!("selected-{index}"));
        request["model"] = json!("fixture-alternate");
        request["effort"] = json!("xhigh");
        send(&mut socket, request).await;
        loop {
            let event = receive(&mut socket).await;
            assert_ne!(event["type"], "chat.error", "{event}");
            if event["type"] == "chat.done" {
                break;
            }
        }
        let upstream = harness
            .upstream
            .requests
            .lock()
            .unwrap()
            .last()
            .unwrap()
            .clone();
        assert_eq!(upstream.body["model"], "fixture-alternate");
        let sent_effort = match protocol {
            Protocol::Responses => &upstream.body["reasoning"]["effort"],
            Protocol::ChatCompletions => &upstream.body["reasoning_effort"],
            Protocol::Anthropic => &upstream.body["output_config"]["effort"],
        };
        assert_eq!(sent_effort, "xhigh");
        let sent_count = harness.upstream.requests.lock().unwrap().len();
        for (model, effort, label) in [
            ("unconfigured-model", "default", "model"),
            ("fixture-alternate", "medium", "effort"),
        ] {
            let mut forged = chat(&updated, &format!("forged-{label}-{index}"));
            forged["model"] = json!(model);
            forged["effort"] = json!(effort);
            send(&mut socket, forged).await;
            assert_eq!(receive(&mut socket).await["type"], "chat.error");
        }
        assert_eq!(harness.upstream.requests.lock().unwrap().len(), sent_count);
        harness
            .bridge
            .remove_provider(provider.id.clone())
            .await
            .unwrap();
        let removed = receive(&mut socket).await;
        assert_eq!(removed["type"], "providers.updated");
        assert!(!removed["providers"]
            .as_array()
            .unwrap()
            .iter()
            .any(|value| value["id"] == provider.id));
        socket.close(None).await.unwrap();
    }
    harness.bridge.stop().await;
}

#[tokio::test]
async fn model_fetch_failures_never_follow_redirects_leak_credentials_or_replace_saved_models() {
    let harness = Harness::new().await;
    for (prefix, expected) in [
        ("missing", "不提供模型列表接口"),
        ("redirect", "重定向"),
        ("oversized", "1 MiB"),
    ] {
        let provider = harness
            .bridge
            .save_provider(ProviderInput {
                id: None,
                name: "Gateway".into(),
                protocol: Protocol::Responses,
                base_url: harness
                    .upstream
                    .base_url
                    .replace("/v1", &format!("/{prefix}/v1")),
                model: "custom-alias".into(),
                models: vec![ModelOption::configured("custom-alias")],
                auth_kind: AuthKind::Bearer,
                enabled: true,
                api_key: Some(FAKE_KEY.into()),
                source: None,
            })
            .await
            .unwrap();
        let before = harness.bridge.snapshot().await.providers;
        let error = harness
            .bridge
            .fetch_provider_models(provider.id)
            .await
            .unwrap_err();
        assert!(error.contains(expected), "{error}");
        assert!(!error.contains(FAKE_KEY));
        assert_eq!(harness.bridge.snapshot().await.providers, before);
        assert!(harness.upstream.requests.lock().unwrap().is_empty());
    }
    harness.bridge.stop().await;
}

#[tokio::test]
async fn anthropic_catalog_reads_all_bounded_pages_using_the_same_endpoint() {
    let harness = Harness::new().await;
    let provider = harness
        .bridge
        .save_provider(ProviderInput {
            id: None,
            name: "Paged gateway".into(),
            protocol: Protocol::Anthropic,
            base_url: harness.upstream.base_url.replace("/v1", "/paged/v1"),
            model: "first-page-model".into(),
            models: vec![ModelOption::configured("first-page-model")],
            auth_kind: AuthKind::ApiKey,
            enabled: true,
            api_key: Some(FAKE_KEY.into()),
            source: None,
        })
        .await
        .unwrap();
    let models = harness
        .bridge
        .fetch_provider_models(provider.id)
        .await
        .unwrap();
    assert_eq!(
        models
            .iter()
            .map(|model| model.id.as_str())
            .collect::<Vec<_>>(),
        vec!["first-page-model", "second-page-model"]
    );
    {
        let requests = harness.upstream.requests.lock().unwrap();
        assert_eq!(requests.len(), 2);
        assert!(requests
            .iter()
            .all(|request| request.headers["x-api-key"] == FAKE_KEY));
    }
    harness.bridge.stop().await;
}

#[tokio::test]
async fn catalog_pagination_keeps_prior_models_and_skips_filtered_intermediate_pages() {
    let harness = Harness::new().await;
    for (prefix, expected) in [
        ("empty-final", vec!["first-page-model"]),
        ("empty-middle", vec!["first-page-model", "last-page-model"]),
    ] {
        let provider = harness
            .bridge
            .save_provider(ProviderInput {
                id: None,
                name: "Paged gateway".into(),
                protocol: Protocol::Anthropic,
                base_url: harness
                    .upstream
                    .base_url
                    .replace("/v1", &format!("/{prefix}/v1")),
                model: "first-page-model".into(),
                models: vec![ModelOption::configured("first-page-model")],
                auth_kind: AuthKind::ApiKey,
                enabled: true,
                api_key: Some(FAKE_KEY.into()),
                source: None,
            })
            .await
            .unwrap();
        let models = harness
            .bridge
            .fetch_provider_models(provider.id)
            .await
            .unwrap();
        assert_eq!(
            models
                .iter()
                .map(|model| model.id.as_str())
                .collect::<Vec<_>>(),
            expected
        );
    }
    harness.bridge.stop().await;
}
