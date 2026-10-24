use axum::{
    extract::State,
    http::{HeaderMap, StatusCode, Uri},
    routing::get,
    Json, Router,
};
use bridge_core::{
    agent::AgentCommand,
    model::{AuthKind, ModelOption, Protocol},
    storage::MemorySecretStore,
    Bridge, Provider, ProviderInput,
};
use futures_util::{SinkExt, StreamExt};
use serde_json::{json, Value};
use std::{
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
type Socket = WebSocketStream<MaybeTlsStream<TcpStream>>;

#[derive(Clone)]
struct RecordedRequest {
    headers: HeaderMap,
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
    requests.lock().unwrap().push(RecordedRequest { headers });
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

fn configure_fixture(bridge: &Bridge) {
    bridge.set_agent_command(AgentCommand {
        entry: std::path::PathBuf::from(env!("CARGO_MANIFEST_DIR"))
            .join("tests/fixtures/worker.mjs"),
        ..AgentCommand::default()
    });
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
        configure_fixture(&bridge);
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
        send(&mut socket, json!({"v":2,"type":"auth","token":token})).await;
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
        send(&mut socket, json!({"v":2,"type":"pair","code":code})).await;
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

#[tokio::test]
async fn same_grant_supports_multiple_sockets_and_connection_revoke_closes_them_all() {
    let harness = Harness::new().await;
    let (mut original_socket, initial_auth) = harness.pair().await;
    let mut replacement = harness.connect().await;
    send(
        &mut replacement,
        json!({"v":2,"type":"auth","token":initial_auth["token"]}),
    )
    .await;
    let resumed = receive(&mut replacement).await;
    assert_eq!(resumed["type"], "auth.ok");
    assert_ne!(resumed["connectionId"], initial_auth["connectionId"]);
    assert_eq!(resumed["authorizationId"], initial_auth["authorizationId"]);
    assert_eq!(resumed["token"], initial_auth["token"]);
    send(&mut original_socket, json!({"v":2,"type":"ping"})).await;
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
        json!({"v":2,"type":"auth","token":resumed["token"]}),
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
    configure_fixture(&harness.bridge);
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
    configure_fixture(&harness.bridge);
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
        json!({"v":2,"type":"auth","token":auth["token"]}),
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
        json!({"v":2,"type":"auth.forget","authorizationId":other_auth["authorizationId"]}),
    )
    .await;
    assert_eq!(receive(&mut unauthenticated).await["code"], "auth_required");
    send(
        &mut first,
        json!({"v":2,"type":"auth.forget","authorizationId":other_auth["authorizationId"]}),
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
    send(&mut other, json!({"v":2,"type":"ping"})).await;
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
    send(&mut socket, json!({"v":2,"type":"pair","code":code})).await;
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
            json!({"v":2,"type":"auth","token":auth["token"]})
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

async fn rpc(socket: &mut Socket, id: &str, method: &str, params: Value) -> Value {
    send(
        socket,
        json!({"v":2,"type":"request","id":id,"method":method,"params":params}),
    )
    .await;
    loop {
        let frame = receive(socket).await;
        if frame["type"] == "response" && frame["id"] == id {
            return frame;
        }
    }
}
#[tokio::test]
async fn rpc_is_authenticated_whitelisted_and_old_protocol_gets_upgrade_error() {
    let harness = Harness::new().await;
    for origin in [None, Some("https://untrusted.example.test")] {
        let mut request = format!("ws://127.0.0.1:{}/ws", harness.port)
            .into_client_request()
            .unwrap();
        if let Some(origin) = origin {
            request
                .headers_mut()
                .insert("origin", HeaderValue::from_str(origin).unwrap());
        }
        assert!(
            matches!(connect_async(request).await,Err(tokio_tungstenite::tungstenite::Error::Http(response)) if response.status()==StatusCode::FORBIDDEN)
        );
    }
    let mut request = format!("ws://127.0.0.1:{}/ws", harness.port)
        .into_client_request()
        .unwrap();
    request
        .headers_mut()
        .insert("origin", HeaderValue::from_static(ORIGIN));
    request
        .headers_mut()
        .insert("host", HeaderValue::from_static("untrusted.example.test"));
    assert!(connect_async(request).await.is_err());
    let mut socket = harness.connect().await;
    send(
        &mut socket,
        json!({"v":2,"type":"request","id":"r1","method":"sessions.list","params":{}}),
    )
    .await;
    assert_eq!(receive(&mut socket).await["code"], "auth_required");
    let code = harness.bridge.open_pairing().await.unwrap().code;
    let mut socket = harness.connect().await;
    send(&mut socket, json!({"v":1,"type":"pair","code":code})).await;
    assert_eq!(receive(&mut socket).await["code"], "unsupported_version");
    let (mut socket, _) = harness.pair_code(&code).await;
    for method in ["initialize", "configure", "bash", "read"] {
        assert_eq!(
            rpc(&mut socket, "invalid", method, json!({})).await["error"]["code"],
            "request_rejected"
        );
    }
    assert!(
        rpc(&mut socket, "list", "sessions.list", json!({})).await["result"]["sessions"].is_array()
    );
    harness.bridge.stop().await;
}
#[tokio::test]
async fn disconnect_detaches_without_cancel_and_restart_reads_persisted_session() {
    let harness = Harness::new().await;
    harness.add_provider(Protocol::Responses, false).await;
    let (mut socket, auth) = harness.pair().await;
    let created = rpc(&mut socket, "create", "sessions.create", json!({})).await;
    let session = created["result"]["id"].clone();
    assert!(session.is_string());
    rpc(
        &mut socket,
        "subscribe",
        "session.subscribe",
        json!({"sessionId":session}),
    )
    .await;
    let sent = rpc(
        &mut socket,
        "send",
        "messages.send",
        json!({"sessionId":session,"clientRequestId":"once","text":"fixture-private-question"}),
    )
    .await;
    assert!(sent["result"]["runId"].is_string());
    socket.close(None).await.unwrap();
    wait_disconnected(&harness.bridge).await;
    let (mut reconnected, _) = harness.authenticate(&auth["token"]).await;
    let page = rpc(
        &mut reconnected,
        "get",
        "sessions.get",
        json!({"sessionId":session}),
    )
    .await;
    assert_eq!(page["result"]["turns"][0]["status"], "running");
    assert_eq!(
        page["result"]["turns"][0]["question"],
        "fixture-private-question"
    );
    let replay = rpc(
        &mut reconnected,
        "replay",
        "messages.send",
        json!({"sessionId":session,"clientRequestId":"once","text":"fixture-private-question"}),
    )
    .await;
    assert_eq!(replay["result"], sent["result"]);
    rpc(
        &mut reconnected,
        "cancel",
        "runs.cancel",
        json!({"sessionId":session}),
    )
    .await;
    harness.bridge.stop().await;
    harness
        .bridge
        .start(harness.port, vec![ORIGIN.into()])
        .await
        .unwrap();
    let (mut restarted, _) = harness.authenticate(&auth["token"]).await;
    let page = rpc(
        &mut restarted,
        "read",
        "sessions.get",
        json!({"sessionId":session}),
    )
    .await;
    assert_eq!(page["result"]["turns"][0]["status"], "cancelled");
    let logs = harness.bridge.export_logs().await;
    assert!(!logs.contains(FAKE_KEY));
    assert!(!logs.contains("fixture-private-question"));
    harness.bridge.stop().await;
}
#[tokio::test]
async fn native_provider_updates_keep_secrets_off_the_website() {
    let harness = Harness::new().await;
    let (mut socket, _) = harness.pair().await;
    let provider = harness.add_provider(Protocol::Responses, false).await;
    let frame = receive(&mut socket).await;
    assert_eq!(frame["type"], "providers.updated");
    assert_eq!(frame["providers"][0]["id"], provider.id);
    assert!(!frame.to_string().contains(FAKE_KEY));
    assert!(!frame.to_string().contains(&harness.upstream.base_url));
    harness.bridge.remove_provider(provider.id).await.unwrap();
    assert!(receive(&mut socket).await["providers"]
        .as_array()
        .unwrap()
        .is_empty());
    harness.bridge.stop().await;
}
