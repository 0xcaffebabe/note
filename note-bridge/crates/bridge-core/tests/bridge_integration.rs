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
