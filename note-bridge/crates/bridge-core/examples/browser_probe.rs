//! Isolated browser compatibility fixture. No installed CLI configuration or native
//! credential store is read. Pairing is auto-approved ONLY in this test executable.
use axum::{response::IntoResponse, routing::post, Json, Router};
use bridge_core::{
    model::{AuthKind, Protocol},
    storage::MemorySecretStore,
    Bridge, ProviderInput,
};
use serde_json::{json, Value};
use std::{sync::Arc, time::Duration};
use tokio::net::TcpListener;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let data = tempfile::tempdir()?;
    let listener = TcpListener::bind("127.0.0.1:0").await?;
    let upstream_port = listener.local_addr()?.port();
    let upstream = tokio::spawn(async move {
        axum::serve(listener, Router::new().route("/v1/chat/completions", post(|Json(_): Json<Value>| async {
            ([("content-type", "text/event-stream")], "data: {\"choices\":[{\"delta\":{\"content\":\"本机连接验证成功 [D1S1]\"}}]}\n\ndata: {\"choices\":[{\"delta\":{},\"finish_reason\":\"stop\"}]}\n\ndata: [DONE]\n\n").into_response()
        }))).await.unwrap();
    });
    let bridge = Bridge::with_secrets(data.path().into(), Arc::new(MemorySecretStore::new()))?;
    let provider = bridge
        .save_provider(ProviderInput {
            id: None,
            name: "Browser probe (fake upstream)".into(),
            protocol: Protocol::ChatCompletions,
            base_url: format!("http://127.0.0.1:{upstream_port}/v1"),
            model: "probe-model".into(),
            auth_kind: AuthKind::None,
            enabled: true,
            api_key: None,
            source: None,
        })
        .await?;
    bridge
        .start(
            19661,
            vec![
                "https://note.ismy.wang".into(),
                "http://localhost:4391".into(),
                "http://127.0.0.1:4391".into(),
            ],
        )
        .await?;
    let pairing = bridge.open_pairing().await?;
    println!(
        "{}",
        json!({"code":pairing.code,"providerId":provider.id,"port":19661,"testOnly":true})
    );
    let until = tokio::time::sleep(Duration::from_secs(180));
    tokio::pin!(until);
    loop {
        tokio::select! {
            _ = &mut until => break,
            _ = tokio::signal::ctrl_c() => break,
            _ = tokio::time::sleep(Duration::from_millis(100)) => {
                for pending in bridge.snapshot().await.pending_pairings { let _ = bridge.approve_pairing(pending.id, true).await; }
            }
        }
    }
    bridge.stop().await;
    upstream.abort();
    Ok(())
}
