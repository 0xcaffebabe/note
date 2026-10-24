//! Real Rust gateway -> packaged-style Node process -> Pi -> mock HTTP model and knowledge site.
use axum::{
    extract::{Request, State},
    http::StatusCode,
    response::{IntoResponse, Response},
    routing::{get, post},
    Json, Router,
};
use bridge_core::{
    model::{AuthKind, Protocol},
    storage::MemorySecretStore,
    Bridge, ProviderInput,
};
use futures_util::{SinkExt, StreamExt};
use serde_json::{json, Value};
use sha2::{Digest, Sha256};
use std::{
    collections::HashMap,
    sync::{
        atomic::{AtomicUsize, Ordering},
        Arc,
    },
    time::Duration,
};
use tokio::net::TcpListener;
use tokio_tungstenite::{
    connect_async,
    tungstenite::{client::IntoClientRequest, http::HeaderValue, Message},
};
#[derive(Clone)]
struct Site {
    assets: Arc<HashMap<String, String>>,
    calls: Arc<AtomicUsize>,
}
async fn asset(State(site): State<Site>, request: Request) -> Response {
    match site.assets.get(request.uri().path()) {
        Some(body) => ([("content-type", "application/json")], body.clone()).into_response(),
        None => StatusCode::NOT_FOUND.into_response(),
    }
}
async fn model(State(site): State<Site>, Json(body): Json<Value>) -> Response {
    let call = site.calls.fetch_add(1, Ordering::SeqCst);
    let (delta, reason) = if call == 0 {
        (
            json!({"role":"assistant","tool_calls":[{"index":0,"id":"read-evidence","type":"function","function":{"name":"get_document","arguments":"{\"docId\":\"guide-example\"}"}}]}),
            "tool_calls",
        )
    } else {
        assert!(body
            .to_string()
            .contains("independently published evidence"));
        (
            json!({"role":"assistant","content":"Answer verified from the website."}),
            "stop",
        )
    };
    let first = json!({"id":"response","object":"chat.completion.chunk","created":1,"model":"mock-model","choices":[{"index":0,"delta":delta,"finish_reason":null}]});
    let last = json!({"id":"response","object":"chat.completion.chunk","created":1,"model":"mock-model","choices":[{"index":0,"delta":{},"finish_reason":reason}],"usage":{"prompt_tokens":100,"completion_tokens":30,"total_tokens":130}});
    (
        [("content-type", "text/event-stream")],
        format!("data: {first}\n\ndata: {last}\n\ndata: [DONE]\n\n"),
    )
        .into_response()
}
fn resource(assets: &mut HashMap<String, String>, value: Value) -> Value {
    let body = value.to_string();
    let hash = format!("{:x}", Sha256::digest(body.as_bytes()));
    let path = format!("/ai/objects/{hash}.json");
    assets.insert(path.clone(), body.clone());
    json!({"path":path,"sha256":hash,"bytes":body.len()})
}
type Socket =
    tokio_tungstenite::WebSocketStream<tokio_tungstenite::MaybeTlsStream<tokio::net::TcpStream>>;
