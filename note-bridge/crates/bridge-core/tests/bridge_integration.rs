use axum::{
    body::{Body, Bytes},
    extract::State,
    http::{HeaderMap, StatusCode, Uri},
    response::{IntoResponse, Response},
    routing::post,
    Json, Router,
};
use bridge_core::{
    model::{AuthKind, Protocol},
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

async fn mock_upstream(
    State(requests): State<Arc<Mutex<Vec<RecordedRequest>>>>,
    uri: Uri,
    headers: HeaderMap,
    Json(body): Json<Value>,
) -> Response {
    let slow = body["model"] == "fixture-slow-model";
    requests.lock().unwrap().push(RecordedRequest {
        path: uri.path().into(),
        headers,
        body,
    });
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

struct Harness {
    _dir: TempDir,
    bridge: Bridge,
    port: u16,
    upstream: Upstream,
}

impl Harness {
    async fn new() -> Self {
        let dir = tempfile::tempdir().unwrap();
        let bridge =
            Bridge::with_secrets(dir.path().into(), Arc::new(MemorySecretStore::new())).unwrap();
        let reservation = TcpListener::bind("127.0.0.1:0").await.unwrap();
        let port = reservation.local_addr().unwrap().port();
        drop(reservation);
        bridge.start(port, vec![ORIGIN.into()]).await.unwrap();
        Self {
            _dir: dir,
            bridge,
            port,
            upstream: Upstream::start().await,
        }
    }

    async fn add_provider(&self, protocol: Protocol, slow: bool) -> Provider {
        self.bridge
            .save_provider(ProviderInput {
                id: None,
                name: format!("Fixture {protocol:?}"),
                protocol,
                base_url: self.upstream.base_url.clone(),
                model: if slow {
                    "fixture-slow-model"
                } else {
                    "fixture-model"
                }
                .into(),
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
        let mut request = format!("ws://127.0.0.1:{}/ws", self.port)
            .into_client_request()
            .unwrap();
        request
            .headers_mut()
            .insert("origin", HeaderValue::from_static(ORIGIN));
        connect_async(request).await.unwrap().0
    }

    async fn pair(&self) -> (Socket, Value) {
        let pairing = self.bridge.open_pairing().await.unwrap();
        let mut socket = self.connect().await;
        send(
            &mut socket,
            json!({"v":1,"type":"pair","code":pairing.code}),
        )
        .await;
        let pending = receive(&mut socket).await;
        assert_eq!(pending["type"], "pair.pending");
        let id = pending["pairingId"].as_str().unwrap().to_owned();
        let snapshot = self.bridge.snapshot().await;
        assert!(snapshot
            .pending_pairings
            .iter()
            .any(|candidate| candidate.id == id && candidate.origin == ORIGIN));
        self.bridge.approve_pairing(id, true).await.unwrap();
        let auth = receive(&mut socket).await;
        assert_eq!(auth["type"], "auth.ok");
        assert!(!auth.to_string().contains(FAKE_KEY));
        assert!(!auth.to_string().contains(&self.upstream.base_url));
        (socket, auth)
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

fn chat(provider: &Provider, id: &str) -> Value {
    json!({
        "v":1,"type":"chat.start","requestId":id,"providerId":provider.id,"model":provider.model,
        "messages":[{"role":"user","content":PRIVATE_PROMPT}],"maxOutputTokens":128,
        "context":{"documents":[{"docId":"fixture-doc","title":"Fixture document","url":"https://note.example.test/doc", "contentHash":"fixture-hash","metadata":{},"headings":[],"relatedLinks":[],
            "sources":[{"sourceId":"fixture_source","headingId":"fixture_heading","title":"Fixture section","text":PRIVATE_DOCUMENT}]}]}
    })
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
    timeout(Duration::from_secs(5), async {
        while !harness.bridge.snapshot().await.connections.is_empty() {
            tokio::time::sleep(Duration::from_millis(10)).await;
        }
    })
    .await
    .expect("disconnected session was not removed");
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
async fn resumed_socket_keeps_connection_identity_and_old_snapshot_can_revoke_it() {
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
    assert_eq!(resumed["connectionId"], initial_auth["connectionId"]);
    assert_ne!(resumed["token"], initial_auth["token"]);
    let original_end = timeout(Duration::from_secs(5), original_socket.next())
        .await
        .expect("original socket did not close after replacement");
    assert!(matches!(original_end, None | Some(Ok(Message::Close(_)))));
    let snapshot = harness.bridge.snapshot().await;
    assert_eq!(snapshot.connections.len(), 1);
    assert_eq!(
        snapshot.connections[0].id,
        initial_auth["connectionId"].as_str().unwrap()
    );
    harness
        .bridge
        .revoke_connection(initial_auth["connectionId"].as_str().unwrap().into())
        .await
        .unwrap();
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
