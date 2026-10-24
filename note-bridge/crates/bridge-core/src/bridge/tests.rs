use super::*;
use crate::{protocol::VERSION, storage::MemorySecretStore};
use futures_util::{SinkExt, StreamExt};
use serde_json::{json, Value};
use std::time::Duration;
use tokio::net::TcpListener;
use tokio_tungstenite::{
    connect_async,
    tungstenite::{client::IntoClientRequest, http::HeaderValue, Message as ClientSocketMessage},
};

#[tokio::test]
async fn expired_pairing_code_is_rejected_without_persisting_an_authorization() {
    let dir = tempfile::tempdir().unwrap();
    let bridge =
        Bridge::with_secrets(dir.path().into(), Arc::new(MemorySecretStore::new())).unwrap();
    bridge.set_agent_command(AgentCommand {
        entry: PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("tests/fixtures/worker.mjs"),
        ..AgentCommand::default()
    });
    let reservation = TcpListener::bind("127.0.0.1:0").await.unwrap();
    let port = reservation.local_addr().unwrap().port();
    drop(reservation);
    bridge
        .start(port, vec!["http://localhost:4391".into()])
        .await
        .unwrap();
    let pairing = bridge.open_pairing().await.unwrap();
    // Move the actual server's window into the past without a two-minute sleep.
    bridge
        .inner
        .state
        .lock()
        .await
        .pairing
        .as_mut()
        .unwrap()
        .expires_at = now() - 1;
    let mut request = format!("ws://127.0.0.1:{port}/ws")
        .into_client_request()
        .unwrap();
    request
        .headers_mut()
        .insert("origin", HeaderValue::from_static("http://localhost:4391"));
    let (mut socket, _) = connect_async(request).await.unwrap();
    socket
        .send(ClientSocketMessage::Text(
            json!({"v":VERSION,"type":"pair","code":pairing.code})
                .to_string()
                .into(),
        ))
        .await
        .unwrap();
    let frame = tokio::time::timeout(Duration::from_secs(5), socket.next())
        .await
        .unwrap()
        .unwrap()
        .unwrap();
    let denied: Value = serde_json::from_str(frame.to_text().unwrap()).unwrap();
    assert_eq!(denied["code"], "pairing_failed");
    assert!(denied.get("token").is_none());
    let snapshot = bridge.snapshot().await;
    assert!(snapshot.authorizations.is_empty());
    assert!(snapshot.connections.is_empty());
    assert!(!dir.path().join("authorizations.json").exists());
    bridge.stop().await;
}