async fn frame(socket: &mut Socket) -> Value {
    tokio::time::timeout(Duration::from_secs(15), async {
        loop {
            if let Message::Text(text) = socket.next().await.unwrap().unwrap() {
                return serde_json::from_str(&text).unwrap();
            }
        }
    })
    .await
    .unwrap()
}
async fn send(socket: &mut Socket, value: Value) {
    socket
        .send(Message::Text(value.to_string().into()))
        .await
        .unwrap();
}
async fn rpc(socket: &mut Socket, id: &str, method: &str, params: Value) -> Value {
    send(
        socket,
        json!({"v":2,"type":"request","id":id,"method":method,"params":params}),
    )
    .await;
    loop {
        let result = frame(socket).await;
        if result["type"] == "response" && result["id"] == id {
            assert!(result.get("error").is_none(), "{result}");
            return result["result"].clone();
        }
    }
}
async fn connect(port: u16, origin: &str) -> Socket {
    let mut request = format!("ws://127.0.0.1:{port}/ws")
        .into_client_request()
        .unwrap();
    request
        .headers_mut()
        .insert("origin", HeaderValue::from_str(origin).unwrap());
    connect_async(request).await.unwrap().0
}
#[tokio::test]
async fn actual_pi_session_reads_remote_tools_survives_socket_close_and_bridge_restart() {
    let mut assets = HashMap::new();
    let document = resource(
        &mut assets,
        json!({"schemaVersion":1,"docId":"guide-example","title":"Example","url":"/guide/example.html","headings":[{"id":"intro","title":"Intro"}],"sections":[{"headingId":"intro","title":"Intro","text":"independently published evidence"}]}),
    );
    let catalog = resource(
        &mut assets,
        json!({"schemaVersion":1,"documents":[{"docId":"guide-example","title":"Example","url":"/guide/example.html","category":"guide","contentHash":format!("sha256:{}",document["sha256"].as_str().unwrap()),"resource":document}]}),
    );
    let graph = resource(&mut assets, json!({"schemaVersion":1,"edges":[]}));
    let clusters = resource(&mut assets, json!({"schemaVersion":1,"clusters":[]}));
    assets.insert("/ai/manifest.json".into(),json!({"schemaVersion":1,"knowledgeBaseId":"note","revision":"a".repeat(64),"capabilities":["catalog","documents","toc","network","related","search"],"resources":{"catalog":catalog,"graph":graph,"clusters":clusters}}).to_string());
    let site = Site {
        assets: Arc::new(assets),
        calls: Arc::new(AtomicUsize::new(0)),
    };
    let listener = TcpListener::bind("127.0.0.1:0").await.unwrap();
    let origin = format!("http://127.0.0.1:{}", listener.local_addr().unwrap().port());
    let app = Router::new()
        .route("/v1/chat/completions", post(model))
        .fallback(get(asset))
        .with_state(site.clone());
    let server = tokio::spawn(async move {
        axum::serve(listener, app).await.unwrap();
    });
    let dir = tempfile::tempdir().unwrap();
    let bridge =
        Bridge::with_secrets(dir.path().into(), Arc::new(MemorySecretStore::new())).unwrap();
    if let Some(entry) = std::env::var_os("NOTE_BRIDGE_TEST_AGENT_ENTRY") {
        bridge.set_agent_command(bridge_core::agent::AgentCommand {
            entry: entry.into(),
            ..bridge_core::agent::AgentCommand::default()
        });
    }
    let provider = bridge
        .save_provider(ProviderInput {
            id: None,
            name: "Isolated Pi model".into(),
            protocol: Protocol::ChatCompletions,
            base_url: format!("{origin}/v1"),
            model: "mock-model".into(),
            models: vec![],
            auth_kind: AuthKind::None,
            enabled: true,
            api_key: None,
            source: None,
        })
        .await
        .unwrap();
    let reservation = TcpListener::bind("127.0.0.1:0").await.unwrap();
    let port = reservation.local_addr().unwrap().port();
    drop(reservation);
    bridge.start(port, vec![origin.clone()]).await.unwrap();
    let code = bridge.open_pairing().await.unwrap().code;
    let mut socket = connect(port, &origin).await;
    send(&mut socket, json!({"v":2,"type":"pair","code":code})).await;
    let auth = frame(&mut socket).await;
    assert_eq!(auth["type"], "auth.ok");
    let session = rpc(
        &mut socket,
        "create",
        "sessions.create",
        json!({"providerId":provider.id,"model":provider.model}),
    )
    .await;
    rpc(
        &mut socket,
        "subscribe",
        "session.subscribe",
        json!({"sessionId":session["id"]}),
    )
    .await;
    rpc(&mut socket,"send","messages.send",json!({"sessionId":session["id"],"clientRequestId":"pi-real-1","providerId":provider.id,"model":provider.model,"text":"Read the guide and summarize."})).await;
    socket.close(None).await.unwrap();
    let mut socket = connect(port, &origin).await;
    send(
        &mut socket,
        json!({"v":2,"type":"auth","token":auth["token"]}),
    )
    .await;
    assert_eq!(frame(&mut socket).await["type"], "auth.ok");
    let mut page = Value::Null;
    for _ in 0..100 {
        page = rpc(
            &mut socket,
            "get",
            "sessions.get",
            json!({"sessionId":session["id"]}),
        )
        .await;
        if page["turns"][0]["status"] != "running" {
            break;
        }
        tokio::time::sleep(Duration::from_millis(30)).await;
    }
    assert_eq!(page["turns"][0]["status"], "complete", "{page}");
    assert_eq!(
        page["turns"][0]["answer"],
        "Answer verified from the website."
    );
    assert_eq!(page["turns"][0]["toolCalls"][0]["status"], "complete");
    assert!(page["turns"][0]["sources"][0]["contentHash"].is_string());
    assert_eq!(site.calls.load(Ordering::SeqCst), 2);
    bridge.stop().await;
    bridge.start(port, vec![origin.clone()]).await.unwrap();
    let mut socket = connect(port, &origin).await;
    send(
        &mut socket,
        json!({"v":2,"type":"auth","token":auth["token"]}),
    )
    .await;
    assert_eq!(frame(&mut socket).await["type"], "auth.ok");
    let restored = rpc(
        &mut socket,
        "restore",
        "sessions.get",
        json!({"sessionId":session["id"]}),
    )
    .await;
    assert_eq!(restored["turns"], page["turns"]);
    assert_eq!(site.calls.load(Ordering::SeqCst), 2);
    bridge.stop().await;
    server.abort();
}
